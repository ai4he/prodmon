# macOS Code Signing Setup

This guide explains how to properly sign and notarize Productivity Monkey for macOS distribution.

---

## Prerequisites

### 1. Apple Developer Program Membership

**Cost**: $99/year
**Sign up**: https://developer.apple.com/programs/

You need this to:
- Get a Developer ID Application certificate
- Notarize apps for distribution outside the Mac App Store

### 2. Xcode Command Line Tools

```bash
xcode-select --install
```

---

## Step 1: Get Developer ID Certificate

### Via Xcode (Recommended)

1. **Open Xcode** > **Settings** (Cmd+,)
2. Go to **Accounts** tab
3. **Add your Apple ID** if not already added
4. Select your account > **Manage Certificates**
5. Click **+** > **Developer ID Application**
6. Click **Done**

The certificate is now in your Keychain.

### Via Apple Developer Portal (Alternative)

1. Go to https://developer.apple.com/account/resources/certificates/list
2. Click **+** to create new certificate
3. Select **Developer ID Application**
4. Follow prompts to create Certificate Signing Request (CSR)
5. Download and double-click to install in Keychain

### Verify Installation

```bash
security find-identity -v -p codesigning
```

You should see something like:
```
1) ABC123DEF456... "Developer ID Application: Your Name (TEAM_ID)"
```

---

## Step 2: Set Up App-Specific Password

For notarization, you need an app-specific password:

1. Go to https://appleid.apple.com/account/manage
2. **Sign in** with your Apple ID
3. In the **Security** section, click **App-Specific Passwords**
4. Click **+** to generate new password
5. **Save this password** - you'll need it for notarization

---

## Step 3: Configure Environment Variables

Add to your `~/.zshrc` or `~/.bash_profile`:

```bash
# macOS Code Signing
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="your-team-id"  # Find in Apple Developer portal
```

```bash
# macOS Code Signing
export APPLE_ID="ctoxtli@me.com"
export APPLE_ID_PASSWORD="pior-rlev-sszz-hkhj"
export APPLE_TEAM_ID="NDHVA6YZ3C"
```

Then reload:
```bash
source ~/.zshrc
```

---

## Step 4: Update electron-builder Configuration

Update `electron-builder.yml`:

```yaml
mac:
  target:
    target: dmg
    arch:
      - x64
      - arm64
  category: public.app-category.productivity
  artifactName: Productivity-Monkey-${version}-${arch}.${ext}
  # Code signing
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  # The identity will be auto-discovered from Keychain

afterSign: scripts/notarize.js  # Optional: automatic notarization
```

---

## Step 5: Create Entitlements File

Create `build/entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <!-- Required for Hardened Runtime -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>

    <!-- Accessibility (for tracking active window) -->
    <key>com.apple.security.automation.apple-events</key>
    <true/>

    <!-- Network access (for server communication) -->
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
  </dict>
</plist>
```

---

## Step 6: (Optional) Set Up Automatic Notarization

### Install electron-notarize

```bash
npm install --save-dev electron-notarize
```

### Create Notarization Script

Create `scripts/notarize.js`:

```javascript
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`Notarizing ${appPath}...`);

  return await notarize({
    appBundleId: 'com.prodmon.app',
    appPath: appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

### Update package.json

```json
{
  "devDependencies": {
    "electron-notarize": "^1.2.2"
  }
}
```

---

## Step 7: Build with Signing

```bash
# Build with automatic signing
npm run build:client:mac

# Or with explicit identity (if you have multiple)
CSC_NAME="Developer ID Application: Your Name (TEAM_ID)" npm run build:client:mac
```

### What Happens During Build

1. ✅ TypeScript compilation
2. ✅ Icon generation
3. ✅ Electron packaging
4. ✅ **Code signing** (all executables and frameworks)
5. ✅ DMG creation
6. ✅ **Notarization** (if configured)
7. ✅ Stapling notarization ticket to DMG

---

## Step 8: Verify Signing

### Check Code Signature

```bash
codesign -dv --verbose=4 "build/mac-arm64/Productivity Monkey.app"
```

Should show:
```
Authority=Developer ID Application: Your Name (TEAM_ID)
...
Signature=adhoc  <-- Should NOT be adhoc if properly signed
```

### Check Notarization

```bash
spctl -a -vvv -t install "build/Productivity-Monkey-1.0.0-arm64.dmg"
```

Should show:
```
build/Productivity-Monkey-1.0.0-arm64.dmg: accepted
source=Notarized Developer ID
```

---

## Troubleshooting

### "No identity found"

```bash
# Check available identities
security find-identity -v -p codesigning

# If certificate is expired, get a new one from Apple Developer portal
```

### "Failed to notarize"

- Verify `APPLE_ID` and `APPLE_ID_PASSWORD` are set correctly
- Make sure you're using an **app-specific password**, not your Apple ID password
- Check `APPLE_TEAM_ID` matches your Developer Team ID

### "Signature is adhoc"

This means signing failed silently. Check:
- Certificate is valid and not expired
- Identity name matches exactly
- No special characters in certificate name

### Manual Notarization

If automatic notarization fails:

```bash
# 1. Upload to Apple
xcrun notarytool submit "build/Productivity-Monkey-1.0.0-arm64.dmg" \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_ID_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

# 2. Staple ticket to DMG
xcrun stapler staple "build/Productivity-Monkey-1.0.0-arm64.dmg"

# 3. Verify
xcrun stapler validate "build/Productivity-Monkey-1.0.0-arm64.dmg"
```

---

## Distribution Checklist

Before releasing:

- [ ] Certificate is valid and installed
- [ ] Environment variables set correctly
- [ ] Entitlements file created
- [ ] Build completes without signing errors
- [ ] `codesign -dv` shows valid Developer ID
- [ ] `spctl -a` accepts the app/DMG
- [ ] Test on a fresh Mac (not your dev machine)
- [ ] User doesn't see Gatekeeper warnings

---

## Cost Summary

- **Apple Developer Program**: $99/year
- **Notarization**: Free (included with Developer Program)
- **Code signing**: Free (included with Developer Program)

**Total**: $99/year

---

## Comparison: Unsigned vs Signed

| Feature | Unsigned (Current) | Signed & Notarized |
|---------|-------------------|-------------------|
| User Experience | ❌ "Damaged" error | ✅ Opens normally |
| Workarounds Needed | ❌ Yes | ✅ None |
| Professional | ❌ No | ✅ Yes |
| macOS Trust | ❌ Blocked | ✅ Trusted |
| Distribution | ⚠️ Possible with workarounds | ✅ Seamless |
| Cost | Free | $99/year |

---

## Next Steps

1. **Immediate**: Use workarounds documented in `MACOS_GATEKEEPER_WORKAROUND.md`
2. **Short term**: Enroll in Apple Developer Program
3. **Medium term**: Set up code signing as documented above
4. **Long term**: Implement automatic notarization for all releases

---

## References

- [Apple Developer Program](https://developer.apple.com/programs/)
- [Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/)
- [Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [electron-builder Code Signing](https://www.electron.build/code-signing)
- [electron-notarize](https://github.com/electron/electron-notarize)
