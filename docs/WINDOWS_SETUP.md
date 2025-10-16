# Windows Setup Guide

Complete guide for running Productivity Monkey on Windows 10/11.

---

## Prerequisites

### Required Software

1. **Node.js 18+**
   - Download from: https://nodejs.org/
   - Recommended: LTS version
   - Installer will add to PATH automatically

2. **Git** (for cloning repository)
   - Download from: https://git-scm.com/download/win
   - Or use GitHub Desktop

3. **Visual Studio Build Tools** (for native modules)
   - Download: https://visualstudio.microsoft.com/downloads/
   - Select "Desktop development with C++"
   - Or install via npm: `npm install --global windows-build-tools`

### Verify Installation

```powershell
# Check Node.js
node --version
# Should show v18.x.x or higher

# Check npm
npm --version
# Should show 9.x.x or higher

# Check Git
git --version
```

---

## Installation

### 1. Clone Repository

```powershell
git clone https://github.com/ai4he/prodmon.git
cd prodmon
```

### 2. Install Build Tools (Required for URL Capture)

To enable native browser URL capture, install Visual Studio Build Tools:

```powershell
# Option 1: Install via npm (recommended)
npm install --global windows-build-tools

# Option 2: Manual installation
# Download from: https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++"
```

### 3. Install Dependencies

```powershell
npm install
```

**Note:** This may take 5-10 minutes on first run as it compiles native modules.

If you encounter errors, ensure Visual Studio Build Tools are installed (see step 2).

### 4. Build Application

```powershell
# Build native module for URL capture (Windows only)
npm run build:native

# Build TypeScript
npm run build
```

This:
1. Compiles the Windows UI Automation native module for URL capture
2. Compiles TypeScript to JavaScript in the `dist/` folder

---

## Running the Application

### Development Mode

```powershell
npm start
```

This will:
- ✅ Launch Electron app
- ✅ Start desktop activity tracking
- ✅ Open dashboard window
- ✅ Create system tray icon

### First Launch

On first run, complete the setup wizard:
1. Enter your name, email, and job details
2. Click "Start Tracking"
3. App will begin monitoring in background

### System Tray

Look for the Productivity Monkey icon in the system tray (bottom-right, near clock).

Right-click for options:
- Dashboard
- View Reports
- Start/Stop Tracking
- Settings
- Quit

---

## Browser Extension Setup

### Install Extension

#### Chrome/Edge:
1. Open: `chrome://extensions` or `edge://extensions`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked"
4. Navigate to: `prodmon\browser-extension\chrome`
5. Click "Select Folder"

#### Firefox:
1. Open: `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to: `prodmon\browser-extension\firefox`
4. Select any file in the folder

### Configure Native Messaging

The app should **auto-configure** native messaging on startup.

**Manual setup (if auto-config fails):**

1. Get extension ID:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Copy the Extension ID (long alphanumeric string)

2. Configure from app:
   - Right-click system tray icon
   - Select "Browser Extension Setup"
   - Paste extension ID
   - Click "Install"

3. Verify:
   - Click extension icon in browser
   - Should show "✓ Native App: Connected"

---

## Building Installer

### Create Windows Installer (.exe)

```powershell
npm run build:client:win
```

This creates an NSIS installer in `build\` folder:
```
build\
└── Productivity Monkey Setup 1.0.0.exe
```

### Installer Options

The installer will:
- Install to `C:\Program Files\Productivity Monkey`
- Create desktop shortcut
- Create Start Menu entry
- Add to Windows startup (optional)
- Register uninstaller

---

## Data Storage

### Database Location

```
%APPDATA%\prodmon\prodmon.db
```

Full path example:
```
C:\Users\YourName\AppData\Roaming\prodmon\prodmon.db
```

### Configuration File

```
%APPDATA%\prodmon\config.json
```

Full path example:
```
C:\Users\YourName\AppData\Roaming\prodmon\config.json
```

### View Database

```powershell
# Install SQLite browser
winget install SQLiteBrowser.SQLiteBrowser

# Open database
# File > Open Database > navigate to %APPDATA%\prodmon\prodmon.db
```

---

## Server Mode (Optional)

### Run as Server

```powershell
npm run server
```

Server will listen on `http://localhost:3000`

### Configure Client for Remote Server

Edit `%APPDATA%\prodmon\config.json`:

```json
{
  "userId": "your-user-id",
  "userName": "Your Name",
  "userEmail": "you@company.com",
  "title": "Engineer",
  "team": "Engineering",
  "department": "Product",
  "trackingInterval": 5000,
  "idleThreshold": 300000,
  "serverUrl": "http://your-server:3000",
  "serverApiKey": "your-api-key"
}
```

Or use environment variables:

```powershell
$env:PRODMON_SERVER_URL="http://your-server:3000"
$env:PRODMON_API_KEY="your-api-key"
npm start
```

---

## Troubleshooting

### Issue: "Cannot find module 'active-win'"

**Solution:**
```powershell
npm install --force
npm rebuild
```

### Issue: Build errors with native modules

**Solution:**
```powershell
# Install Windows Build Tools
npm install --global windows-build-tools

# Or install Visual Studio Build Tools manually
# Then rebuild
npm rebuild
```

### Issue: "EPERM: operation not permitted"

**Solution:** Run PowerShell as Administrator

```powershell
# Right-click PowerShell
# Select "Run as Administrator"
```

### Issue: Extension not connecting

**Solutions:**

1. **Check registry key:**
   ```powershell
   reg query "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.prodmon.app"
   ```
   Should show path to manifest JSON.

2. **Reinstall native messaging:**
   - Open Productivity Monkey
   - Tray icon → Browser Extension Setup
   - Enter extension ID
   - Click Install

3. **Check manifest file:**
   ```
   %LOCALAPPDATA%\Productivity Monkey\NativeMessagingHost\com.prodmon.app.json
   ```

4. **Restart browser** completely (close all windows)

### Issue: Tray icon not appearing

**Solution:** Check Windows notification area settings

1. Right-click taskbar → Taskbar settings
2. Notification area → Select which icons appear
3. Turn on "Productivity Monkey"

### Issue: No activity being tracked

**Solutions:**

1. Check if tracking is enabled (tray menu)
2. Run as Administrator (for some apps)
3. Check Task Manager for "Productivity Monkey" process
4. Check logs in: `%APPDATA%\prodmon\`

### Issue: High CPU usage

**Solutions:**

1. Increase tracking interval:
   ```json
   {
     "trackingInterval": 10000  // 10 seconds instead of 5
   }
   ```

2. Disable browser extension temporarily

3. Check for updates: `npm update`

---

## Performance Optimization

### Reduce Memory Usage

1. **Close unused apps** being tracked
2. **Increase tracking interval** (see above)
3. **Clear old data:**
   ```powershell
   # Backup first!
   cp %APPDATA%\prodmon\prodmon.db %APPDATA%\prodmon\prodmon.db.backup

   # Open database and run:
   # DELETE FROM activity_records WHERE timestamp < strftime('%s', 'now', '-30 days') * 1000;
   ```

### Startup Performance

To prevent auto-start:
```powershell
# Remove from startup folder
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Productivity Monkey.lnk"
```

---

## Permissions

### Windows Defender

Windows Defender may flag the app on first run.

**Allow through Windows Defender:**
1. Windows Security → Virus & threat protection
2. Manage settings → Exclusions
3. Add an exclusion → Folder
4. Add: `C:\Program Files\Productivity Monkey`

### Firewall (if using server mode)

```powershell
# Allow Node.js through firewall
netsh advfirewall firewall add rule name="Productivity Monkey Server" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes
```

---

## Windows-Specific Features

### Task Scheduler Integration

Run at startup without showing console:

```powershell
# Create scheduled task
schtasks /create /tn "Productivity Monkey" /tr "C:\Program Files\Productivity Monkey\Productivity Monkey.exe" /sc onlogon /rl highest
```

### Windows Services

Run as a background service (advanced):

```powershell
# Install node-windows
npm install -g node-windows

# Create service (from project root)
node install-service-windows.js
```

---

## Upgrading

### Update to Latest Version

```powershell
cd prodmon
git pull origin main
npm install
npm run build
npm start
```

### Migrate Data

Database and config are preserved in `%APPDATA%\prodmon\`

No migration needed unless specified in release notes.

---

## Uninstalling

### Via Installer

1. Settings → Apps → Productivity Monkey
2. Click "Uninstall"

### Manual Cleanup

Remove data (optional):
```powershell
rmdir /s "%APPDATA%\prodmon"
```

Remove registry keys (optional):
```powershell
reg delete "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.prodmon.app" /f
reg delete "HKEY_CURRENT_USER\Software\Microsoft\Edge\NativeMessagingHosts\com.prodmon.app" /f
```

---

## Development on Windows

### VS Code Setup

Recommended extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features

### Debug Configuration

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": ["."],
      "outputCapture": "std"
    }
  ]
}
```

---

## Command Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Compile TypeScript |
| `npm start` | Run application |
| `npm run dev` | Development mode with auto-reload |
| `npm run build:client:win` | Build Windows installer |
| `npm run server` | Start server mode |
| `npm test` | Run tests |

---

## Support

For Windows-specific issues:
- Check this guide first
- Review [main documentation](../README.md)
- Check [GitHub Issues](https://github.com/ai4he/prodmon/issues)
- Tag issues with `platform:windows`

---

## Windows-Specific Features

### 🆕 Native Browser URL Capture

**New in v1.1.0:** Windows now has **native URL capture** using Windows UI Automation!

This provides the same functionality as macOS Accessibility permission:
- ✅ **Direct browser URL capture** (Chrome, Edge, Brave, Opera, Vivaldi)
- ✅ **No permissions required** (unlike macOS)
- ✅ **Accurate URL-based categorization**
- ✅ **Dual-layer tracking** (Desktop + Browser Extension)

**Setup:**
```powershell
# Install build tools (one-time)
npm install --global windows-build-tools

# Build native module
npm run build:native

# Run application
npm start
```

See [WINDOWS_URL_CAPTURE.md](WINDOWS_URL_CAPTURE.md) for complete details.

---

## Known Windows Limitations

1. **No Screen Recording permission dialog** (unlike macOS)
   - Windows doesn't require permission for screen capture
   - App can access window information directly

2. **Antivirus may flag** native modules
   - Add exclusion for `node_modules` folder
   - Sign executable for production

3. **Case-insensitive paths**
   - Windows file system is case-insensitive
   - Be aware when sharing code with macOS/Linux users

4. **Different path separators**
   - Use `path.join()` or `path.resolve()` always
   - Never hardcode `\` or `/` in paths

---

## Windows 11 Specific

### Installation on Windows 11

Everything works the same, but note:
- Redesigned tray area (click up arrow)
- May need to pin tray icon
- Windows Terminal replaces PowerShell

### Windows 11 Features

- Better multi-monitor support
- Snap Layouts compatibility
- Native ARM64 support (future)

---

**✅ Windows is fully supported! Follow this guide for smooth setup.**

🐒 **Happy tracking on Windows!**
