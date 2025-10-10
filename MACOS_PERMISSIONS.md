# macOS Permissions Required

Productivity Monkey uses two macOS permissions to provide comprehensive activity tracking, similar to professional tools like RescueTime:

1. **Screen Recording** (Required) - Enables basic desktop tracking
2. **Accessibility** (Highly Recommended) - Enables enhanced browser tracking

Both permissions work together to provide the most accurate and detailed productivity insights.

---

## Screen Recording Permission (REQUIRED)

### What It Enables

With Screen Recording permission, the app can read:
- ✅ **Application names** (e.g., "Google Chrome", "Visual Studio Code", "Slack")
- ✅ **Window titles** (e.g., "GitHub - Pull Request #123", "main.ts - MyProject")
- ✅ **Application switching** and context switches
- ✅ **Basic time tracking** per application

### What It Does NOT Do

- ❌ Does **NOT** take screenshots
- ❌ Does **NOT** record your screen
- ❌ Does **NOT** capture visual content

macOS calls it "Screen Recording" for privacy reasons, but the app only reads metadata (titles), not visual content.

---

## Accessibility Permission (HIGHLY RECOMMENDED)

### What It Enables

With Accessibility permission, the app gains powerful capabilities:

✅ **Direct Browser URL Capture**
- Reads the **exact URL** from your browser (Safari, Chrome, Edge, Brave, Opera, Vivaldi, etc.)
- Works **even without the browser extension**
- More reliable than parsing window titles
- Captures URLs that don't appear in page titles

✅ **Enhanced Categorization**
- Automatically categorizes based on actual URLs, not just app names
- Distinguishes between GitHub repos, Stack Overflow questions, YouTube videos
- More accurate deep work vs. distraction detection

✅ **Better Data Quality**
- No need to extract URLs from window titles (which is unreliable)
- Captures single-page apps (SPAs) that don't update window titles
- Works with all browsers, not just those with extensions

### Comparison: Without vs. With Accessibility

**WITHOUT Accessibility Permission:**
```
App: Google Chrome
Title: "GitHub"
URL: (none - must extract from title, often fails)
Category: ADMIN (generic - can't tell what you're doing)
```

**WITH Accessibility Permission:**
```
App: Google Chrome
Title: "Pull Request #456 - myproject"
URL: https://github.com/username/myproject/pull/456
Category: DEEP (knows it's GitHub code review)
```

### Real-World Impact

**Scenario: Web Development**

Without Accessibility:
- All browsing shows as "Chrome" with generic titles
- Can't distinguish between Stack Overflow and YouTube
- Less accurate productivity categorization
- Must rely on browser extension for URLs

With Accessibility:
- Sees exact URLs: github.com/project, stackoverflow.com/questions/...
- Accurately categorizes: Deep work (GitHub, MDN) vs. Distractions (Reddit, Twitter)
- Works **alongside** browser extension for redundancy
- Even if browser extension fails, desktop tracking still gets URLs

---

## Combined Benefits (Both Permissions)

When both permissions are granted, Productivity Monkey provides:

### 1. **Dual-Layer Browser Tracking**
- Desktop tracker captures URLs via Accessibility
- Browser extension captures engagement (keystrokes, clicks, scrolls)
- **Redundancy**: If one fails, the other still works
- **Validation**: Cross-check data from both sources

### 2. **Complete Desktop Activity**
- Desktop apps with Screen Recording: VS Code, Terminal, Slack
- Browser activity with Accessibility: GitHub, Stack Overflow, etc.
- Full picture of your workday

### 3. **Accurate Categorization**
- URL-based categorization (more precise)
- Automatic deep work detection
- Better productivity insights

### 4. **Comparison with RescueTime**

Like RescueTime, Productivity Monkey uses both permissions to:
- Track desktop and browser activity seamlessly
- Provide accurate time-on-task metrics
- Automatically categorize productivity levels
- Generate meaningful insights

**Productivity Monkey Advantages:**
- ✅ Open source - audit the code yourself
- ✅ Local database - your data never leaves your machine
- ✅ Browser extension provides even more detail
- ✅ Free - no subscription required

---

## How to Grant Permissions

### Step 1: Grant Screen Recording Permission

1. **Open System Settings**
   - Click the Apple menu () → System Settings
   - Or use Spotlight: Press `Cmd + Space` and type "System Settings"

2. **Navigate to Privacy & Security → Screen Recording**
   - Click on "Privacy & Security" in the left sidebar
   - Scroll down and click on "Screen Recording"

3. **Enable for Electron or Productivity Monkey**
   - Look for "Electron" or "Productivity Monkey" in the list
   - Toggle the switch to ON (blue)
   - If you don't see it, click the "+" button and navigate to:
     - Development: `/Users/YOUR_USERNAME/Documents/projects/prodmon/node_modules/electron/dist/Electron.app`
     - Production: `/Applications/Productivity Monkey.app`

### Step 2: Grant Accessibility Permission (Recommended)

1. **In System Settings → Privacy & Security**
   - Click on "Accessibility" (in the same Privacy & Security section)

2. **Enable for Electron or Productivity Monkey**
   - Look for "Electron" or "Productivity Monkey" in the list
   - Toggle the switch to ON (blue)
   - If you don't see it, click the "+" button and add the same app

3. **Why This Matters**
   - Enables direct URL capture from browsers
   - No need to rely solely on browser extension
   - More accurate categorization of browser activity
   - Works with Safari, Chrome, Edge, Brave, and more

### Step 3: Restart the Application

1. **Quit Productivity Monkey completely**
   - Press `Cmd + Q` or quit from the tray menu

2. **Start it again**
   ```bash
   npm start
   ```

3. **Verify permissions are working**
   - Check the dashboard diagnostics
   - Browse some websites and see if URLs are captured

---

## What Happens Without Permissions

### Without Screen Recording Permission:
- ❌ Desktop tracking fails: "active-win requires the screen recording permission"
- ❌ Can't track desktop apps (VS Code, Terminal, Slack, etc.)
- ❌ No window titles
- ✅ Browser extension still works independently (if installed)

### Without Accessibility Permission:
- ❌ No direct URL capture from browsers via desktop tracker
- ❌ Less accurate categorization (can't distinguish GitHub from YouTube in Chrome)
- ❌ Must rely entirely on browser extension for URLs
- ⚠️ Single point of failure (if extension breaks, no URL data)
- ✅ Basic desktop tracking still works (app names and titles)

### With Both Permissions (Recommended):
- ✅ Complete desktop activity tracking
- ✅ Direct URL capture from all browsers
- ✅ Accurate automatic categorization
- ✅ Redundant data sources (desktop + extension)
- ✅ Most accurate and comprehensive tracking

### Verification

After granting permission, you should see:
- No more "active-win requires screen recording permission" errors in the console
- Desktop Tracking shows "Running ✓" in the diagnostics
- Activity records include desktop applications (VS Code, Terminal, etc.)

### Privacy Notes

- The app only reads window titles, NOT actual screen content
- No screenshots or recordings are ever made
- Data is stored locally in SQLite database on your machine
- You can view the database contents at: `~/Library/Application Support/prodmon/prodmon.db`

## Accessibility Permission (Not Currently Required)

Some future features might require Accessibility permission, but the current version does NOT need it.

## Troubleshooting

### "Operation not permitted" or Permission Denied

If you see errors about permissions:
1. Make sure you granted Screen Recording permission
2. Restart the app after granting permission
3. Check that the correct app is enabled in System Settings

### App Not Showing in Screen Recording List

If Electron or Productivity Monkey doesn't appear in the Screen Recording list:
1. Run the app at least once (it should show an error)
2. Close System Settings and reopen it
3. The app should now appear in the list
4. If not, use the "+" button to manually add it

### Still Getting Errors After Granting Permission

1. **Quit the app completely** (not just closing the window)
   ```bash
   # Kill all Electron processes
   pkill -f Electron
   ```

2. **Restart the app**
   ```bash
   npm start
   ```

3. **Check System Settings again** - make sure the toggle is still ON

4. **Restart your Mac** (in rare cases, macOS needs a restart for permissions to take effect)

## Alternative: Browser-Only Mode

If you prefer not to grant Screen Recording permission, you can use the browser extension only:

1. Install the browser extension (see `browser-extension/README.md`)
2. The extension tracks browser activity without any macOS permissions
3. Desktop app will show "0 desktop records" but browser tracking will work fine

This gives you precise browser tracking (URLs, time spent, etc.) without desktop application tracking.
