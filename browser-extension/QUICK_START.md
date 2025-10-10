# Quick Start - Browser Extension

## Why You Need This

**The desktop app alone is NOT enough!** Here's what you're missing:

### Without Browser Extension:
```
Activity Log:
- Google Chrome (30 minutes)
- Google Chrome (45 minutes)
- Google Chrome (12 minutes)
```
❌ Which websites? Unknown
❌ Productive or distracting? Can't tell
❌ Deep work or social media? No idea

### With Browser Extension:
```
Activity Log:
- Browser - github.com/mycompany/backend (30 min) [Deep Work]
- Browser - youtube.com (15 min) [Distracted]
- Browser - stackoverflow.com (12 min) [Deep Work]
- Browser - docs.google.com (18 min) [Admin]
- Browser - slack.com (22 min) [Shallow Work]
```
✅ Exact websites tracked
✅ Automatically categorized
✅ Precise productivity insights
✅ See what's actually happening

## Installation (5 Minutes)

### Step 1: Load Extension (2 min)

**Chrome/Edge:**
1. Open `chrome://extensions` or `edge://extensions`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select folder: `prodmon/browser-extension/chrome`
5. Copy the Extension ID shown below the name

**Firefox:**
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `prodmon/browser-extension/firefox/manifest.json`

### Step 2: Connect to Desktop App (3 min)

**Automatic:**
1. Open Productivity Monkey desktop app
2. System tray → "Browser Extension Setup"
3. Paste your Extension ID
4. Click Install

**Manual (if automatic fails):**
```bash
# macOS
mkdir -p ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts
cp browser-extension/chrome/com.prodmon.app.json ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/

# Edit the file and replace EXTENSION_ID_PLACEHOLDER with your ID
```

### Step 3: Verify It Works

1. Click extension icon in browser
2. Should show "Status: Tracking" (green indicator)
3. Browse a few websites
4. Check desktop app dashboard
5. Should see "Browser - domain.com" entries

## What Gets Tracked

✅ **Exact URLs** - Full path including query params
✅ **Time per site** - Millisecond precision
✅ **Tab switching** - Context switch detection
✅ **Engagement** - Keystrokes, clicks, scrolling (counts only, not content)
✅ **Media playback** - YouTube, Spotify, etc.
✅ **Idle time** - Knows when you step away

## Privacy

❌ **NOT tracked:**
- What you type (only keystroke count)
- Passwords or sensitive data
- Screenshots
- Personal information
- Content of pages

✅ **Only tracked:**
- URLs visited
- Time spent
- Activity indicators
- Tab/window focus

All data stays **100% local** on your machine.

## Troubleshooting

### Extension Not Appearing
- Check Developer mode is enabled
- Reload the extension
- Check for manifest errors in console

### "Not Connected" Status
- Verify desktop app is running
- Check native messaging is installed
- Verify Extension ID matches in manifest

### No Data in Dashboard
- Wait 5-10 seconds after browsing
- Check extension popup shows "Tracking"
- Verify you completed user setup in desktop app

## Categories

The extension auto-categorizes sites:

**🔵 Deep Work:**
- GitHub, GitLab, Stack Overflow
- AWS, GCP, Azure consoles
- Figma, Notion, documentation sites
- Code editors (CodeSandbox, Replit)

**🟡 Shallow Work:**
- Slack, Teams, Discord
- Gmail, Outlook
- Calendar, Zoom meetings
- Asana, Jira, Trello

**🟢 Learning:**
- Coursera, Udemy, tutorials
- Wikipedia, research papers
- Technical blogs

**🔴 Distractions:**
- Social media (Facebook, Twitter, Reddit, TikTok)
- Entertainment (YouTube non-work, Netflix)
- News sites (general browsing)
- Shopping

## Next Steps

1. ✅ Install extension
2. ✅ Connect to desktop app
3. ✅ Browse normally for 1 week
4. ✅ Review your productivity patterns
5. ✅ Optimize based on insights

For detailed documentation, see: `browser-extension/README.md`
