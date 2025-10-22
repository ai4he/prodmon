# Building Productivity Monkey Installers

This document describes how to build platform-specific installers for Productivity Monkey.

## Prerequisites

Before building, ensure you have:

1. Node.js 20+ installed
2. npm installed
3. All dependencies installed: `npm install`

## Supported Platforms

Productivity Monkey supports building installers for:

- **macOS**: DMG installer (x64 and ARM64/Apple Silicon)
- **Windows**: NSIS installer and Portable executable (x64)
- **Linux**: AppImage, DEB, and RPM packages (x64)

## Build Commands

### Build All Platforms

```bash
npm run build
```

This will:
1. Build native modules (optional - Windows URL capture)
2. Generate app icons from browser extension icons
3. Compile TypeScript
4. Create installers for the current platform

### Build Platform-Specific Installers

#### macOS (DMG)

```bash
npm run build:client:mac
```

**Output files** (in `build/` directory):
- `Productivity-Monkey-1.0.0-x64.dmg` - Intel Macs
- `Productivity-Monkey-1.0.0-arm64.dmg` - Apple Silicon Macs

**Note**: Building macOS installers on non-macOS platforms requires additional configuration.

#### Windows (NSIS + Portable)

```bash
npm run build:client:win
```

**Output files** (in `build/` directory):
- `Productivity-Monkey-Setup-1.0.0.exe` - NSIS installer (recommended)
- `Productivity-Monkey-Portable-1.0.0.exe` - Portable version (no installation required)

**Note**: Building Windows installers on non-Windows platforms requires Wine.

#### Linux (AppImage, DEB, RPM)

```bash
npm run build:client:linux
```

**Output files** (in `build/` directory):
- `Productivity-Monkey-1.0.0.AppImage` - Universal Linux package (runs on most distros)
- `productivity-monkey_1.0.0_amd64.deb` - Debian/Ubuntu package
- `productivity-monkey-1.0.0.x86_64.rpm` - RedHat/Fedora/CentOS package

## Build Configuration

The build configuration is defined in `electron-builder.yml`:

### macOS Configuration
- **Target**: DMG
- **Architectures**: x64, arm64 (universal support)
- **Category**: Productivity

### Windows Configuration
- **Targets**: NSIS installer + Portable executable
- **Architecture**: x64
- **Features**:
  - Installation directory selection
  - Desktop shortcut creation
  - Start menu shortcuts
  - Non-one-click installer (user can customize)

### Linux Configuration
- **Targets**: AppImage, DEB, RPM
- **Architecture**: x64
- **Category**: Utility
- **Dependencies**: Automatically includes required system libraries

## Icon Generation

The build process automatically generates platform-specific icons from the browser extension icons:

- **Source**: `browser-extension/chrome/icons/icon128.png`
- **Output**: `build-resources/icon.png` (and variants)
- **Script**: `scripts/generate-icons.js`

The script will:
1. Check if `sharp` is available for high-resolution icon generation (512x512, 1024x1024)
2. Fall back to copying the base 128x128 icon if `sharp` is not installed
3. electron-builder automatically generates `.icns` (macOS) and `.ico` (Windows) from the PNG

## Build Output

All build artifacts are placed in the `build/` directory:

```
build/
├── Productivity-Monkey-1.0.0-x64.dmg           # macOS Intel
├── Productivity-Monkey-1.0.0-arm64.dmg         # macOS Apple Silicon
├── Productivity-Monkey-Setup-1.0.0.exe         # Windows NSIS installer
├── Productivity-Monkey-Portable-1.0.0.exe      # Windows portable
├── Productivity-Monkey-1.0.0.AppImage          # Linux AppImage
├── productivity-monkey_1.0.0_amd64.deb         # Debian/Ubuntu
└── productivity-monkey-1.0.0.x86_64.rpm        # RedHat/Fedora/CentOS
```

## Platform-Specific Build Notes

### macOS
- Code signing requires an Apple Developer certificate
- Notarization requires Apple ID credentials
- For unsigned builds (development), users will need to right-click > Open

### Windows
- Code signing requires a Windows code signing certificate
- Unsigned builds will show Windows SmartScreen warnings
- NSIS installer provides better integration than portable version

### Linux
- **AppImage** is recommended for universal compatibility
- **DEB** packages work on Debian, Ubuntu, Linux Mint, Pop!_OS, etc.
- **RPM** packages work on RedHat, Fedora, CentOS, openSUSE, etc.

## Continuous Integration / GitHub Actions

For automated builds via GitHub Actions, see `.github/workflows/` directory.

The CI workflow can build for all platforms and create GitHub releases automatically.

## Troubleshooting

### Icon Generation Issues

If icon generation fails:
1. Ensure dependencies are installed: `npm install`
2. The script will fall back to using the 128x128 icon
3. For production, ensure `sharp` is properly installed for high-res icons

### Build Fails on Cross-Platform

electron-builder can build for different platforms, but some limitations apply:
- macOS builds from Windows/Linux require additional tools
- Windows builds from macOS/Linux require Wine
- Linux builds work from any platform

### Native Module Build Failures

The Windows native URL capture module is optional:
- Build will continue even if native module compilation fails
- The app will fall back to basic window tracking
- For full functionality, build on Windows with Visual Studio Build Tools

## Distribution

After building:

1. **macOS**: Distribute the DMG file. Users drag the app to Applications folder.
2. **Windows**: Distribute the NSIS installer for standard installation, or portable version for USB/no-install scenarios.
3. **Linux**:
   - AppImage: Most universal, works without installation
   - DEB: For Debian-based distributions
   - RPM: For RedHat-based distributions

## Version Management

Update the version in `package.json` before building:

```json
{
  "version": "1.0.0"
}
```

The version number is automatically included in all installer filenames.
