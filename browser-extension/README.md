# Productivity Monkey Browser Extension

## Overview

The Productivity Monkey Browser Extension provides **highly precise browser activity tracking** by capturing:

- ✅ **Exact URLs and page titles** - Know what websites users are actually visiting
- ✅ **Time spent per tab/site** - Track session duration with millisecond precision
- ✅ **User engagement metrics** - Keystrokes, mouse clicks, scrolling activity
- ✅ **Media detection** - Identify when users are watching videos or listening to music
- ✅ **Context switching** - Track tab changes and multitasking patterns
- ✅ **Idle detection** - Know when users step away from their browser
- ✅ **Domain categorization** - Automatically classify sites as deep work, shallow work, or distractions

## Why This Is Essential

**Without the browser extension, the desktop app can only see:**
- Application name: "Google Chrome" or "Firefox"
- Window title: Sometimes includes the page title, but inconsistently
- No URL information
- No engagement metrics
- No context about what the user is actually doing

**With the browser extension:**
- Track exact URLs (e.g., `github.com/username/repo/pull/123`)
- Measure time spent on specific sites
- Detect productive vs distracting browsing
- Track engagement through keystrokes, clicks, and scrolling
- Identify when media is playing
- Categorize activity automatically (coding on GitHub, communication on Slack, etc.)

## Installation

### Step 1: Install the Electron App

1. Build and install the Productivity Monkey desktop app
2. Run the app and complete the user setup

### Step 2: Install Browser Extension

#### For Chrome/Edge:

1. Open Chrome or Edge
2. Navigate to `chrome://extensions` or `edge://extensions`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the folder:
   - Chrome: `browser-extension/chrome`
   - Firefox: `browser-extension/firefox`
6. Copy the **Extension ID** (shown below the extension name)

#### For Firefox:

1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select `browser-extension/firefox/manifest.json`
5. Note: Temporary extensions need to be reloaded each time Firefox restarts
   - For permanent installation, the extension needs to be signed by Mozilla

### Step 3: Configure Native Messaging

The browser extension needs to communicate with the Electron app via **Native Messaging**.

#### Automatic Setup (Recommended):

1. Open the Productivity Monkey app
2. Click the system tray icon
3. Select **Browser Extension Setup**
4. Click **Install for Chrome/Edge**
5. Paste your extension ID when prompted
6. Click Install

This will automatically configure native messaging for Chrome and Edge.

#### Manual Setup:

If automatic setup fails, you can manually install the native messaging host using the provided script:

**All Platforms:**

From the project root directory, run:

```bash
node install-native-messaging.js YOUR_EXTENSION_ID
```

Replace `YOUR_EXTENSION_ID` with the actual extension ID from chrome://extensions (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

The script will:
1. Create a wrapper script to run the native messaging host
2. Install manifest files for both Chrome and Edge
3. Set up all necessary directories and permissions

**Example:**
```bash
# After loading extension in Chrome, copy the ID and run:
node install-native-messaging.js kbfnbcaeplbcioakkpcpgfkobkghlhen
```

**Verifying Installation:**

After running the script, check that these files exist:

- **macOS:**
  - `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.prodmon.app.json`
  - `~/.local/bin/prodmon-native-host.sh`

- **Windows:**
  - `%USERPROFILE%\AppData\Local\Productivity Monkey\NativeMessagingHost\com.prodmon.app.json`
  - Registry keys at `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.prodmon.app`

- **Linux:**
  - `~/.config/google-chrome/NativeMessagingHosts/com.prodmon.app.json`
  - `~/.local/bin/prodmon-native-host.sh`

### Step 4: Configure User ID

The extension needs your user ID to associate activity with your account:

1. Click the Productivity Monkey extension icon in your browser
2. The extension will automatically sync with the Electron app
3. Your user ID will be configured automatically if the app is running

Or set it manually in the extension's developer console:
```javascript
chrome.storage.local.set({ userId: 'your-user-id-here' });
```

## Features

### 1. Precise URL Tracking
- Captures full URLs including query parameters
- Tracks domain and subdomain separately
- Records exact navigation paths (e.g., specific GitHub PR, Jira ticket, etc.)

### 2. Time Tracking
- Millisecond-precision session duration
- Tracks time from when tab becomes active to when it loses focus
- Distinguishes between active use and background tabs

### 3. Engagement Metrics
- **Keystrokes**: Counts keyboard input (without recording actual content for privacy)
- **Mouse clicks**: Tracks clicking activity
- **Scrolling**: Measures scroll events as engagement signal
- **Mouse movement**: Detects general activity (throttled to avoid spam)

### 4. Media Detection
- Detects when videos are playing (YouTube, Netflix, etc.)
- Identifies music streaming (Spotify, SoundCloud, etc.)
- Tracks media source (which platform is being used)
- Helps distinguish between work-related videos (tutorials) and entertainment

### 5. Intelligent Categorization

The extension automatically categorizes sites into productivity levels:

**Deep Work:**
- GitHub, GitLab, BitBucket (code repositories)
- Stack Overflow, documentation sites
- Design tools (Figma, Miro)
- Cloud platforms (AWS, GCP, Azure)
- Note-taking apps (Notion, Obsidian)

**Shallow Work:**
- Slack, Teams, Discord (communication)
- Email (Gmail, Outlook)
- Calendar apps
- Project management (Asana, Jira, Trello)

**Learning/Research:**
- Online courses (Coursera, Udemy)
- Wikipedia, research papers
- Technical blogs and articles

**Distractions:**
- Social media (Facebook, Twitter, Instagram, Reddit, TikTok)
- Entertainment (YouTube personal, Netflix, streaming services)
- News sites
- Shopping sites

### 6. Context Switching Detection
- Tracks when users switch between tabs
- Measures frequency of context switches
- Helps identify multitasking patterns and focus fragmentation

### 7. Idle Detection
- Uses browser's native idle API (default: 5 minutes)
- Stops tracking when user is away
- Prevents inflated metrics from inactive time

### 8. Privacy Features
- **No content recording**: Keystrokes are counted but NOT logged
- **Local storage first**: Data stored locally in extension before sync
- **Configurable tracking**: Users can pause tracking anytime
- **No screenshots**: Unlike some monitoring tools, no visual capture
- **Transparent**: Open source code you can audit

## How It Works

### Architecture

```
Browser Extension ←→ Native Messaging ←→ Electron App ←→ SQLite Database
```

1. **Content Script** (`content.js`): Runs on every webpage
   - Listens for keyboard, mouse, scroll events
   - Detects media playback
   - Sends signals to background script

2. **Background Script** (`background.js`): Service worker
   - Tracks active tab and URL changes
   - Monitors tab switching and navigation
   - Aggregates activity data every 5 seconds
   - Sends to native messaging host

3. **Native Messaging Host** (`native-host.ts`): Node.js process
   - Receives messages from browser extension
   - Validates and transforms data
   - Stores in SQLite database
   - Same database used by desktop app

4. **Electron App**: Main application
   - Runs analytics on combined desktop + browser data
   - Generates reports and insights
   - Displays dashboard

### Data Flow

```
User browses website
    ↓
Content script detects activity (keystroke, click, scroll)
    ↓
Sends message to background script
    ↓
Background script aggregates for 5 seconds
    ↓
Creates activity record with URL, title, metrics
    ↓
Sends via native messaging to Electron app
    ↓
Saved to database as "Browser - domain.com"
    ↓
Metrics calculator processes alongside desktop app data
    ↓
Displayed in dashboard and reports
```

## Troubleshooting

### Extension Not Tracking

1. Check extension popup - is tracking enabled?
2. Open browser console (F12) → Application → Extensions → Productivity Monkey
3. Look for error messages in console
4. Verify user ID is set: `chrome.storage.local.get(['userId'], console.log)`

### Native Messaging Not Working

1. Check if native messaging host is installed:
   - macOS: `ls ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/`
   - Windows: Check registry at `HKCU\Software\Google\Chrome\NativeMessagingHosts`
2. Verify extension ID in manifest matches your installed extension
3. Check Electron app is running
4. Test connection from extension console:
   ```javascript
   chrome.runtime.sendNativeMessage('com.prodmon.app', {type: 'ping'}, console.log);
   ```

### Data Not Appearing in Dashboard

1. Verify Electron app database path
2. Check browser extension is sending data (look in extension console)
3. Verify user ID matches between extension and Electron app
4. Check database directly:
   ```bash
   sqlite3 ~/Library/Application\ Support/prodmon/database.sqlite
   SELECT * FROM activity_records WHERE app_name LIKE 'Browser%' LIMIT 10;
   ```

## Development

### Building Changes

The extension is pure JavaScript and doesn't require compilation. Just edit the files and reload:

1. Make changes to `background.js`, `content.js`, or `popup.js`
2. Go to `chrome://extensions`
3. Click the reload icon on the Productivity Monkey extension
4. Changes take effect immediately

### Testing

```javascript
// In extension console
chrome.runtime.sendMessage({type: 'getStatus'}, console.log);

// Manually trigger activity capture
chrome.runtime.sendMessage({type: 'activity', keystroke: true});

// Check local storage
chrome.storage.local.get(null, console.log);
```

### Adding New Site Categories

Edit `background.js`, function `categorizeUrl()`:

```javascript
const deepWorkPatterns = [
  'github.com', 'gitlab.com',
  // Add your patterns here
  'yoursite.com'
];
```

## Privacy & Ethics

This tool is designed for **productivity insights**, not surveillance:

- ✅ Personal use: Help individuals understand their own productivity
- ✅ Team analytics: Aggregate insights to improve team processes
- ✅ Transparent deployment: Users should know they're being tracked
- ❌ Secret monitoring: Don't install without user knowledge
- ❌ Micromanagement: Don't use for punitive measures
- ❌ Content capture: Extension doesn't log what users type or screenshot pages

**Best practices:**
1. Get explicit consent before deploying
2. Allow users to pause tracking
3. Use data for coaching, not punishment
4. Focus on patterns and insights, not individual URLs
5. Respect privacy - aggregate data when possible

## License

MIT License - See LICENSE file

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Test native messaging connection
4. Open an issue with reproduction steps
