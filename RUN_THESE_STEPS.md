# Quick Fix Instructions - Run These Steps Now

All code fixes have been applied. Follow these steps to get everything working.

## Step 1: Rebuild (REQUIRED)

```bash
npm run build
```

This compiles the fixes for:
- DatabaseManager working without Electron in native host
- Native messaging host using stderr instead of stdout
- Proper database path sharing between Electron and native host

## Step 2: Grant macOS Screen Recording Permission

1. Open **System Settings**
2. Go to **Privacy & Security** → **Screen Recording**
3. Find **Electron** in the list (or run `npm start` once to make it appear)
4. Toggle it **ON**
5. If asked, restart the app

**Note:** This is only needed for desktop tracking. Browser tracking works without it.

See `MACOS_PERMISSIONS.md` for detailed instructions.

## Step 3: Reload Browser Extension

You need to reload the extension after the rebuild:

1. Go to `chrome://extensions/`
2. Find "Productivity Monkey - Browser Tracker"
3. Click the **reload** icon (🔄)
4. Click the extension icon in your toolbar
5. Check diagnostics

**Expected:** Native App should show "✓ Connected" (not ✗ anymore)

## Step 4: Done!

Everything should now work:

### In Chrome Extension Popup:
- ✓ User Config: User ID configured
- ✓ Tracking: Extension is tracking
- ✓ Native App: **Connected** ← This was ✗ before
- ✓ Local Cache: Activities cached

### In Electron App Dashboard:
- ✓ Desktop Tracking: Running (if permission granted)
- ✓ Database: X total records
- ✓ Browser Activity Data: **X browser records found** ← This was 0 before
- ✓ Native Messaging Manifest (Chrome): Installed
- ✓ Native Messaging Manifest (Edge): Installed

## Troubleshooting

### Extension still shows "Failed: Error when communicating..."

1. Make sure you ran `npm run build`
2. Make sure you reloaded the extension in `chrome://extensions/`
3. Try this test:
   ```bash
   node test-native-host.js
   ```
   You should see responses from the host.

### Still getting "active-win requires screen recording permission"

1. Check System Settings → Privacy & Security → Screen Recording
2. Make sure Electron is enabled (toggle ON)
3. Quit the app completely: `pkill -f Electron`
4. Start again: `npm start`

### No browser records in dashboard

1. Make sure extension shows "Native App: Connected ✓"
2. Browse some websites for 10-20 seconds
3. Wait 5 seconds for data to sync
4. Refresh the dashboard

### Extension ID changed or need to reinstall native messaging

If you reloaded the extension from a different location or the ID changed:

```bash
# Get new extension ID from chrome://extensions/
node install-native-messaging.js YOUR_NEW_EXTENSION_ID
```

## What Was Fixed

### Critical Fix #1: Native Messaging Host Crash
- **Problem:** Native host crashed immediately when browser tried to connect
- **Cause:** DatabaseManager tried to import Electron module in Node.js context
- **Fix:** Made DatabaseManager work in both Electron and Node.js contexts

### Critical Fix #2: Native Messaging Protocol Corruption
- **Problem:** Responses from native host were corrupted
- **Cause:** `console.log()` writes to stdout, which is used for the binary protocol
- **Fix:** Changed all logs to `console.error()` (stderr)

### Fix #3: macOS Permission Documentation
- **Problem:** Desktop tracking failed with permission error
- **Cause:** macOS requires Screen Recording permission to read window titles
- **Fix:** Created clear documentation and instructions

## Verification

Run this test to verify native messaging works:

```bash
node test-native-host.js
```

Expected output:
```
Received from host: { "pong": true, "version": "1.0.0" }
Received from host: { "success": true, "userId": "user-...", ... }
Received from host: { "success": true, "saved": true }
```

If you see this, native messaging is working! ✅

## Need More Help?

- Detailed setup: See `SETUP_GUIDE.md`
- Permission help: See `MACOS_PERMISSIONS.md`
- Technical details: See `FINAL_FIX_SUMMARY.md`
- Original fixes: See `FIXES_APPLIED.md`
