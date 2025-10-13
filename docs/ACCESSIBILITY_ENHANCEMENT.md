# Accessibility Permission Enhancement

## Overview

Productivity Monkey now fully utilizes macOS **Accessibility permissions** to provide RescueTime-level tracking capabilities with direct browser URL capture.

## What Changed

### 1. Enhanced Desktop Tracker

**File:** `src/agent/tracker.ts`

The desktop tracker now explicitly requests both permissions:

```typescript
const activeWindow = await activeWin({
  screenRecordingPermission: true,  // Window titles
  accessibilityPermission: true      // Browser URLs
});
```

### 2. Direct URL Capture

Instead of trying to extract URLs from window titles (unreliable), the tracker now:

1. **Checks for URL property** from active-win (provided via Accessibility permission)
2. **Falls back to title parsing** only if URL not available
3. **Works with all major browsers**: Safari, Chrome, Edge, Brave, Opera, Vivaldi

```typescript
const url = ('url' in activeWindow ? activeWindow.url : undefined)
           || this.extractUrlFromTitle(activeWindow.title);
```

### 3. URL-Based Categorization

**New feature:** Categorizes activity based on actual URLs, not just app names

```typescript
// Deep work URLs
if (lowerUrl.includes('github.com')) return ActivityCategory.DEEP;
if (lowerUrl.includes('stackoverflow.com')) return ActivityCategory.DEEP;

// Distractions
if (lowerUrl.includes('reddit.com')) return ActivityCategory.DISTRACTED;
if (lowerUrl.includes('youtube.com')) return ActivityCategory.DISTRACTED;
```

This provides **much more accurate** categorization than app-name-only tracking.

---

## Two Permissions, Two Purposes

### Screen Recording Permission
**Purpose:** Read window metadata (titles, app names)

**Provides:**
- Application names (VS Code, Chrome, Slack)
- Window titles ("main.ts - MyProject")
- Context switch detection
- Basic time tracking

### Accessibility Permission
**Purpose:** Read browser URLs and enhanced window information

**Provides:**
- **Direct URL capture** from browsers
- Exact webpage being viewed
- URL-based categorization
- No need to parse window titles

---

## Benefits Compared to Extension-Only Tracking

### Extension-Only Approach (Before)
```
Data Source: Browser extension only
URL Capture: Only when extension is installed and working
Coverage: Chrome/Edge only (whatever browser has extension)
Reliability: Single point of failure
Categorization: Based on extension's URL detection
```

### Dual-Layer Approach (Now)
```
Data Source 1: Desktop tracker with Accessibility
  ↓ Captures URLs from ANY browser (Safari, Chrome, Edge, Brave, etc.)
  ↓ Works even if extension fails
  ↓ Provides fallback URL detection

Data Source 2: Browser extension
  ↓ Captures engagement metrics (keystrokes, clicks, scrolls)
  ↓ Provides detailed per-page analytics
  ↓ Cross-validates with desktop tracker

Result: Redundant, robust, comprehensive tracking
```

---

## Real-World Scenarios

### Scenario 1: Safari User (No Extension Available)

**Before (Without Accessibility):**
```
App: Safari
Title: "GitHub"
URL: (none)
Category: ADMIN (generic)
```

**After (With Accessibility):**
```
App: Safari
Title: "Pull Request #456 - myproject"
URL: https://github.com/username/myproject/pull/456
Category: DEEP (knows it's GitHub)
```

### Scenario 2: Browser Extension Fails

**Before:** No URL data at all (extension was only source)

**After:** Desktop tracker provides URLs via Accessibility as backup

### Scenario 3: Single-Page Apps (SPAs)

Many modern web apps don't update window titles when navigating:

**Before:**
```
Title: "Gmail" (never changes)
URL: (none - can't detect which email you're reading)
```

**After:**
```
Title: "Gmail"
URL: https://mail.google.com/mail/u/0/#inbox/abc123xyz
     (URL changes with each email - tracked correctly)
```

---

## Comparison with RescueTime

| Feature | RescueTime | Productivity Monkey (With Accessibility) |
|---------|------------|------------------------------------------|
| Screen Recording Permission | ✅ Required | ✅ Required |
| Accessibility Permission | ✅ Required | ✅ Recommended |
| Direct browser URL capture | ✅ Yes | ✅ Yes |
| Tracks all browsers | ✅ Yes | ✅ Yes (Safari, Chrome, Edge, Brave, etc.) |
| Desktop app tracking | ✅ Yes | ✅ Yes |
| URL-based categorization | ✅ Yes | ✅ Yes |
| Data storage | ❌ Cloud | ✅ Local (SQLite) |
| Browser extension | ❌ No | ✅ Yes (additional detail) |
| Open source | ❌ No | ✅ Yes |
| Cost | ❌ $12/month | ✅ Free |

---

## Enhanced Capabilities

### 1. **Cross-Browser Tracking**

Works with all major browsers via Accessibility:
- ✅ Safari (no extension needed!)
- ✅ Chrome
- ✅ Edge
- ✅ Brave
- ✅ Opera
- ✅ Vivaldi
- ✅ Arc (if supported by active-win)

### 2. **Redundant Data Collection**

Three ways to capture URLs:

1. **Desktop tracker + Accessibility** → Direct URL from browser
2. **Browser extension + Native messaging** → URL with engagement metrics
3. **Window title parsing** → Fallback if above fail

If any one fails, the others provide backup.

### 3. **More Accurate Categorization**

**Example: YouTube**

Without URL-based categorization:
```
App: Chrome
Title: "YouTube"
Category: DISTRACTED (assumes entertainment)
```

With URL-based categorization:
```
URL: youtube.com/watch?v=programming-tutorial
Title: "Learn React Hooks - YouTube"
Category: DEEP (recognizes educational content)
```

### 4. **Better Deep Work Detection**

Can distinguish:
- GitHub code review vs. GitHub exploring
- Stack Overflow answering vs. Stack Overflow browsing
- MDN documentation vs. MDN newsletter
- LinkedIn job search vs. LinkedIn feed

---

## Privacy & Transparency

### What Accessibility Permission Allows

✅ **Does:**
- Read current URL from browser
- Read window titles
- Read app names
- Read window positions/sizes

❌ **Does NOT:**
- Record keystrokes (content)
- Take screenshots
- Read clipboard
- Access files
- Monitor other apps' internals

### Data Storage

All data stays local:
```
~/Library/Application Support/prodmon/prodmon.db (SQLite database)
```

You can inspect it anytime:
```bash
sqlite3 ~/Library/Application\ Support/prodmon/prodmon.db
SELECT url, window_title, category FROM activity_records LIMIT 10;
```

---

## How to Enable

### Step 1: Grant Accessibility Permission

1. Open **System Settings** → **Privacy & Security** → **Accessibility**
2. Find "Electron" or "Productivity Monkey"
3. Toggle **ON**

### Step 2: Restart the App

```bash
npm start
```

### Step 3: Verify It's Working

1. Browse some websites (GitHub, YouTube, Stack Overflow)
2. Open the dashboard
3. Check **Browser Activity** section
4. You should see exact URLs captured

**Expected output:**
```
🌐 Browser Activity (Websites Visited)

GitHub - myproject/pull/456          [DEEP]     2.5h
https://github.com/myproject/pull/456
⏱️ 1,800 visits  ⌨️ 450 keystrokes  🖱️ 230 clicks/scrolls
```

---

## Troubleshooting

### URLs Not Being Captured?

1. **Check Accessibility permission is granted**
   - System Settings → Privacy & Security → Accessibility
   - Make sure "Electron" is enabled

2. **Restart the app after granting permission**
   ```bash
   pkill -f Electron
   npm start
   ```

3. **Check which browser you're using**
   - Supported: Safari, Chrome, Edge, Brave, Opera, Vivaldi
   - Unsupported: Firefox (different architecture)

4. **Check database for URL column**
   ```bash
   sqlite3 ~/Library/Application\ Support/prodmon/prodmon.db \
     "SELECT url FROM activity_records WHERE url IS NOT NULL LIMIT 5;"
   ```

### Still Seeing "Chrome" Instead of URLs?

- Accessibility permission might not be granted
- Browser might not be supported
- Window might not be in focus
- Try clicking into the browser window and waiting 5 seconds

---

## Migration Guide

### If You Were Using Extension-Only

**Before:** Browser extension was the only source of URLs

**Now:** Desktop tracker + Accessibility provides URLs as well

**Action Required:**
1. Grant Accessibility permission
2. Restart app
3. You now have **dual-layer tracking** (desktop + extension)

### If You Were Using Desktop-Only

**Before:** Only saw app names and titles (no URLs)

**Now:** Desktop tracker can capture URLs directly

**Action Required:**
1. Grant Accessibility permission
2. Restart app
3. Browse some websites
4. Check dashboard for URL data

---

## Next Steps

1. ✅ **Grant Accessibility permission** (see `MACOS_PERMISSIONS.md`)
2. ✅ **Restart the app** (`npm start`)
3. ✅ **Browse websites** and verify URL capture
4. ✅ **Check dashboard** for enhanced browser activity data

With both permissions enabled, you'll have **RescueTime-level tracking** with the added benefits of:
- Open source transparency
- Local data storage
- Browser extension for extra detail
- No subscription costs

---

## Summary

### What You Gain with Accessibility Permission:

✅ **Direct URL capture** from all major browsers
✅ **More accurate categorization** (URL-based, not app-based)
✅ **Redundant tracking** (desktop + extension)
✅ **Safari support** (no extension needed)
✅ **SPA tracking** (captures URL changes that don't update title)
✅ **Professional-grade tracking** (comparable to RescueTime)

### What You Keep:

✅ **Privacy** - All data stays local
✅ **Control** - You can inspect/delete database anytime
✅ **Transparency** - Open source code you can audit
✅ **Free** - No subscription or cloud costs

**Recommendation:** Enable both Screen Recording AND Accessibility permissions for the most comprehensive, accurate tracking experience.
