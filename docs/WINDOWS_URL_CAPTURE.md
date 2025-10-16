# Windows URL Capture

## Overview

Productivity Monkey now includes **native Windows UI Automation** support for direct browser URL capture on Windows, providing the same feature parity as macOS Accessibility permission.

## What's New

### Before (v1.0.0)
**Windows Tracking:**
```
App: Google Chrome
Title: "GitHub - Pull Request #456"
URL: (none)
Category: ADMIN (generic - can't determine context)
```

**Limitations:**
- ❌ No direct browser URL capture
- ❌ Less accurate categorization
- ❌ Relied entirely on browser extension for URLs
- ❌ Single point of failure

### Now (v1.1.0+)
**Windows Tracking with UI Automation:**
```
App: Google Chrome
Title: "Pull Request #456 - myproject"
URL: https://github.com/username/myproject/pull/456
Category: DEEP (accurate URL-based categorization)
```

**Improvements:**
- ✅ Direct browser URL capture using Windows UI Automation
- ✅ Accurate URL-based categorization
- ✅ Dual-layer tracking (Desktop + Browser Extension)
- ✅ Fallback when browser extension is not installed
- ✅ Feature parity with macOS

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────┐
│         Windows Productivity Monkey          │
├─────────────────────────────────────────────┤
│                                              │
│  Desktop Tracker (Every 5 seconds)          │
│  ├─ get-windows: App name & window title    │
│  └─ Windows UI Automation: Browser URL ✨    │
│                                              │
│  Browser Extension (If installed)            │
│  ├─ Precise URL tracking                     │
│  ├─ Engagement metrics (keystrokes, clicks) │
│  └─ Cross-validation with desktop tracker   │
│                                              │
└─────────────────────────────────────────────┘
```

### URL Capture Priority

1. **get-windows URL** (if available from active window metadata)
2. **Windows UI Automation** (if browser detected) ← NEW!
3. **Title parsing** (fallback, less reliable)
4. **Browser extension** (if installed, provides additional detail)

### Supported Browsers

The Windows UI Automation module supports:
- ✅ **Google Chrome** (all channels: Stable, Beta, Dev, Canary)
- ✅ **Microsoft Edge** (Chromium-based)
- ✅ **Brave Browser**
- ✅ **Opera**
- ✅ **Vivaldi**
- ⚠️ **Firefox** (partial support - may require manual configuration)

---

## Installation

### Prerequisites

1. **Visual Studio Build Tools** (for native module compilation)
   ```powershell
   # Option 1: Install via npm (recommended)
   npm install --global windows-build-tools

   # Option 2: Download Visual Studio Build Tools
   # https://visualstudio.microsoft.com/downloads/
   # Select: "Desktop development with C++"
   ```

2. **Node.js 18+** with npm
   ```powershell
   node --version  # Should be v18 or higher
   ```

### Build Steps

1. **Install dependencies:**
   ```powershell
   npm install
   ```

2. **Build native module:**
   ```powershell
   npm run build:native
   ```
   This compiles the Windows UI Automation C++ module.

3. **Build TypeScript and run:**
   ```powershell
   npm run build
   npm start
   ```

### Verifying Installation

Check if the native module was built successfully:
```powershell
ls build\Release\windows_url_capture.node
```

You should see the compiled `.node` file.

---

## No Permissions Required!

Unlike macOS, Windows **does not require any special permissions** for URL capture:

| Platform | Permission Required | What It Enables |
|----------|---------------------|-----------------|
| **macOS** | Screen Recording + Accessibility | Window titles + Browser URLs |
| **Windows** | None ✅ | Window titles + Browser URLs |

Windows allows applications to use UI Automation without user permission dialogs, making setup simpler.

---

## How It Compares to macOS

### macOS (with Accessibility Permission)
```typescript
// Uses active-win with accessibilityPermission: true
const activeWindow = await activeWin({
  screenRecordingPermission: true,
  accessibilityPermission: true  // Captures URLs directly
});

const url = activeWindow.url;  // Direct URL from Accessibility API
```

### Windows (with UI Automation)
```typescript
// Uses active-win + Windows UI Automation
const activeWindow = await activeWin({
  screenRecordingPermission: false,  // Not required on Windows
  accessibilityPermission: false     // Not required on Windows
});

// If no URL from active-win, use Windows UI Automation
const url = windowsUrlCapture.getActiveWindowUrl();
```

Both approaches provide:
- ✅ Direct browser URL capture
- ✅ Accurate categorization
- ✅ Works across multiple browsers
- ✅ Fallback if browser extension fails

---

## Technical Details

### Native Module Architecture

**File:** `src/native/windows-url-capture/windows-url-capture.cc`

The native module:
1. Uses Windows UI Automation COM API (`IUIAutomation`)
2. Gets the foreground window handle
3. Searches for the address bar control by automation ID:
   - Chrome: `Chrome_OmniboxView` or `Address and search bar`
   - Edge: `addressInput`
   - Firefox: `urlbar-input`
4. Extracts the URL value from the address bar
5. Returns UTF-8 encoded URL string to Node.js

### Performance Optimizations

- **Singleton instance:** The UI Automation instance is reused across calls
- **Search limit:** Limits tree traversal to first 50 elements to prevent slowdown
- **Early exit:** Stops searching once URL is found
- **Graceful fallback:** Returns empty string if capture fails (no crashes)

### Browser Detection

The module checks the window class name before attempting URL capture:
```cpp
wchar_t className[256];
GetClassNameW(hwnd, className, 256);

bool isBrowser = (classStr.find(L"Chrome") != std::wstring::npos ||
                 classStr.find(L"Mozilla") != std::wstring::npos ||
                 classStr.find(L"Edge") != std::wstring::npos ||
                 classStr.find(L"Brave") != std::wstring::npos);
```

This prevents unnecessary UI Automation queries for non-browser windows.

---

## Troubleshooting

### Issue: "Cannot find module 'windows_url_capture.node'"

**Cause:** Native module not built.

**Solution:**
```powershell
npm run build:native
```

### Issue: "Build failed: MSBuild not found"

**Cause:** Visual Studio Build Tools not installed.

**Solution:**
```powershell
# Install build tools
npm install --global windows-build-tools

# Or install manually from:
# https://visualstudio.microsoft.com/downloads/
# Select: "Desktop development with C++"
```

### Issue: URLs not being captured

**Debugging steps:**

1. **Check if native module is loaded:**
   ```powershell
   ls build\Release\windows_url_capture.node
   ```

2. **Check console for errors:**
   - Run `npm start` and watch for "Windows URL capture error" messages

3. **Verify browser is supported:**
   - Works best with Chrome, Edge, Brave
   - Firefox may need additional configuration

4. **Check database for URLs:**
   ```powershell
   # Open SQLite database
   sqlite3 %APPDATA%\prodmon\prodmon.db

   # Query recent URLs
   SELECT url, window_title, category FROM activity_records WHERE url IS NOT NULL LIMIT 10;
   ```

5. **Test manually:**
   ```javascript
   // In Node.js REPL or test script
   const windowsUrlCapture = require('./build/Release/windows_url_capture.node');
   console.log(windowsUrlCapture.getActiveWindowUrl());
   // Should print URL of active browser tab
   ```

### Issue: High CPU usage

**Cause:** UI Automation queries can be expensive if done too frequently.

**Solution:**
The tracker already limits queries to every 5 seconds, but you can increase this:

Edit `config.json`:
```json
{
  "trackingInterval": 10000  // 10 seconds instead of 5
}
```

### Issue: Some browser tabs not captured

**Cause:** Browser may use non-standard address bar controls.

**Solution:**
1. Check which browser you're using
2. Ensure it's fully focused (click into the address bar)
3. Wait 5-10 seconds for next tracking interval
4. Check console for specific error messages

---

## Comparison Table

| Feature | macOS | Windows (Before) | Windows (Now) |
|---------|-------|------------------|---------------|
| Window titles | ✅ Screen Recording | ✅ No permission | ✅ No permission |
| App names | ✅ Screen Recording | ✅ No permission | ✅ No permission |
| Browser URLs | ✅ Accessibility | ❌ Extension only | ✅ UI Automation |
| Categorization | ✅ URL-based | ❌ App-based | ✅ URL-based |
| Dual tracking | ✅ Desktop + Extension | ⚠️ Extension only | ✅ Desktop + Extension |
| Permissions required | ⚠️ 2 permissions | ✅ None | ✅ None |
| Safari support | ✅ Yes | N/A | N/A |
| Chrome support | ✅ Yes | ⚠️ Extension only | ✅ Yes |
| Edge support | ✅ Yes | ⚠️ Extension only | ✅ Yes |

---

## Benefits

### 1. Feature Parity with macOS
Windows users now get the same comprehensive tracking as macOS users.

### 2. No Permission Dialogs
Unlike macOS, Windows doesn't require users to grant permissions, making setup simpler.

### 3. Redundant Tracking
Even if browser extension fails or is not installed, desktop tracker still captures URLs.

### 4. Better Productivity Insights
URL-based categorization is much more accurate than app-based:

**Before:**
```
Chrome - 8 hours (What were they doing? Unknown)
```

**Now:**
```
GitHub - 4 hours (Deep work)
Stack Overflow - 2 hours (Shallow work - research)
YouTube - 1 hour (Distracted)
Gmail - 1 hour (Admin)
```

### 5. Works Across Browsers
No need to install extension in every browser - desktop tracker captures URLs from all supported browsers.

---

## Privacy & Security

### What the Module Does
✅ Reads the address bar URL from the active browser window
✅ Stores URL in local SQLite database
✅ Uses standard Windows UI Automation API

### What It Does NOT Do
❌ Does NOT record keystrokes (content)
❌ Does NOT take screenshots
❌ Does NOT read clipboard
❌ Does NOT access browser history files
❌ Does NOT send data to external servers

### Data Storage
All data is stored locally:
```
%APPDATA%\prodmon\prodmon.db (SQLite database)
```

You can inspect the database anytime:
```powershell
sqlite3 %APPDATA%\prodmon\prodmon.db
SELECT url, window_title, category FROM activity_records LIMIT 10;
```

---

## Next Steps

1. ✅ **Build the native module** (`npm run build:native`)
2. ✅ **Run the application** (`npm start`)
3. ✅ **Browse some websites** (GitHub, YouTube, Stack Overflow)
4. ✅ **Check the dashboard** for URL data in Browser Activity section
5. ✅ **Verify accuracy** - URLs should match what you're browsing

---

## Future Improvements

Potential enhancements:
- [ ] Add support for more browsers (Arc, Tor Browser)
- [ ] Improve Firefox URL capture reliability
- [ ] Add configuration for address bar control IDs
- [ ] Optimize performance with caching
- [ ] Add telemetry for URL capture success rate

---

## Summary

### What You Gain:
✅ **Direct URL capture** from all major browsers on Windows
✅ **No permissions required** (unlike macOS)
✅ **Feature parity** with macOS tracking
✅ **Accurate categorization** based on URLs, not just app names
✅ **Redundant tracking** (Desktop + Browser Extension)
✅ **Better productivity insights** with detailed URL data

### Recommendation:
Enable Windows URL capture by building the native module for the most comprehensive tracking experience on Windows!

**Windows is now a first-class platform** with the same powerful tracking capabilities as macOS! 🎉
