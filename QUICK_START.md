# Productivity Monkey - Quick Start Guide

## Zero-Configuration Setup

Both the Electron app and browser extension are designed to work automatically with **no manual configuration required**.

## Installation Steps

### 1. Install & Run Electron App

```bash
npm install
npm run build
npm start
```

The Electron app will automatically:
- ✅ Generate a user ID
- ✅ Start desktop tracking
- ✅ Create the SQLite database
- ✅ Detect installed browser extensions
- ✅ Install native messaging manifests

### 2. Install Browser Extension

#### Chrome/Edge:
1. Open `chrome://extensions/` or `edge://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `browser-extension/chrome/` folder

#### Firefox:
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select any file in `browser-extension/firefox/` folder

The browser extension will automatically:
- ✅ Auto-detect and sync user ID from Electron app
- ✅ Start tracking browser activity
- ✅ Connect to native messaging host
- ✅ Send data to Electron app database

### 3. Verify Everything Works

1. **Check Electron Dashboard** (`npm start`)
   - Desktop Tracking: ✓ Running
   - Database: ✓ Records present
   - Browser Activity Data: ✓ Records found
   - Native Messaging: ✓ Installed

2. **Check Browser Extension** (click extension icon)
   - User Config: ✓ Configured
   - Tracking: ✓ Active
   - Native App: ✓ Connected
   - Local Cache: ✓ Activities cached

## How It Works

### Auto-Configuration Flow:

```
1. Electron App Starts
   └─> Auto-generates userId
   └─> Scans for browser extensions
   └─> Installs native messaging manifests with extension IDs
   └─> Starts desktop tracking

2. Browser Extension Loads
   └─> Connects to native messaging host
   └─> Requests userId from Electron app
   └─> Starts browser tracking
   └─> Sends activity to native host → database

3. Data Flow
   Desktop Activity → Database
   Browser Activity → Native Host → Database
   Both → Dashboard UI
```

## Troubleshooting

### If browser diagnostics show "Native App: Failed"

1. **Restart Electron app** - It auto-installs manifests on startup
2. **Reload extension** - It auto-fetches userId on load
3. **Check console logs**:
   - Electron: Look for "Auto-installed native messaging for extension: [ID]"
   - Browser: Open extension service worker console for errors

### If no browser activity appears in dashboard:

1. Ensure extension is loaded in browser
2. Check extension icon shows "✓ Tracking"
3. Wait 5 seconds for first activity record
4. Refresh diagnostics in dashboard

### Manual Native Messaging Setup (if auto-detection fails):

If auto-detection doesn't find your extension:

1. Get extension ID:
   - Chrome: `chrome://extensions/` → Enable developer mode → Copy ID
   - Edge: `edge://extensions/` → Same process

2. Run from Electron app tray menu:
   - Click tray icon
   - Select "Browser Extension Setup"
   - Enter extension ID
   - Click Install

## What Gets Tracked

### Desktop (Electron Agent):
- Active application name
- Window title
- Idle time detection
- Keyboard/mouse activity counts

### Browser (Extension):
- Active tab URL and title
- Domain categorization (deep work/shallow/distracted)
- Keystroke, scroll, click counts
- Idle detection
- Media playback detection

### Privacy:
- ✅ Keystrokes counted, NOT logged
- ✅ No screenshots
- ✅ All data stored locally in SQLite
- ✅ No cloud sync (unless you add it)

## Next Steps

- View real-time metrics in Dashboard
- Generate weekly reports
- Compare team productivity (if using multi-user setup)
- Customize activity categories in `background.js`
