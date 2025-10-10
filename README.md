# 🐒 Productivity Monkey

**"If we can't improve your team's productivity by 10% in 3 months, it's free."**

Productivity Monkey is a comprehensive productivity monitoring and analytics tool for macOS and Windows that helps teams measure, analyze, and improve their work patterns.

## Features

### Core Capabilities

- **Activity Tracking**: Silent background agent tracks application usage, window titles, input activity, and more
- **Smart Classification**: AI-powered categorization of work into Deep, Shallow, Admin, and Distracted time
- **Focus Score**: 0-100 metric combining deep work hours, context switches, session length, and distraction levels
- **Team Analytics**: Compare individual performance against team averages
- **Weekly Reports**: Automated reports with insights and actionable recommendations
- **Leaderboards**: Rank team members by focus score and productivity metrics

### Key Metrics Tracked

- Total hours worked vs. productive hours
- Deep work time and session length
- Context switches per hour
- Input activity (keystrokes and mouse movements)
- Media playback detection
- App and website usage breakdown
- Meeting vs. focus time

## Installation

### Prerequisites

- Node.js 18+
- macOS 10.14+ or Windows 10+

### Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run the application
npm start
```

## Usage

### First Launch

1. Launch Productivity Monkey
2. Complete the setup wizard with your information:
   - Full name
   - Email
   - Job title
   - Team name
   - Department
   - Manager (optional)

3. Grant necessary permissions:
   - **macOS**: Accessibility permissions for screen recording
   - **Windows**: No special permissions required

4. The agent will start tracking automatically in the background

### Dashboard

The dashboard shows real-time productivity metrics:

- **Focus Score**: Your overall productivity rating (0-100)
- **Deep Work Hours**: Time spent in focused, high-value work
- **Active Hours**: Total productive time
- **Context Switches**: How often you switch between apps
- **Time Distribution**: Visual breakdown of work categories
- **Top Applications**: Most-used apps with time tracking

### Weekly Reports

View detailed weekly reports with:

- Personal metrics vs. team averages
- Activity and behavior analysis
- Top applications used
- Insights and alerts
- Personalized recommendations

### System Tray

Access Productivity Monkey from your system tray:

- **Dashboard**: Open the main dashboard
- **View Reports**: Access weekly reports
- **Tracking**: Start/stop activity tracking
- **Settings**: Configure preferences
- **Quit**: Exit the application

## Architecture

```
prodmon/
├── src/
│   ├── agent/          # Background tracking agent
│   │   ├── tracker.ts  # Activity capture logic
│   │   └── index.ts    # Agent orchestration
│   ├── analytics/      # Metrics and reporting
│   │   ├── metrics.ts  # Focus score calculation
│   │   └── reports.ts  # Report generation
│   ├── database/       # SQLite database layer
│   │   └── schema.ts   # Schema and queries
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   └── main.ts         # Electron main process
├── ui/                 # HTML/CSS UI files
│   ├── setup.html      # Initial setup wizard
│   ├── dashboard.html  # Main dashboard
│   └── reports.html    # Report viewer
└── package.json
```

## Privacy & Security

- All data is stored **locally** on your machine
- No data is sent to external servers by default
- Database encryption available (configure in settings)
- Anonymized reporting options for team metrics

## Development

### Build for Production

```bash
# Build installers for current platform
npm run build

# Output will be in /build directory
```

### Run in Development

```bash
# Watch mode with hot reload
npm run dev
```

## Focus Score Algorithm

The Focus Score (0-100) is calculated from four components:

1. **Deep Work Ratio** (40 points max): Percentage of active time in deep work
2. **Context Switching** (20 points max): Penalty for frequent app switches
3. **Session Length** (20 points max): Rewards sustained focus periods
4. **Distraction Control** (20 points max): Penalty for unproductive time

Formula:
```
focusScore = min(100,
  (deepWorkHours/activeHours × 100 × 0.4) +
  max(0, 20 - contextSwitchesPerHour × 1.5) +
  min(20, avgSessionLength / 3) +
  max(0, 20 - unproductivePercent × 100)
)
```

## ROI Calculation

Productivity Monkey helps teams achieve measurable productivity gains:

- **10% productivity increase** = 4.2 extra productive hours per week per employee
- For a 10-person team at $25/hour average = **$1,050/week** = **$54,600/year** value gain
- Tool cost: $5/user/month = $50/month for 10 users = **$600/year**
- **ROI: 9,000%**

## Roadmap

### v1.0 (Current - MVP)
- ✅ Activity tracking agent
- ✅ Focus score calculation
- ✅ Weekly reports
- ✅ Team leaderboards
- ✅ Dashboard UI

### v1.1 (Next)
- AI-powered recommendations
- Calendar integration
- Slack/Teams notifications
- Custom alert rules

### v2.0 (Future)
- Automated task assistance via AI
- Smart scheduling
- Meeting optimizer
- Burnout detection & prevention
- Mobile companion app

## Support

For issues, questions, or feature requests:
- GitHub Issues: [github.com/yourorg/prodmon/issues]
- Email: support@productivitymonkey.com
- Docs: [docs.productivitymonkey.com]

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ to make teams more productive**

🐒 Productivity Monkey - *Because productivity shouldn't be a mystery*
