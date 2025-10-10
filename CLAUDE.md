# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Productivity Monkey** is a comprehensive team productivity monitoring and analytics tool consisting of:

1. **Electron Desktop App** - Tracks desktop application usage, keyboard/mouse activity, idle time
2. **Browser Extension** (Chrome, Edge, Firefox) - Tracks precise browser activity (URLs, time, engagement)
3. **Native Messaging Bridge** - Connects browser extension to desktop app
4. **SQLite Database** - Stores all activity data
5. **Analytics Engine** - Calculates productivity metrics and generates insights
6. **Dashboard UI** - Visualizes metrics and team comparisons

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Development mode with auto-reload
npm run build        # Build TypeScript and package Electron app
npm start            # Run the Electron app
```

## Architecture

### Desktop Tracking (src/agent/)
- `tracker.ts` - Captures desktop app activity using active-win
- `index.ts` - Main agent that runs tracking loop

### Browser Tracking (browser-extension/)
- `chrome/` - Chrome/Edge extension (Manifest V3)
- `firefox/` - Firefox extension (Manifest V2)
- `background.js` - Tracks tabs, URLs, navigation
- `content.js` - Captures user engagement (keystrokes, clicks, scrolling)
- Native messaging host bridges extension to Electron app

### Database (src/database/)
- `schema.ts` - SQLite schema and database manager
- Stores activity records, users, metrics

### Analytics (src/analytics/)
- `metrics.ts` - Calculates productivity scores, categorizes activity
- `reports.ts` - Generates weekly reports with insights

### UI (ui/)
- `setup.html` - Initial user configuration
- `dashboard.html` - Main productivity dashboard
- `reports.html` - Weekly report viewer
- `settings.html` - Configuration settings

## Critical Design Notes

1. **Browser extension is ESSENTIAL** - Without it, we only see "Chrome" as app name, not actual websites visited
2. **Native messaging** - Browser can't directly access file system; uses native messaging host to communicate with Electron app
3. **Privacy-first** - Keystrokes counted but NOT logged, no screenshots
4. **5-second intervals** - Both desktop and browser tracking use same 5s interval for consistency
