# macOS Gatekeeper Workaround

## The Problem

When you download and try to open Productivity Monkey on macOS, you might see this error:

> "Productivity Monkey" is damaged and can't be opened. You should move it to the Trash.

This happens because **the app is not signed with an Apple Developer ID certificate**. macOS Gatekeeper blocks unsigned apps downloaded from the internet as a security measure.

**Important**: This is a false positive - the app is not actually damaged or malicious.

---

## Quick Fix (For Users)

There are several ways to bypass Gatekeeper and open the app:

### Method 1: Right-Click to Open (Easiest)

1. **Locate the downloaded DMG file** in your Downloads folder
2. **Double-click the DMG** to mount it
3. **Don't drag to Applications yet** - stay in the DMG window
4. **Right-click (or Control-click)** on "Productivity Monkey.app"
5. **Select "Open"** from the context menu
6. **Click "Open"** in the dialog that appears
7. Now you can **drag it to Applications** and it will work normally

### Method 2: Remove Quarantine Flag (Recommended for Developers)

If you've already moved the app to Applications:

```bash
# Remove quarantine attribute from the app
xattr -cr "/Applications/Productivity Monkey.app"

# Or from the DMG before mounting
xattr -cr ~/Downloads/Productivity-Monkey-*.dmg
```

After running this command, the app will open normally.

### Method 3: System Settings

If you already tried to open it and got the error:

1. Go to **System Settings** > **Privacy & Security**
2. Scroll down to the **Security** section
3. You should see a message: *"Productivity Monkey" was blocked from use because it is not from an identified developer*
4. Click **"Open Anyway"**
5. Try opening the app again
6. Click **"Open"** when prompted

---

## For Distribution (Developer Instructions)

The proper solution is to **sign the app with an Apple Developer ID certificate**. This requires:

1. **Apple Developer Program membership** ($99/year)
   - Enroll at: https://developer.apple.com/programs/

2. **Developer ID Application certificate**
   - Create in Apple Developer portal
   - Download and install in Keychain

3. **Update electron-builder configuration**
   - See `docs/MACOS_CODE_SIGNING.md` for details

4. **Notarize the app** (required for macOS 10.15+)
   - Automated via electron-notarize

---

## Why This Matters

### Current State (Unsigned)
- ❌ Users get scary "damaged" error message
- ❌ Requires manual workaround for each user
- ❌ Looks unprofessional
- ❌ Users might think it's malware

### With Proper Signing
- ✅ No Gatekeeper warnings
- ✅ Smooth user experience
- ✅ Professional distribution
- ✅ Trusted by macOS

---

## Temporary Distribution Notes

Until we get proper code signing set up, include these instructions with downloads:

### For DMG Downloads

**macOS Users**: After downloading, right-click the app and select "Open" instead of double-clicking. This bypasses Gatekeeper security. The app is safe - it's just not signed with an Apple Developer certificate yet.

Alternatively, run this command:
```bash
xattr -cr ~/Downloads/Productivity-Monkey-*.dmg
```

---

## Next Steps

1. **Short term**: Document this workaround in release notes
2. **Medium term**: Get Apple Developer account
3. **Long term**: Implement proper signing and notarization

See `docs/MACOS_CODE_SIGNING.md` for full setup instructions.
