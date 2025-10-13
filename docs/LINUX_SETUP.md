# Linux Setup Guide

Complete guide for running Productivity Monkey on Ubuntu, Fedora, Arch, and other Linux distributions.

---

## Prerequisites

### Required Software

1. **Node.js 18+**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Fedora
   sudo dnf install nodejs

   # Arch
   sudo pacman -S nodejs npm
   ```

2. **Git**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install git

   # Fedora
   sudo dnf install git

   # Arch
   sudo pacman -S git
   ```

3. **Build Tools** (for native modules)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install build-essential python3

   # Fedora
   sudo dnf groupinstall "Development Tools"
   sudo dnf install python3

   # Arch
   sudo pacman -S base-devel python
   ```

4. **X11 Libraries** (required for active-win)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install libx11-dev libxss-dev

   # Fedora
   sudo dnf install libX11-devel libXScrnSaver-devel

   # Arch
   sudo pacman -S libx11 libxss
   ```

### Verify Installation

```bash
# Check Node.js
node --version
# Should show v18.x.x or higher

# Check npm
npm --version
# Should show 9.x.x or higher

# Check Git
git --version

# Check X11 (required for window tracking)
echo $DISPLAY
# Should show something like :0 or :1
```

---

## Important: X11 vs Wayland

**Productivity Monkey requires X11 (not Wayland)** for window tracking.

### Check Your Display Server

```bash
echo $XDG_SESSION_TYPE
```

- If output is `x11` → ✅ Good to go
- If output is `wayland` → ⚠️ Need to switch to X11

### Switch from Wayland to X11

**Ubuntu/GNOME:**
1. Log out
2. At login screen, click gear icon (⚙️)
3. Select "Ubuntu on Xorg" or "GNOME on Xorg"
4. Log in

**Fedora:**
1. Log out
2. Click username
3. Click gear icon
4. Select "GNOME Classic" or "GNOME on Xorg"
5. Log in

**Other distros:**
- Check your display manager settings
- Look for X11/Xorg session option

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/ai4he/prodmon.git
cd prodmon
```

### 2. Install Dependencies

```bash
npm install
```

**Note:** This may take 5-10 minutes as it compiles native modules (including active-win for Linux).

If you encounter errors, ensure X11 dev libraries are installed (see Prerequisites).

### 3. Build Application

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

---

## Running the Application

### Development Mode

```bash
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

Look for the Productivity Monkey icon in your system tray (usually top or bottom panel).

Right-click for options:
- Dashboard
- View Reports
- Start/Stop Tracking
- Settings
- Quit

---

## Browser Extension Setup

### Install Extension

#### Chrome/Chromium:
1. Open: `chrome://extensions`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked"
4. Navigate to: `prodmon/browser-extension/chrome`
5. Click "Open"

#### Firefox:
1. Open: `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to: `prodmon/browser-extension/firefox`
4. Select any file in the folder

### Configure Native Messaging

The app should **auto-configure** native messaging on startup.

**Manual setup (if auto-config fails):**

1. Get extension ID:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Copy the Extension ID

2. Configure from app:
   - Right-click system tray icon
   - Select "Browser Extension Setup"
   - Paste extension ID
   - Click "Install"

3. Verify:
   - Manifest location: `~/.config/google-chrome/NativeMessagingHosts/com.prodmon.app.json`
   - Wrapper script: `~/.local/bin/prodmon-native-host.sh`

---

## Building Packages

### Create AppImage (Universal)

```bash
npm run build:client:linux
```

Output: `build/Productivity Monkey-1.0.0.AppImage`

**Run AppImage:**
```bash
chmod +x build/Productivity\ Monkey-*.AppImage
./build/Productivity\ Monkey-*.AppImage
```

### Create .deb Package (Debian/Ubuntu)

```bash
npm run build:client:linux
```

Output: `build/productivity-monkey_1.0.0_amd64.deb`

**Install .deb:**
```bash
sudo dpkg -i build/productivity-monkey_*.deb
sudo apt-get install -f  # Fix dependencies if needed
```

### Manual Installation

```bash
# Copy to /opt
sudo mkdir -p /opt/productivity-monkey
sudo cp -r dist ui node_modules package.json /opt/productivity-monkey/

# Create launcher script
cat > /usr/local/bin/productivity-monkey << 'EOF'
#!/bin/bash
cd /opt/productivity-monkey
electron .
EOF

sudo chmod +x /usr/local/bin/productivity-monkey

# Create desktop entry
cat > ~/.local/share/applications/productivity-monkey.desktop << 'EOF'
[Desktop Entry]
Name=Productivity Monkey
Comment=Team productivity monitoring
Exec=/usr/local/bin/productivity-monkey
Terminal=false
Type=Application
Categories=Utility;
EOF
```

---

## Data Storage

### Database Location

```bash
~/.config/prodmon/prodmon.db
```

Full path example:
```
/home/username/.config/prodmon/prodmon.db
```

### Configuration File

```bash
~/.config/prodmon/config.json
```

### View Database

```bash
# Install SQLite browser
sudo apt-get install sqlitebrowser  # Ubuntu/Debian
sudo dnf install sqlitebrowser      # Fedora
sudo pacman -S sqlitebrowser        # Arch

# Open database
sqlitebrowser ~/.config/prodmon/prodmon.db
```

---

## Server Mode (Optional)

### Run as Server

```bash
npm run server
```

Server will listen on `http://localhost:3000`

### Configure Client for Remote Server

Edit `~/.config/prodmon/config.json`:

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

```bash
export PRODMON_SERVER_URL="http://your-server:3000"
export PRODMON_API_KEY="your-api-key"
npm start
```

---

## Troubleshooting

### Issue: "Cannot find module 'active-win'"

**Solution:**
```bash
npm install --force
npm rebuild
```

### Issue: Build errors with X11 libraries

**Error:** `fatal error: X11/Xlib.h: No such file or directory`

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install libx11-dev libxss-dev

# Fedora
sudo dnf install libX11-devel libXScrnSaver-devel

# Arch
sudo pacman -S libx11 libxss

# Then rebuild
npm rebuild
```

### Issue: Extension not connecting

**Solutions:**

1. **Check manifest file:**
   ```bash
   cat ~/.config/google-chrome/NativeMessagingHosts/com.prodmon.app.json
   ```
   Should contain correct path to wrapper script.

2. **Check wrapper script:**
   ```bash
   ls -la ~/.local/bin/prodmon-native-host.sh
   # Should be executable (rwxr-xr-x)
   ```

3. **Make wrapper executable:**
   ```bash
   chmod +x ~/.local/bin/prodmon-native-host.sh
   ```

4. **Test wrapper manually:**
   ```bash
   ~/.local/bin/prodmon-native-host.sh
   # Should start without errors
   ```

5. **Restart browser completely**

### Issue: Tray icon not appearing

**Solutions:**

1. **Install tray icon support:**
   ```bash
   # GNOME
   sudo apt-get install gnome-shell-extension-appindicator

   # KDE - Should work by default

   # XFCE
   sudo apt-get install xfce4-indicator-plugin
   ```

2. **Enable tray extensions (GNOME):**
   ```bash
   gnome-extensions enable appindicatorsupport@rgcjonas.gmail.com
   ```

3. **Restart GNOME Shell:**
   Press `Alt+F2`, type `r`, press Enter

### Issue: No activity being tracked

**Possible causes:**

1. **Not using X11:**
   ```bash
   echo $XDG_SESSION_TYPE
   # Must show 'x11', not 'wayland'
   ```

2. **X11 permissions:**
   ```bash
   xdpyinfo
   # Should show display information
   # If error, X11 is not properly configured
   ```

3. **Check if app is running:**
   ```bash
   ps aux | grep electron
   ps aux | grep prodmon
   ```

### Issue: "Error: Cannot open display"

**Solution:** Make sure X11 is running and $DISPLAY is set

```bash
echo $DISPLAY
# Should show :0 or similar

# If empty, set it:
export DISPLAY=:0
```

### Issue: High CPU usage

**Solutions:**

1. **Increase tracking interval:**
   ```json
   {
     "trackingInterval": 10000  // 10 seconds instead of 5
   }
   ```

2. **Check if running multiple instances:**
   ```bash
   ps aux | grep electron | grep prodmon
   # Should only show one instance
   ```

3. **Disable browser extension temporarily**

---

## Distribution-Specific Notes

### Ubuntu 20.04 / 22.04 / 24.04

```bash
# Full setup
sudo apt-get update
sudo apt-get install -y nodejs npm git build-essential python3 libx11-dev libxss-dev
git clone https://github.com/ai4he/prodmon.git
cd prodmon
npm install
npm run build
npm start
```

### Fedora 38 / 39 / 40

```bash
# Full setup
sudo dnf install -y nodejs npm git gcc-c++ make python3 libX11-devel libXScrnSaver-devel
git clone https://github.com/ai4he/prodmon.git
cd prodmon
npm install
npm run build
npm start
```

### Arch Linux

```bash
# Full setup
sudo pacman -Syu
sudo pacman -S nodejs npm git base-devel python libx11 libxss
git clone https://github.com/ai4he/prodmon.git
cd prodmon
npm install
npm run build
npm start
```

### Pop!_OS

Same as Ubuntu (based on Ubuntu)

### Linux Mint

Same as Ubuntu (based on Ubuntu)

---

## Autostart

### systemd User Service

Create `~/.config/systemd/user/productivity-monkey.service`:

```ini
[Unit]
Description=Productivity Monkey
After=graphical-session.target

[Service]
Type=simple
ExecStart=/usr/bin/npm start
WorkingDirectory=/path/to/prodmon
Environment=DISPLAY=:0
Restart=on-failure

[Install]
WantedBy=default.target
```

Enable autostart:
```bash
systemctl --user enable productivity-monkey
systemctl --user start productivity-monkey
```

### Desktop Autostart

Create `~/.config/autostart/productivity-monkey.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=Productivity Monkey
Exec=/path/to/prodmon/start-prodmon.sh
Terminal=false
X-GNOME-Autostart-enabled=true
```

Create start script `start-prodmon.sh`:
```bash
#!/bin/bash
cd /path/to/prodmon
npm start
```

---

## Performance Optimization

### Reduce Memory Usage

1. **Use AppImage instead of running from source**
2. **Increase tracking interval** (see config)
3. **Clear old data:**
   ```bash
   sqlite3 ~/.config/prodmon/prodmon.db
   DELETE FROM activity_records WHERE timestamp < strftime('%s', 'now', '-30 days') * 1000;
   .quit
   ```

### GPU Acceleration

If you encounter graphical issues:

```bash
# Disable GPU acceleration
npm start --no-sandbox --disable-gpu
```

Or add to launcher:
```bash
electron . --no-sandbox --disable-gpu
```

---

## Security

### AppArmor / SELinux

If using AppArmor or SELinux, you may need to configure policies.

**Check if AppArmor is blocking:**
```bash
sudo aa-status
sudo grep prodmon /var/log/syslog
```

**Check if SELinux is blocking:**
```bash
sudo ausearch -m avc -ts recent | grep prodmon
```

### Firewall (if using server mode)

```bash
# UFW (Ubuntu)
sudo ufw allow 3000/tcp

# firewalld (Fedora)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

---

## Development on Linux

### VS Code Setup

Install recommended extensions:
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

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
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
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
| `npm run build:client:linux` | Build AppImage and .deb packages |
| `npm run server` | Start server mode |
| `npm test` | Run tests |

---

## Known Linux Limitations

1. **Wayland not supported** - Must use X11
   - Wayland doesn't allow window tracking for security
   - Switch to X11 session (see instructions above)

2. **Different desktop environments** - Tray icon may vary
   - GNOME: May need appindicator extension
   - KDE: Works out of the box
   - XFCE: May need indicator plugin
   - i3/sway: Tray not supported (use command line)

3. **Snap/Flatpak sandboxing**
   - If using sandboxed browsers, native messaging may not work
   - Use non-sandboxed Chrome/Chromium

4. **Different distributions** - Package names vary
   - Ubuntu: `libx11-dev`
   - Fedora: `libX11-devel`
   - Arch: `libx11`

---

## Distribution Compatibility

| Distribution | Status | Notes |
|--------------|--------|-------|
| Ubuntu 20.04+ | ✅ Fully supported | Recommended |
| Debian 11+ | ✅ Fully supported | |
| Fedora 38+ | ✅ Fully supported | |
| Arch Linux | ✅ Fully supported | |
| Pop!_OS | ✅ Fully supported | Based on Ubuntu |
| Linux Mint | ✅ Fully supported | Based on Ubuntu |
| elementary OS | ✅ Supported | Based on Ubuntu |
| Manjaro | ✅ Supported | Based on Arch |
| openSUSE | ⚠️ Should work | Not tested |
| CentOS/RHEL 8+ | ⚠️ Should work | May need EPEL repo |

---

## Support

For Linux-specific issues:
- Check this guide first
- Review [main documentation](../README.md)
- Check [GitHub Issues](https://github.com/ai4he/prodmon/issues)
- Tag issues with `platform:linux`

---

## Quick Start Script

Copy and paste for instant setup:

```bash
#!/bin/bash
# Ubuntu/Debian quick setup

# Install dependencies
sudo apt-get update
sudo apt-get install -y nodejs npm git build-essential python3 libx11-dev libxss-dev

# Clone and build
git clone https://github.com/ai4he/prodmon.git
cd prodmon
npm install
npm run build

# Create desktop entry
mkdir -p ~/.local/share/applications
cat > ~/.local/share/applications/productivity-monkey.desktop << EOF
[Desktop Entry]
Name=Productivity Monkey
Exec=$(pwd)/start.sh
Terminal=false
Type=Application
Categories=Utility;
EOF

# Start app
npm start
```

---

**✅ Linux is fully supported with X11! Follow this guide for smooth setup.**

🐒 **Happy tracking on Linux!**
