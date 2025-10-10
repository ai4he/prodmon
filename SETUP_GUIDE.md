# Productivity Monkey - Quick Setup Guide

This guide will help you fix the browser extension integration issues.

## Current Issues

1. ✓ **Extension context invalidated error** - Fixed in content.js
2. ✓ **Native messaging host not found** - Need to install manifests manually
3. ✓ **No browser activity data** - Will work after native messaging is configured

## Step-by-Step Fix

### 1. Grant macOS Screen Recording Permission

Before running the app, you need to grant Screen Recording permission for desktop tracking to work.

**Important:** See `MACOS_PERMISSIONS.md` for detailed instructions.

Quick steps:
1. Go to System Settings → Privacy & Security → Screen Recording
2. Enable permission for "Electron" or "Productivity Monkey"
3. If the app isn't listed, run it once (it will error), then it will appear

**Note:** Without this permission, desktop tracking won't work, but browser tracking will still function.

### 2. Rebuild the Application

Rebuild the TypeScript code with the latest fixes:

```bash
npm run build
```

### 3. Start the Electron App

```bash
npm start
```

The app should start and show:
- ✓ Desktop Tracking: Running (if permission granted)
- ✓ Database: Working
- ✗ Browser Activity Data: 0 records (we'll fix this next)

If you see "Error capturing activity: active-win requires screen recording permission", see `MACOS_PERMISSIONS.md`.

### 4. Install Browser Extension

#### For Chrome/Edge:

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Navigate to: `browser-extension/chrome/`
5. Click **Select**
6. **Copy the Extension ID** shown below the extension name (it's a long string like `kbfnbcaeplbcioakkpcpgfkobkghlhen`)

### 5. Install Native Messaging Host

This is the critical step that connects the browser extension to the Electron app.

From the project root directory:

```bash
node install-native-messaging.js YOUR_EXTENSION_ID
```

**Replace `YOUR_EXTENSION_ID` with the actual ID you copied in step 3.**

Example:
```bash
node install-native-messaging.js kbfnbcaeplbcioakkpcpgfkobkghlhen
```

You should see:
```
Installing native messaging host for extension: kbfnbcaeplbcioakkpcpgfkobkghlhen
Found node at: /usr/local/bin/node
Created wrapper script at: ~/.local/bin/prodmon-native-host.sh
✓ Chrome native messaging host installed at: ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.prodmon.app.json
✓ Edge native messaging host installed at: ~/Library/Application Support/Microsoft Edge/NativeMessagingHosts/com.prodmon.app.json

✓ Installation complete!
```

### 6. Reload the Extension

1. Go back to `chrome://extensions/`
2. Click the **reload** icon (circular arrow) on the Productivity Monkey extension
3. Click the extension icon in your browser toolbar
4. Check the **Diagnostics** section

You should now see:
- ✓ User Config: User ID configured
- ✓ Tracking: Extension is tracking
- ✓ **Native App: Connected** (this should now be green!)
- ✓ Local Cache: Activities cached

### 7. Verify Everything Works

1. Browse some websites for a minute
2. Open the Electron app dashboard
3. Check the **Integration Diagnostics** section

You should now see:
- ✓ Desktop Tracking: Running
- ✓ Database: Records present
- ✓ **Browser Activity Data: Browser records found!** (previously 0)
- ✓ Native Messaging Manifest (Chrome): Installed
- ✓ Native Messaging Manifest (Edge): Installed

## Troubleshooting

### Extension shows "Extension context invalidated"

This is normal when the extension is reloaded. The error is now caught gracefully and won't prevent tracking.

**Fix:** Just reload the page where you see the error.

### Native App status shows "Failed: Specified native messaging host not found"

This means the native messaging manifest wasn't installed correctly.

**Fix:**
1. Make sure you ran `node install-native-messaging.js YOUR_EXTENSION_ID`
2. Check the extension ID is correct (copy it from chrome://extensions)
3. Verify the manifest file exists:
   - macOS: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.prodmon.app.json`
   - Windows: `%USERPROFILE%\AppData\Local\Productivity Monkey\NativeMessagingHost\com.prodmon.app.json`

### Still no browser activity data in dashboard

1. Make sure the Electron app is running (`npm start`)
2. Check extension popup shows "Extension is tracking" ✓
3. Check extension popup shows "Native App: Connected" ✓
4. Wait 5-10 seconds for data to sync
5. Refresh the dashboard

### Test native messaging connection

Open Chrome DevTools while on any webpage:
1. Press F12
2. Go to Console
3. Run:
```javascript
chrome.runtime.sendNativeMessage('com.prodmon.app', {type: 'ping'}, (response) => {
  console.log('Response:', response);
});
```

You should see:
```
Response: {pong: true, version: "1.0.0"}
```

If you see an error, the native messaging host is not installed correctly.

## What Changed

### Fixed Files:

1. **browser-extension/chrome/content.js**
   - Added try-catch blocks around all `chrome.runtime.sendMessage` calls
   - Added error callbacks to handle extension context invalidation
   - Extension now gracefully handles reloads without throwing errors

2. **native-host-runner.js**
   - Fixed path resolution to work when called from browser
   - Added automatic database directory creation
   - Now works correctly as standalone Node.js process

3. **src/browser/native-host.ts**
   - Removed electron-store dependency (doesn't work in Node.js context)
   - Added direct config file reading from electron-store's location
   - Now reads config.json directly from disk

4. **install-native-messaging.js** (new)
   - Automated script to install native messaging manifests
   - Works for both Chrome and Edge
   - Handles all platform differences (macOS, Windows, Linux)

## Next Steps

Once everything is working:

1. Use the app normally - browse websites, work on your computer
2. Check the dashboard to see your productivity metrics
3. View weekly reports to see patterns and insights
4. Adjust tracking settings as needed

## Need Help?

If you're still having issues:

1. Check browser console for errors (F12 → Console)
2. Check Electron app console output
3. Verify all files exist in the correct locations
4. Try uninstalling and reinstalling the extension
5. Make sure the Electron app is running before loading the extension
