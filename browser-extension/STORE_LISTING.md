# Productivity Monkey - Store Listings

## Extension Name
**Productivity Monkey - Browser Tracker**

## Short Description (132 characters max for Chrome)
Track browser activity precisely. Monitor URLs, time spent, engagement, and productivity metrics. Requires desktop app.

## Detailed Description

### For Chrome Web Store / Edge Add-ons (max 16,000 characters)

Transform your browser activity into actionable productivity insights with Productivity Monkey Browser Tracker.

**Why You Need This Extension**

Without this extension, the Productivity Monkey desktop app can only see "Chrome" or "Firefox" as your application name. It can't tell if you're coding on GitHub, learning on Stack Overflow, or browsing social media. This extension bridges that gap by providing:

✅ **Exact URL tracking** - Know precisely which websites you visit
✅ **Accurate time tracking** - Measure time spent on each site with millisecond precision
✅ **Engagement metrics** - Track keystrokes, clicks, and scrolling (counts only, content not recorded)
✅ **Productivity categorization** - Automatically classify sites as deep work, shallow work, or distractions
✅ **Context switching detection** - Understand your multitasking patterns
✅ **Media detection** - Identify when you're watching videos or listening to music

**Key Features**

🎯 **Precise Tracking**
- Captures full URLs including query parameters
- Records exact page titles and domains
- Tracks session duration with millisecond accuracy
- Distinguishes active tabs from background tabs

📊 **Smart Analytics**
- Automatic site categorization (deep work, shallow work, learning, distractions)
- Engagement scoring based on activity
- Context switching analysis
- Idle time detection (stops tracking when you're away)

🔒 **Privacy-First Design**
- Keystroke counts only (never logs what you type)
- No screenshots or content capture
- No data sent to external servers
- All data stored locally on your machine
- Open source code you can audit

🚀 **Seamless Integration**
- Works with Productivity Monkey desktop app
- Syncs automatically via native messaging
- Real-time data updates
- Cross-platform support (Windows, macOS, Linux)

**Who Is This For?**

- **Freelancers & Remote Workers** - Understand your productivity patterns and bill time accurately
- **Teams & Managers** - Get aggregate insights into team productivity (with consent)
- **Students** - Track study time and minimize distractions
- **Anyone** - Who wants to understand their digital habits and work smarter

**How It Works**

1. Install the Productivity Monkey desktop app
2. Install this browser extension
3. Configure native messaging (one-time setup via the desktop app)
4. Browse normally - the extension tracks automatically
5. View insights in the Productivity Monkey dashboard

**Site Categorization**

The extension automatically categorizes websites:

**Deep Work:**
- GitHub, GitLab, BitBucket (code repositories)
- Stack Overflow, documentation sites
- Design tools (Figma, Miro)
- Cloud platforms (AWS, GCP, Azure)
- Note-taking apps (Notion, Obsidian)

**Shallow Work:**
- Slack, Teams, Discord (communication)
- Email (Gmail, Outlook)
- Project management (Asana, Jira, Trello)

**Learning:**
- Online courses (Coursera, Udemy)
- Wikipedia, research papers
- Technical blogs

**Distractions:**
- Social media (Facebook, Twitter, Instagram, Reddit, TikTok)
- Entertainment (YouTube personal, Netflix, streaming)
- News sites, shopping sites

**Privacy & Ethics**

This tool is designed for personal productivity insights, not surveillance:
- ✅ Transparent tracking with user knowledge and consent
- ✅ Personal use for self-improvement
- ✅ Team analytics with explicit consent
- ❌ Never deploy secretly or without consent
- ❌ Never use for punitive measures or micromanagement

**Requirements**

- Productivity Monkey desktop app (available at [your website])
- Native messaging setup (automatic via desktop app)
- Windows 10+, macOS 10.13+, or modern Linux distribution

**Support**

For setup help, troubleshooting, or questions:
- Visit our documentation
- Check the GitHub repository
- Contact support

**Open Source**

Productivity Monkey is open source software. Audit the code, contribute, or fork it for your needs.

### For Firefox Add-ons (max 250 characters short summary)

Track browser activity precisely for Productivity Monkey. Monitors URLs, time spent, engagement metrics, and categorizes sites automatically. Privacy-first: counts keystrokes but never logs content. Requires Productivity Monkey desktop app.

## Categories

### Chrome Web Store
- **Primary:** Productivity
- **Secondary:** Developer Tools

### Edge Add-ons
- **Primary:** Productivity
- **Secondary:** Developer Tools

### Firefox Add-ons
- **Primary:** Other
- **Secondary:** Privacy & Security

## Screenshots Needed

Create the following screenshots (1280x800 or 1920x1080 recommended):

1. **Dashboard Overview**
   - Show the Productivity Monkey dashboard with browser activity data
   - Highlight URL tracking, time spent, and productivity scores
   - Caption: "Comprehensive browser activity analytics integrated with desktop tracking"

2. **Extension Popup**
   - Screenshot of the extension popup showing status and quick stats
   - Caption: "Quick access to tracking status and recent activity"

3. **Site Categorization**
   - Dashboard showing automatic categorization of websites
   - Caption: "Automatic categorization: Deep Work, Shallow Work, Learning, and Distractions"

4. **Time Tracking**
   - Detailed view of time spent on different websites
   - Caption: "Precise time tracking with millisecond accuracy"

5. **Engagement Metrics**
   - Dashboard showing engagement metrics and productivity scores
   - Caption: "Track engagement through keystrokes, clicks, and activity patterns"

## Promotional Images

### Small Tile (440x280 PNG - required for Chrome)
- Logo/icon centered
- App name
- Tagline: "Track Browser Activity for Better Productivity"

### Marquee Promotional Image (1400x560 PNG - optional but recommended)
- Hero image showing dashboard
- Key features listed
- Call to action

## Store Metadata

### Tags/Keywords (Chrome)
- productivity
- time tracking
- browser tracking
- productivity monitoring
- activity tracker
- time management
- focus
- analytics

### Search Tags (Firefox)
- productivity
- tracking
- time-management
- analytics
- monitoring

## Additional Assets

### Privacy Policy URL
[Your privacy policy URL]

### Support/Homepage URL
[Your website or GitHub repository]

### Version Notes (for first submission)

**Version 1.1.0 - Initial Release**

Features:
- Precise URL and time tracking
- Engagement metrics (keystrokes, clicks, scrolling)
- Automatic site categorization
- Media detection
- Context switching analysis
- Native messaging integration with desktop app
- Privacy-first design (no content logging)

Technical:
- Manifest V3 for Chrome/Edge
- Manifest V2 for Firefox
- Cross-platform native messaging support
- Local-first data storage

## Pricing
**Free**

## Permissions Justification

You'll need to justify these permissions during submission:

### `tabs`
**Justification:** Required to track active tab changes and monitor which tabs are in use. Essential for understanding browser activity patterns and measuring time spent on different websites.

### `activeTab`
**Justification:** Needed to identify the currently active tab and track focus changes. This allows the extension to accurately measure time spent on specific websites.

### `storage`
**Justification:** Used to store user configuration (user ID, tracking preferences) and temporarily cache activity data before syncing with the desktop app.

### `idle`
**Justification:** Detects when the user is away from the computer to pause tracking and prevent inflated metrics during inactive periods.

### `webNavigation`
**Justification:** Monitors navigation events (page loads, tab switches) to accurately track browsing behavior and measure time spent on each site.

### `nativeMessaging`
**Justification:** Communicates with the Productivity Monkey desktop application to sync browser activity data with desktop tracking data for comprehensive productivity analytics.

### `<all_urls>` (Host Permissions)
**Justification:** Required to inject content scripts on all websites to monitor user engagement (keystrokes, clicks, scrolling) and detect media playback. The extension needs broad access to provide comprehensive activity tracking across all sites the user visits.

## Video (Optional but Recommended)

Create a 30-60 second demo video showing:
1. Installing the extension
2. Setting up native messaging
3. Browsing websites
4. Viewing analytics in the dashboard
5. Key features highlight

Upload to YouTube and provide the link in the store listing.

## Review Preparation

### For Manual Review
Store reviewers will need to test the extension. Prepare:

1. **Test Instructions:**
   - Download the Productivity Monkey desktop app
   - Install the extension
   - Configure native messaging (provide extension ID)
   - Browse a few test websites
   - Open the dashboard to see tracked activity

2. **Test Account (if applicable):**
   - Provide a demo account if your app requires signup
   - Include credentials for reviewers

3. **Video Demo:**
   - Record a 2-3 minute video showing full setup and usage
   - Upload unlisted to YouTube
   - Include link in review notes

4. **Native Messaging Setup:**
   - Explain that native messaging is required
   - Provide clear setup instructions
   - Note that reviewers may need to install the desktop app

## Launch Checklist

Before submitting:

- [ ] Extension packages created and tested
- [ ] All icons generated (16, 32, 48, 96, 128)
- [ ] Screenshots captured (at least 3-5)
- [ ] Store descriptions written
- [ ] Privacy policy published
- [ ] Support website/documentation ready
- [ ] Test the extension on all target platforms
- [ ] Verify native messaging works
- [ ] Check all permissions are justified
- [ ] Prepare demo video (optional but helpful)
- [ ] Set up developer accounts (Chrome, Edge, Firefox)
- [ ] Payment information added (one-time fee for Chrome)
- [ ] Review and verify package contents

## Post-Launch

After approval:
1. Monitor reviews and respond promptly
2. Track installation metrics
3. Gather user feedback
4. Plan updates and improvements
5. Update documentation based on common questions
