# Productivity Monkey - Complete Setup Guide

## Quick Start

For maximum tracking precision, you need BOTH components:
1. ✅ **Electron Desktop App** - Tracks desktop applications
2. ✅ **Browser Extension** - Tracks exact websites and URLs (CRITICAL for accuracy)

## Part 1: Desktop App Setup

### 1. Install Dependencies

```bash
cd prodmon
npm install
```

### 2. Build the Application

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Package the Electron app
- Create distributable in `build/` directory

### 3. Run the App

```bash
npm start
```

### 4. Initial Configuration

On first launch:
1. Enter your name
2. Enter your email
3. Enter your job title
4. Enter your team name
5. Enter your department
6. (Optional) Enter manager ID if you have one

The app will create your user profile and start tracking.

## Part 2: Browser Extension Setup (CRITICAL)

### Why Browser Extension is Required

**Without browser extension:**
- ❌ Only sees "Google Chrome" or "Firefox" as application name
- ❌ Cannot track which websites you visit
- ❌ Cannot measure time spent on specific sites
- ❌ Cannot categorize web activity (productive vs distracting)
- ❌ Misses 80%+ of knowledge worker activity

**With browser extension:**
- ✅ Tracks exact URLs (github.com, slack.com, stackoverflow.com, etc.)
- ✅ Measures precise time on each site
- ✅ Detects engagement (typing, clicking, scrolling)
- ✅ Identifies productive vs distracting browsing
- ✅ Detects media playback (YouTube, Spotify, etc.)
- ✅ Tracks context switching between tabs

### Chrome/Edge Installation

1. **Build the desktop app first** (must be done before extension setup)

2. **Load the extension:**
   ```bash
   # Open Chrome or Edge
   # Navigate to chrome://extensions or edge://extensions
   # Enable "Developer mode" (toggle in top-right)
   # Click "Load unpacked"
   # Select folder: prodmon/browser-extension/chrome
   ```

3. **Get your Extension ID:**
   - In `chrome://extensions`, find "Productivity Monkey"
   - Copy the ID shown below the extension name
   - Example: `abcdefghijklmnopqrstuvwxyz123456`

4. **Install Native Messaging:**

   **Option A: Automatic (Recommended)**
   - Open Productivity Monkey desktop app
   - Click system tray icon → "Browser Extension Setup"
   - Click "Install for Chrome/Edge"
   - Paste your extension ID
   - Click Install

   **Option B: Manual**
   ```bash
   # macOS
   mkdir -p ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts

   # Edit browser-extension/chrome/com.prodmon.app.json
   # Replace EXTENSION_ID_PLACEHOLDER with your actual extension ID

   # Copy to Chrome directory
   cp browser-extension/chrome/com.prodmon.app.json ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/

   # For Edge, also copy to:
   mkdir -p ~/Library/Application\ Support/Microsoft\ Edge/NativeMessagingHosts
   cp browser-extension/chrome/com.prodmon.app.json ~/Library/Application\ Support/Microsoft\ Edge/NativeMessagingHosts/
   ```

5. **Verify Extension is Working:**
   - Click the Productivity Monkey extension icon
   - Should show "Status: Tracking" with green indicator
   - Should display current tab title

### Firefox Installation

1. **Load the extension:**
   ```bash
   # Open Firefox
   # Navigate to about:debugging#/runtime/this-firefox
   # Click "Load Temporary Add-on"
   # Select: prodmon/browser-extension/firefox/manifest.json
   ```

2. **Note:** Firefox temporary extensions are removed when browser closes
   - For permanent installation, extension must be signed by Mozilla
   - Alternative: Use Firefox Developer Edition or Nightly for unsigned extensions

3. **Install Native Messaging:**
   ```bash
   # macOS
   mkdir -p ~/.mozilla/native-messaging-hosts
   cp browser-extension/chrome/com.prodmon.app.json ~/.mozilla/native-messaging-hosts/
   ```

## Part 3: Verification

### Test Desktop Tracking

1. Open the Productivity Monkey app
2. Switch between different applications (VSCode, Slack, Terminal)
3. Wait 10 seconds
4. Check dashboard - should show recent activity

### Test Browser Tracking

1. Make sure browser extension is loaded
2. Visit a few websites (GitHub, YouTube, news site)
3. Switch between tabs
4. Wait 10 seconds
5. Open desktop app dashboard
6. You should see entries like:
   - "Browser - github.com"
   - "Browser - youtube.com"
   - Each with correct category (deep work, distracted, etc.)

### Verify Native Messaging Connection

**In Chrome DevTools:**
```javascript
// Open extension popup
// Right-click on extension icon → Inspect popup
// In console, run:

chrome.runtime.sendNativeMessage('com.prodmon.app',
  {type: 'ping'},
  (response) => console.log('Response:', response)
);

// Should see: Response: {pong: true, version: "1.0.0"}
// If error, check native messaging setup
```

## Part 4: Team Deployment

### For Team Admins

1. **Package the desktop app:**
   ```bash
   npm run build
   # Distributable created in build/ directory
   # macOS: build/Productivity Monkey-1.0.0-arm64.dmg
   # Windows: build/Productivity Monkey Setup 1.0.0.exe
   ```

2. **Distribute browser extension:**
   - Option A: Load unpacked (development mode)
   - Option B: Package and publish to Chrome Web Store
   - Option C: Use enterprise policy to force-install

3. **Configure team database:**
   - All team members should use same team name
   - Set up shared manager IDs for reporting structure
   - Consider central database for team-wide analytics

### Enterprise Deployment

**Group Policy (Windows) or MDM (macOS) can:**
- Auto-install desktop app
- Auto-install browser extension
- Pre-configure user settings
- Enforce native messaging setup

**Example Chrome Policy:**
```json
{
  "ExtensionInstallForcelist": [
    "YOUR_EXTENSION_ID;https://clients2.google.com/service/update2/crx"
  ],
  "NativeMessagingUserLevelHosts": true
}
```

## Troubleshooting

### "User not found: null" Error
- Open setup window and complete user configuration
- Check that userId is set in electron-store

### Browser Extension Not Tracking
1. Check popup shows "Status: Tracking" (green)
2. Verify userId is set: `chrome.storage.local.get(['userId'])`
3. Check browser console for errors
4. Reload extension

### Native Messaging Errors
1. Verify Electron app is running
2. Check extension ID matches in manifest file
3. Verify native messaging host is installed:
   ```bash
   # macOS Chrome
   ls ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/

   # Should see: com.prodmon.app.json
   ```
4. Check manifest path points to correct node executable

### No Data in Dashboard
1. Wait 5-10 seconds after activity
2. Check SQLite database:
   ```bash
   sqlite3 ~/Library/Application\ Support/prodmon/database.sqlite
   SELECT COUNT(*) FROM activity_records;
   SELECT * FROM activity_records ORDER BY timestamp DESC LIMIT 5;
   ```
3. Verify tracking agent is running (tray icon shows "Stop" option)

### Build Errors
```bash
# Clean build
rm -rf dist/ build/ node_modules/
npm install
npm run build
```

## Performance Notes

- **CPU Usage:** ~1-2% on average
- **Memory:** ~100-150 MB for Electron app
- **Database Size:** ~10-20 MB per user per month
- **Network:** None (all local, unless you add cloud sync)
- **Battery Impact:** Minimal (~1-2% per day on laptops)

## Privacy & Security

### What is Tracked:
- ✅ Application names
- ✅ Window titles
- ✅ Browser URLs and page titles
- ✅ Time spent in each app/site
- ✅ Keystroke counts (not content)
- ✅ Mouse click/scroll counts
- ✅ Idle periods

### What is NOT Tracked:
- ❌ Actual keystrokes (what you type)
- ❌ Screenshots or screen recordings
- ❌ Clipboard content
- ❌ File contents
- ❌ Network traffic
- ❌ Personal data beyond what you configure

### Data Storage:
- All data stored locally in SQLite database
- Default location: `~/Library/Application Support/prodmon/database.sqlite` (macOS)
- No cloud sync by default
- No external API calls
- Completely offline

### User Controls:
- Pause/resume tracking anytime via tray menu
- View all tracked data in dashboard
- Delete user data by deleting database file
- Uninstall cleanly removes all data

## Advanced Configuration

### Custom Tracking Interval

Edit `src/main.ts`:
```typescript
const config = {
  trackingInterval: 5000,  // Change from 5s to your preference
  idleThreshold: 5 * 60 * 1000  // 5 minutes idle threshold
};
```

### Custom Site Categories

Edit `browser-extension/chrome/background.js`:
```javascript
function categorizeUrl(url, title) {
  // Add your custom patterns
  const deepWorkPatterns = [
    'github.com',
    'yourcompany.atlassian.net',  // Add your Jira
    // etc.
  ];
}
```

### Database Location

Set environment variable:
```bash
export PRODMON_DB_PATH="/path/to/custom/database.sqlite"
npm start
```

## Next Steps

1. ✅ Complete setup (desktop app + browser extension)
2. ✅ Let it run for 1 week to collect baseline data
3. ✅ Review your first weekly report
4. ✅ Identify productivity patterns
5. ✅ Make adjustments to your work habits
6. ✅ Compare with team averages (if applicable)

## Getting Help

- Check browser extension README: `browser-extension/README.md`
- Review troubleshooting section above
- Check browser console for errors (F12)
- Check Electron app console output
- Verify database contains data

## Uninstallation

```bash
# Remove desktop app
# macOS: Drag from Applications to Trash
# Windows: Control Panel → Uninstall

# Remove browser extension
# chrome://extensions → Remove

# Remove native messaging
rm -rf ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.prodmon.app.json
rm -rf ~/Library/Application\ Support/Microsoft\ Edge/NativeMessagingHosts/com.prodmon.app.json

# Remove data
rm -rf ~/Library/Application\ Support/prodmon/
```
