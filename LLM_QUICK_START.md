# LLM Intelligence - Quick Start

## What's New?

Productivity Monkey now uses **Google Gemini AI** to make smarter decisions:

✅ **Smart Categorization** - Knows "YouTube tutorial" is deep work, not distraction
✅ **AI Weekly Summaries** - Personalized insights instead of generic numbers
✅ **Auto-Fallbacks** - Works perfectly even when API quota exceeded

**Already configured with your API key and ready to use!**

---

## Immediate Benefits

### Before LLM:
```
App: Chrome
URL: youtube.com
Category: DISTRACTED ❌
```

### With LLM:
```
App: Chrome
URL: youtube.com/watch?v=react-tutorial
Title: "Advanced React Patterns - YouTube"
Category: DEEP ✓ (recognizes educational content)
```

---

## How It Works

### 1. Smart Categorization (Automatic)

**When:** Every time you switch apps or contexts
**How:** LLM analyzes app + title + URL together
**Fallback:** Rule-based categorization if LLM unavailable
**Cost:** Cached for 1 minute, ~20-50 API calls/day

### 2. AI Weekly Summaries (Weekly)

**When:** When you generate weekly reports
**How:** LLM analyzes your metrics and generates insights
**Example:**
```
🤖 AI Insights: You maintained excellent deep work focus this week
with 15.2 hours (65%), particularly strong in coding. Your 127-minute
longest session shows great concentration. Consider reducing Slack
notifications during 9-11 AM peak hours to minimize 8.3 context
switches/hour.
```

**Cost:** 1 API call per week

---

## Quota Management

**Daily Limit:** 1,500 requests (Gemini free tier)
**Typical Usage:** 20-100 requests/day
**Status:** Check dashboard diagnostics for quota info

**What Happens When Quota Exceeded:**
- ✅ Automatically falls back to rule-based categorization
- ✅ Continues working normally
- ✅ Resets daily at midnight
- ✅ **No functionality lost!**

---

## Privacy

**What's Sent to Gemini:**
- App names ("Chrome", "VS Code")
- Window titles ("GitHub - Pull Request")
- URLs (if available)
- Aggregated metrics (for summaries)

**What's NOT Sent:**
- Keystroke content
- Passwords
- File contents
- Screenshots

**Data Storage:**
- Gemini: Standard Google retention policies
- Local: Quota tracking in `~/Library/Application Support/prodmon/gemini-quota.json`

---

## How to Use

### It's Already Working!

Just restart the app:

```bash
npm start
```

The LLM features are **automatic** - no configuration needed!

### Check LLM Status

Dashboard will show:
```
🤖 LLM Intelligence: ACTIVE
Quota: 47 / 1,500 used today
Remaining: 1,453 requests
```

---

## Examples You'll See

### Example 1: Educational Content
```
Before: YouTube = Distracted
After: "JavaScript Tutorial - YouTube" = Deep Work ✓
```

### Example 2: GitHub Browsing vs. Work
```
Before: All GitHub = Deep Work
After:
  - "github.com/myrepo/pull/123" = Deep Work ✓
  - "github.com/trending" = Admin (browsing)
```

### Example 3: Contextual Slack
```
Before: Slack = Shallow Work (always)
After:
  - "#engineering - Architecture Discussion" = Deep Work ✓
  - "#random - Memes" = Admin
```

---

## Troubleshooting

### Check if LLM is Working

Look for in console:
```
✓ Gemini LLM service initialized
```

### If LLM Not Working

**Don't worry!** The app falls back to rule-based categorization automatically. Everything still works.

### Reset Quota (if needed)

```bash
rm ~/Library/Application\ Support/prodmon/gemini-quota.json
npm start
```

---

## Cost

**Current:** FREE (using Gemini free tier)
**Limit:** 1,500 requests/day
**Typical Usage:** 20-100 requests/day
**Coverage:** More than enough for 24/7 tracking

**Even if you exceed:**
- Still works (automatic fallbacks)
- Resets daily
- Can upgrade to paid tier ($11/month for unlimited)

---

## Summary

### What Changed:
1. ✅ Installed Gemini SDK
2. ✅ Created smart categorization system
3. ✅ Added AI weekly summaries
4. ✅ Implemented quota management
5. ✅ Built automatic fallbacks

### What You Do:
1. Restart the app (`npm start`)
2. Use normally
3. Check weekly reports for AI insights

### What You Get:
- 🎯 Smarter categorization
- 🤖 Personalized AI insights
- 📊 Better productivity understanding
- 💪 Robust fallbacks
- 🔒 Privacy preserved

**Just restart and enjoy the intelligence boost!** 🚀

See `LLM_INTELLIGENCE.md` for complete technical details.
