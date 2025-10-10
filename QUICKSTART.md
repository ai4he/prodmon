# 🐒 Productivity Monkey - Quick Start Guide

## Running the App

The app is currently running! You should see the Productivity Monkey setup window.

### First Time Setup

1. Complete the setup form with:
   - Your full name
   - Email address
   - Job title
   - Team name
   - Department
   - Manager's email (optional)

2. Click "Start Tracking 🚀"

3. The app will:
   - Start tracking your activity in the background
   - Show the dashboard with real-time metrics
   - Appear in your system tray

### Using the App

**Dashboard**: View real-time productivity metrics
- Focus Score (0-100)
- Deep Work Hours
- Active Hours
- Context Switches
- Time Distribution Charts
- Top Applications

**System Tray**: Right-click the tray icon for:
- Open Dashboard
- View Reports
- Start/Stop Tracking
- Settings
- Quit

### Commands

```bash
# Install dependencies (first time only)
npm install

# Development mode (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Start the app
npm start

# Or use the startup script
./start.sh
```

### Stopping the App

- **macOS**: Cmd+Q or Quit from system tray
- **Windows**: Alt+F4 or Quit from system tray

### Data Storage

All data is stored locally on your machine:
- Database: `~/Library/Application Support/prodmon/prodmon.db` (macOS)
- Config: `~/Library/Application Support/prodmon/config.json` (macOS)

### Next Steps

1. ✅ Complete initial setup
2. ✅ Let it run for a few hours to collect data
3. ✅ Check the dashboard to see your productivity metrics
4. ✅ View weekly reports for insights and recommendations
5. ✅ Compare your metrics with team averages

### Granting Permissions (macOS)

On first run, macOS will ask for permissions:

1. **System Preferences** → **Security & Privacy** → **Privacy**
2. Grant access to **Accessibility** (required for tracking)
3. Grant access to **Screen Recording** (required for window tracking)

### Troubleshooting

**App won't start?**
```bash
# Check for errors
npm start

# Rebuild from scratch
rm -rf node_modules dist
npm install
npm run build
```

**No data appearing?**
- Make sure tracking is enabled (check system tray)
- Grant required macOS permissions
- Check console for errors

**Database issues?**
```bash
# Reset database (WARNING: deletes all data)
rm ~/Library/Application\ Support/prodmon/prodmon.db
```

### Features

✅ **Activity Tracking** - Silent background monitoring
✅ **Smart Classification** - AI-powered work categorization
✅ **Focus Score** - 0-100 productivity metric
✅ **Weekly Reports** - Detailed insights and recommendations
✅ **Team Analytics** - Compare with team averages
✅ **Dashboard** - Real-time metrics visualization
✅ **Privacy-First** - All data stored locally

### Support

For issues or questions:
- Check the README.md for detailed documentation
- Review the code in `src/` directory
- Open an issue on GitHub

---

**🐒 Enjoy tracking your productivity!**

*"If we can't improve your team's productivity by 10% in 3 months, it's free."*
