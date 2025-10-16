# Installing Visual Studio Build Tools for Windows URL Capture

## Why You Need This

To enable **native browser URL capture** on Windows, you need to build a C++ native module. This requires Visual Studio Build Tools with the C++ development workload.

## Current Issue

You have VS2019 BuildTools installed, but it's **missing the C++ toolset**:

```
gyp ERR! find VS - found "Visual Studio C++ core features"
gyp ERR! find VS - missing any VC++ toolset
```

## Solution 1: Install C++ Workload (Recommended)

### Step 1: Open Visual Studio Installer

1. Search for "Visual Studio Installer" in Windows Start Menu
2. Click on "Visual Studio Build Tools 2019" (or 2022 if available)
3. Click "Modify"

### Step 2: Install Desktop Development with C++

1. Check the box for **"Desktop development with C++"**
2. On the right side, ensure these are selected:
   - MSVC v142 - VS 2019 C++ x64/x86 build tools (or latest)
   - Windows 10 SDK (or Windows 11 SDK)
   - C++ CMake tools for Windows
3. Click "Install" or "Modify"
4. Wait for installation (can take 10-30 minutes)

### Step 3: Restart Terminal and Build

```powershell
# Close and reopen PowerShell or terminal

# Navigate to project
cd C:\Users\Carlos\Documents\projects\prodmon

# Build native module
npm run build:native

# Should see: "gyp info ok" at the end
```

---

## Solution 2: Install Complete Build Tools (Alternative)

If you prefer a fresh installation:

### Option A: Install via npm (Automated)

```powershell
npm install --global windows-build-tools
```

This will:
- Install Visual Studio Build Tools 2019
- Install Python (required for node-gyp)
- Configure everything automatically

**Note:** This can take 30-60 minutes and requires administrator privileges.

### Option B: Manual Installation (More Control)

1. **Download Visual Studio Build Tools 2022:**
   https://visualstudio.microsoft.com/downloads/
   - Scroll to "All Downloads"
   - Expand "Tools for Visual Studio 2022"
   - Download "Build Tools for Visual Studio 2022"

2. **Run the installer** (as Administrator)

3. **Select "Desktop development with C++":**
   - Check the main box for "Desktop development with C++"
   - Make sure these individual components are selected:
     - MSVC v143 - VS 2022 C++ x64/x86 build tools
     - Windows 11 SDK (or Windows 10 SDK)
     - C++ CMake tools for Windows
     - Testing tools core features

4. **Install** (30-60 minutes)

5. **Restart** your computer (recommended)

---

## Verification

After installation, verify the build tools:

```powershell
# Check if Visual Studio is detected
node-gyp configure

# Should NOT show "Could not find any Visual Studio installation"
```

If successful, you'll see output like:
```
gyp info it worked if it ends with ok
gyp info using node-gyp@10.3.1
gyp info using node@24.10.0 | win32 | x64
gyp info find Python using Python version 3.14.0
gyp info find VS using VS2022 (17.x.xxxxx.xxx) found at:
gyp info find VS "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"
gyp info ok
```

---

## Building the Native Module

Once build tools are installed:

```powershell
# Navigate to project
cd C:\Users\Carlos\Documents\projects\prodmon

# Build native module
npm run build:native

# Expected output:
# gyp info it worked if it ends with ok
# gyp info spawn VCINSTALLDIR: C:\Program Files\Microsoft Visual Studio\...
# ...lots of build output...
# gyp info ok
```

Check if the native module was built:

```powershell
ls build\Release\windows_url_capture.node
```

You should see the `.node` file (the compiled native module).

---

## Troubleshooting

### Issue: "Could not find any Visual Studio installation"

**Solution:** Install Visual Studio Build Tools with C++ workload (see above).

### Issue: "Python not found"

**Solution:**
```powershell
# Install Python 3.x
winget install Python.Python.3.12

# Or download from: https://www.python.org/downloads/
```

Then set the Python path:
```powershell
npm config set python "C:\Python312\python.exe"
```

### Issue: "Cannot find module 'windows_url_capture.node'"

**Cause:** Native module not built yet.

**Solution:**
```powershell
npm run build:native
```

### Issue: Build succeeds but module still not found

**Cause:** TypeScript files not compiled.

**Solution:**
```powershell
npm run build:tsc
```

### Issue: "Access denied" during build

**Cause:** Need administrator privileges.

**Solution:** Run PowerShell or Command Prompt as Administrator:
```powershell
# Right-click PowerShell
# Select "Run as Administrator"

cd C:\Users\Carlos\Documents\projects\prodmon
npm run build:native
```

---

## Running Without Native Module (Fallback)

**Good news:** The app will still work without the native module!

If the native module is not built, the app will:
- ✅ Still track desktop applications
- ✅ Still track window titles
- ✅ Still use browser extension for URLs (if installed)
- ⚠️ NOT capture URLs via Windows UI Automation

**To run without native module:**

```powershell
# Skip native build, just run the app
npm run build:tsc
npm start
```

The tracker will gracefully fallback to using only:
1. Window title parsing (less reliable)
2. Browser extension (if installed)

---

## Benefits of Building Native Module

With native module built:
- ✅ **Direct browser URL capture** (Chrome, Edge, Brave, etc.)
- ✅ **More accurate categorization** (URL-based)
- ✅ **Redundant tracking** (Desktop + Extension)
- ✅ **Works without browser extension**

Without native module:
- ⚠️ Relies entirely on browser extension
- ⚠️ Less accurate URL detection (title parsing only)
- ⚠️ Single point of failure

**Recommendation:** Install build tools to get the best experience!

---

## Summary

### Quick Fix (If you already have VS2019 BuildTools):

1. Open Visual Studio Installer
2. Modify VS2019 BuildTools
3. Check "Desktop development with C++"
4. Install
5. Run `npm run build:native`

### Complete Installation (If starting fresh):

```powershell
# Option 1: Automated (recommended)
npm install --global windows-build-tools

# Option 2: Manual
# Download and install Visual Studio Build Tools 2022
# Select "Desktop development with C++"
```

Then:
```powershell
cd C:\Users\Carlos\Documents\projects\prodmon
npm run build:native
npm start
```

### If You Can't Install Build Tools:

The app will still work! Just skip the native module build:
```powershell
npm run build:tsc
npm start
```

You'll need the browser extension installed for URL tracking.

---

## Next Steps

1. ✅ **Install C++ workload** (see Solution 1 above)
2. ✅ **Build native module** (`npm run build:native`)
3. ✅ **Run application** (`npm start`)
4. ✅ **Test URL capture** (browse websites and check dashboard)

Need help? See the [main Windows setup guide](WINDOWS_SETUP.md) or [Windows URL Capture documentation](WINDOWS_URL_CAPTURE.md).
