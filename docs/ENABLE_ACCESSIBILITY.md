# Quick Guide: Enable Accessibility Permission

## Why You Should Do This

Enabling Accessibility permission gives you **RescueTime-level tracking**:

✅ **Direct URL capture** from Safari, Chrome, Edge, Brave, etc.
✅ **No browser extension needed** for basic URL tracking
✅ **More accurate categorization** (knows GitHub from YouTube)
✅ **Redundant tracking** (desktop + extension = more reliable)
✅ **Professional-grade insights** like paid tools, but free and local

---

## 3-Step Setup (2 minutes)

### Step 1: Grant Permission

1. Open **System Settings**
2. Go to **Privacy & Security** → **Accessibility**
3. Find "**Electron**" in the list
4. Toggle it **ON** (blue)

### Step 2: Restart App

```bash
# Stop current app (Ctrl+C if running)
npm start
```

### Step 3: Test It

1. Browse to GitHub, YouTube, or Stack Overflow
2. Wait 10 seconds
3. Check the dashboard → "🌐 Browser Activity" section
4. You should see **exact URLs** captured

---

## What You'll See

### Before (Without Accessibility):
```
Top Applications
Google Chrome                        5.2h
```

### After (With Accessibility):
```
Browser Activity (Websites Visited)
GitHub - myproject/pull/456    [DEEP]     2.5h
https://github.com/myproject/pull/456

Stack Overflow - React Hooks   [DEEP]     1.2h
https://stackoverflow.com/questions/...

YouTube - Coding Tutorial      [DEEP]     0.8h
https://www.youtube.com/watch?v=...

Reddit - Programming           [DISTRACTED] 0.7h
https://www.reddit.com/r/programming
```

**Much more useful!** 📊

---

## Verify It's Working

Run this to see URLs in the database:

```bash
sqlite3 ~/Library/Application\ Support/prodmon/prodmon.db \
  "SELECT url, window_title FROM activity_records WHERE url IS NOT NULL LIMIT 5;"
```

Expected output:
```
https://github.com/username/repo|GitHub - Pull Request
https://stackoverflow.com/...|Stack Overflow - How to...
https://youtube.com/watch...|YouTube - Tutorial
```

If you see URLs, it's working! ✅

---

## Benefits Summary

| Without Accessibility | With Accessibility |
|----------------------|-------------------|
| Only app names | Exact URLs |
| Generic categories | Precise categories |
| Must use extension | Works without extension |
| Single data source | Redundant sources |
| Less accurate | RescueTime-level accuracy |

---

## Still Have Questions?

- **Full details:** See `ACCESSIBILITY_ENHANCEMENT.md`
- **Permission setup:** See `MACOS_PERMISSIONS.md`
- **Privacy concerns:** All data stays local, no cloud upload

**Bottom line:** This makes the tool significantly more useful and accurate. Highly recommended! 🚀
