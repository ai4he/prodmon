# Fixes Applied - Productivity Monkey

This document summarizes all the fixes applied to resolve the browser extension and native messaging issues.

## Issues Fixed

### 1. ✓ Chrome Extension Error: "Extension context invalidated"

**Location:** `browser-extension/chrome/content.js:41`

**Problem:** When the extension is reloaded or updated, content scripts that are still running on pages lose their connection to the extension runtime. Any calls to `chrome.runtime.sendMessage()` would throw an "Extension context invalidated" error.

**Solution:** Wrapped all `chrome.runtime.sendMessage()` calls in try-catch blocks with proper error callbacks:

```javascript
// Before:
chrome.runtime.sendMessage({ type: 'activity', ...activityType });

// After:
try {
  chrome.runtime.sendMessage({
    type: 'activity',
    ...activityType
  }, () => {
    if (chrome.runtime.lastError) {
      console.log('Extension context invalidated, content script needs reload');
    }
  });
} catch (error) {
  // Extension context invalidated - do nothing
  console.log('Extension context invalidated');
}
```

**Impact:** Users no longer see error messages in the console when the extension is reloaded. The extension gracefully handles context invalidation.

---

### 2. ✓ Native Messaging Error: "Specified native messaging host not found"

**Location:** `background.js:253`

**Problem:** The browser extension couldn't find the native messaging host because:
1. The manifest files weren't installed in the correct location
2. The extension ID in the manifest didn't match the actual extension ID (changes when loaded unpacked)
3. The native-host-runner.js had incorrect path resolution

**Solution:**

#### A. Fixed `native-host-runner.js` path resolution

```javascript
// Before:
const { DatabaseManager } = require('./dist/database/schema');

// After:
const path = require('path');
let basePath = __dirname;
if (basePath.includes('resources')) {
  basePath = path.join(basePath, 'app');
}
const { DatabaseManager } = require(path.join(basePath, 'dist/database/schema'));
```

#### B. Created `install-native-messaging.js` script

A new automated script that:
- Takes the extension ID as a parameter
- Creates wrapper scripts to run the native host
- Installs manifest files for both Chrome and Edge
- Handles platform-specific paths (macOS, Windows, Linux)
- Sets up registry entries on Windows

**Usage:**
```bash
node install-native-messaging.js YOUR_EXTENSION_ID
```

**Impact:** Users can now easily install the native messaging host after loading the extension in developer mode.

---

### 3. ✓ No Browser Activity Data in Dashboard

**Problem:** Even when native messaging was set up, no browser data appeared because:
1. The `NativeMessagingHost` class tried to use `electron-store` in a Node.js context
2. electron-store requires the Electron app to be running
3. The native host runs as a standalone Node.js process

**Solution:** Modified `src/browser/native-host.ts` to read config directly from file:

```typescript
// Before:
const Store = require('electron-store');
const store = new Store();
const config = store.get('config');

// After:
private readConfig(): any {
  const { readFileSync, existsSync } = require('fs');
  const { join } = require('path');
  const { homedir } = require('os');

  const platform = process.platform;
  let configPath: string;

  if (platform === 'darwin') {
    configPath = join(homedir(), 'Library', 'Application Support', 'prodmon', 'config.json');
  } else if (platform === 'win32') {
    configPath = join(homedir(), 'AppData', 'Roaming', 'prodmon', 'config.json');
  } else {
    configPath = join(homedir(), '.config', 'prodmon', 'config.json');
  }

  if (existsSync(configPath)) {
    const content = readFileSync(configPath, 'utf8');
    const data = JSON.parse(content);
    return data.config;
  }

  return null;
}
```

**Impact:** The native messaging host can now read user config without requiring Electron, allowing browser data to be saved correctly.

---

## Files Modified

### Modified Files:
1. `browser-extension/chrome/content.js` - Added error handling for extension context invalidation
2. `native-host-runner.js` - Fixed path resolution for standalone execution
3. `src/browser/native-host.ts` - Replaced electron-store with direct file reading
4. `browser-extension/README.md` - Updated installation instructions

### New Files:
1. `install-native-messaging.js` - Automated installation script for native messaging manifests
2. `SETUP_GUIDE.md` - Step-by-step guide to fix all issues
3. `FIXES_APPLIED.md` - This document

---

## Testing the Fixes

### 1. Rebuild the Application

```bash
npm run build
```

Expected output: TypeScript compilation succeeds, Electron app builds successfully.

### 2. Start the Electron App

```bash
npm start
```

Expected output:
```
Starting Productivity Monkey Agent...
Agent started successfully
```

### 3. Load Browser Extension

1. Open Chrome: `chrome://extensions/`
2. Enable Developer mode
3. Load unpacked: `browser-extension/chrome/`
4. Copy the extension ID (e.g., `kbfnbcaeplbcioakkpcpgfkobkghlhen`)

### 4. Install Native Messaging

```bash
node install-native-messaging.js YOUR_EXTENSION_ID
```

Expected output:
```
Installing native messaging host for extension: YOUR_EXTENSION_ID
Found node at: /usr/local/bin/node
Created wrapper script at: ~/.local/bin/prodmon-native-host.sh
✓ Chrome native messaging host installed
✓ Edge native messaging host installed
✓ Installation complete!
```

### 5. Verify Extension Diagnostics

Click the extension icon in Chrome toolbar. The popup should show:

```
Diagnostics
User Config: User ID: user-1759696...     ✓
Tracking: Extension is tracking            ✓
Native App: Connected                      ✓ (was ✗ before)
Local Cache: 83 activities cached locally  ✓
```

### 6. Verify Dashboard Diagnostics

In the Electron app dashboard:

```
Integration Diagnostics
Desktop Tracking: Running                              ✓
Database: 483 total records, 467 in last hour         ✓
Browser Activity Data: X browser records found        ✓ (was 0 before)
Native Messaging Manifest (Chrome): Installed         ✓ (was ✗ before)
Native Messaging Manifest (Edge): Installed           ✓ (was ✗ before)
```

---

## Verification Commands

### Check Native Messaging Manifest Exists

**macOS:**
```bash
ls ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.prodmon.app.json
cat ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.prodmon.app.json
```

**Windows:**
```powershell
dir "$env:USERPROFILE\AppData\Local\Productivity Monkey\NativeMessagingHost\com.prodmon.app.json"
```

**Linux:**
```bash
ls ~/.config/google-chrome/NativeMessagingHosts/com.prodmon.app.json
```

### Test Native Messaging Connection

In Chrome DevTools console (F12):

```javascript
chrome.runtime.sendNativeMessage('com.prodmon.app', {type: 'ping'}, (response) => {
  console.log('Response:', response);
});
```

Expected response:
```javascript
{pong: true, version: "1.0.0"}
```

### Check Browser Activity in Database

```bash
# macOS
sqlite3 ~/Library/Application\ Support/prodmon/database.sqlite "SELECT COUNT(*) FROM activity_records WHERE app_name LIKE 'Browser%';"
```

Expected: A number greater than 0 after browsing for a minute.

---

## Summary

All three major issues have been resolved:

1. ✅ **Extension context invalidation** - Content script errors are now caught gracefully
2. ✅ **Native messaging host not found** - Installation script makes setup easy
3. ✅ **No browser activity data** - Native host can now access config and save data

The browser extension should now work correctly and sync data with the Electron app.

## Next Steps for Users

1. Follow `SETUP_GUIDE.md` for step-by-step instructions
2. Run `npm run build` to compile the fixes
3. Load the extension in Chrome
4. Run `node install-native-messaging.js YOUR_EXTENSION_ID`
5. Verify diagnostics show all green checkmarks
6. Start using the app normally

---

## Technical Notes

### Why Extension Context Invalidation Happens

When a Chrome extension is reloaded (during development) or updated, Chrome immediately invalidates all content scripts that are currently running on web pages. This is a security feature to prevent orphaned scripts from continuing to run. The content scripts need to handle this gracefully.

### Why Native Messaging Setup is Complex

Chrome's native messaging architecture requires:
1. A manifest JSON file in a specific location (different per OS)
2. The manifest must contain the exact extension ID
3. Developer mode extensions get a different ID each time they're loaded from a different path
4. The path in the manifest must point to an executable that handles stdio communication
5. On Windows, registry entries are required

This is why the `install-native-messaging.js` script is necessary - it handles all these platform-specific details.

### Why electron-store Doesn't Work in Native Host

electron-store is designed to work within an Electron app where the `app` module is available. The native messaging host runs as a standalone Node.js process without Electron, so we need to read the config file directly from disk instead.
