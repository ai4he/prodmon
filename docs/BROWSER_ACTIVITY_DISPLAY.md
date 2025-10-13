# Browser Activity Display - Feature Added

## What Was Added

The dashboard now displays detailed **browser activity** showing exactly which websites you visited, how long you spent on each, and engagement metrics.

## Changes Made

### 1. New Method in MetricsCalculator

**File:** `src/analytics/metrics.ts`

Added `getBrowserActivity()` method:
- Queries activity records where `url IS NOT NULL`
- Groups by URL, title, and category
- Returns top 20 websites visited
- Includes time spent, visit count, keystrokes, and mouse movements

### 2. Updated Dashboard Data API

**File:** `src/main.ts`

Modified `get-dashboard-data` IPC handler to include:
```typescript
const browserActivity = this.metricsCalc.getBrowserActivity(config.userId, weekStart, weekEnd);
```

Returns browser activity alongside metrics and app usage.

### 3. New Dashboard Section

**File:** `ui/dashboard.html`

Added new section: **"🌐 Browser Activity (Websites Visited)"**

Shows for each website:
- **Page title** (from browser tab)
- **Full URL** (clickable)
- **Category badge** (deep/shallow/admin/distracted)
- **Time spent** (in hours)
- **Visit count** (how many 5-second intervals)
- **Keystrokes** (typing activity)
- **Mouse movements** (clicks + scrolls)

## What You'll See

### Before (Without Browser Extension Data)
```
🌐 Browser Activity (Websites Visited)
No browser activity recorded yet. Make sure the browser
extension is installed and connected.
```

### After (With Browser Extension Data)
```
🌐 Browser Activity (Websites Visited)

GitHub - Pull Request #123          [DEEP]     2.5h
https://github.com/user/repo/pull/123
⏱️ 1,800 visits  ⌨️ 450 keystrokes  🖱️ 230 clicks/scrolls

YouTube - Programming Tutorial       [DEEP]     1.2h
https://www.youtube.com/watch?v=...
⏱️ 864 visits  ⌨️ 45 keystrokes  🖱️ 120 clicks/scrolls

Slack - Team Discussion             [SHALLOW]   0.8h
https://app.slack.com/client/...
⏱️ 576 visits  ⌨️ 380 keystrokes  🖱️ 290 clicks/scrolls

Reddit - Programming                [DISTRACTED] 0.3h
https://www.reddit.com/r/programming
⏱️ 216 visits  ⌨️ 15 keystrokes  🖱️ 180 clicks/scrolls
```

## Data Displayed

### Time Spent Calculation
- Based on 5-second tracking intervals
- Formula: `visitCount × 5 / 3600 = hours`
- Example: 720 visits = 1 hour (720 × 5 = 3,600 seconds = 1 hour)

### Category Colors
- **Deep Work** (green): GitHub, Stack Overflow, Documentation, etc.
- **Shallow Work** (yellow): Email, Slack, Calendar, etc.
- **Admin** (blue): General websites not categorized
- **Distracted** (red): Social media, entertainment, news, etc.

### Engagement Metrics
- **Keystrokes**: Total keyboard input on this page (privacy: count only, not content)
- **Clicks/Scrolls**: Combined mouse activity showing engagement level

## How It Works

1. **Browser extension** captures activity every 5 seconds:
   - Current URL
   - Page title
   - User engagement (keystrokes, clicks, scrolls)
   - Category (auto-detected)

2. **Native messaging** sends data to Electron app

3. **Database** stores each 5-second snapshot:
   ```sql
   INSERT INTO activity_records (url, window_title, category, keystrokes_count, ...)
   ```

4. **Dashboard queries** aggregate the data:
   ```sql
   SELECT url, window_title, category, COUNT(*) as visit_count
   FROM activity_records
   WHERE url IS NOT NULL
   GROUP BY url, window_title, category
   ORDER BY visit_count DESC
   ```

5. **UI displays** the results with rich formatting

## Benefits

### Before This Feature
- Only saw "Browser - github.com" in app list
- No details about specific pages or URLs
- Couldn't distinguish between different GitHub repos or YouTube videos
- No engagement metrics per website

### After This Feature
- See exact URLs and page titles
- Know which specific pages you spent time on
- Engagement metrics show how actively you used each site
- Categorization shows productivity vs. distraction
- Click URLs to revisit important pages

## Example Use Cases

### 1. Track Learning Resources
See which tutorials or documentation pages you spent the most time on:
```
MDN Web Docs - JavaScript Arrays     [DEEP]     3.2h
Stack Overflow - React Hooks Error   [DEEP]     1.5h
```

### 2. Identify Time Sinks
Discover where your time goes:
```
Twitter - Home Timeline              [DISTRACTED] 2.1h
Reddit - r/funny                     [DISTRACTED] 1.8h
```

### 3. Review Work Activity
See which work tools you used most:
```
Jira - PROJECT-123                   [SHALLOW]  4.2h
GitHub - code-review                 [DEEP]     3.8h
Slack - #engineering                 [SHALLOW]  2.1h
```

### 4. Analyze Deep Work Sessions
Find your most focused work:
```
Figma - Design System v2             [DEEP]     5.4h
AWS Console - EC2 Dashboard          [DEEP]     2.3h
Notion - Project Docs                [DEEP]     1.9h
```

## Privacy Notes

- URLs are stored locally in your SQLite database
- No data is sent to external servers
- Keystroke/click counts are recorded, not actual content
- You can view/delete database at: `~/Library/Application Support/prodmon/prodmon.db`

## Testing

After rebuilding and restarting the app:

1. Browse some websites with the extension active
2. Wait 30 seconds for data to sync
3. Refresh the dashboard
4. Look for the **"🌐 Browser Activity (Websites Visited)"** section
5. You should see your recent browsing history

If no data appears:
- Check extension popup shows "Native App: Connected ✓"
- Check diagnostics show browser records > 0
- Browse more websites and wait for sync
- Click "Refresh Diagnostics" button

## Next Steps

To see your browser activity:

1. **Rebuild the app** (if not done already):
   ```bash
   npm run build
   ```

2. **Restart the Electron app**:
   ```bash
   npm start
   ```

3. **Browse some websites** with the extension active

4. **Open the dashboard** - you should now see:
   - List of websites visited
   - Time spent on each
   - Full URLs
   - Engagement metrics
   - Category badges

The data updates automatically every 30 seconds while the dashboard is open.
