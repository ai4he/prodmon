# Build Instructions for Productivity Monkey

This document provides platform-specific build instructions for the Productivity Monkey application, which consists of both **client-side** (Electron desktop app) and **server-side** (Node.js API server) components.

## Architecture Overview

- **Client Components**: Desktop app (Electron), Browser Extensions, Native Messaging Host
- **Server Components**: REST API server, Database, Analytics Engine
- **Shared Components**: TypeScript source code in `src/`

## Prerequisites

### All Platforms
- Node.js 18.18+
- npm 9+
- Git

### Platform-Specific Requirements

#### macOS (Client Build)
- Xcode Command Line Tools
- For active-win native module: Swift toolchain (included with Xcode)

#### Windows (Client Build)
- Visual Studio Build Tools 2019 or later
- Python 3.x (for node-gyp)
- Windows SDK

#### Linux/Ubuntu (Server Build)
- build-essential package
- No Electron packaging required for server-only builds

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd prodmon

# Install dependencies
npm install
```

## Build Commands

### TypeScript Compilation Only
```bash
npm run build:tsc
```
Compiles TypeScript to JavaScript in the `dist/` folder. Use this for server deployments that don't need Electron packaging.

### Server Build (Ubuntu/Linux)
```bash
npm run build:server
```
Compiles TypeScript only - perfect for deploying the server component on Ubuntu/Linux without the overhead of Electron packaging.

**Use case**: Deploy to Ubuntu server for centralized data collection and analytics API.

### Client Build (All Platforms)
```bash
npm run build:client
```
Compiles TypeScript AND packages the Electron app for the current platform.

#### Platform-Specific Client Builds
```bash
# Build for macOS (run on Mac)
npm run build:client:mac

# Build for Windows (run on Windows)
npm run build:client:win

# Build for Linux (run on Linux)
npm run build:client:linux
```

### Full Build (TypeScript + Electron)
```bash
npm run build
```
Same as `build:client` - compiles and packages for current platform.

## Cross-Platform Build Strategy

### Recommended Workflow

1. **Ubuntu Server (Server Component)**
   ```bash
   git clone <repo>
   npm install
   npm run build:server
   npm run server
   ```
   - Compiles TypeScript quickly without Electron overhead
   - Server runs on port 3000 (configurable via `PORT` env var)
   - Database stored at `./prodmon-server.db` (configurable via `DB_PATH`)

2. **macOS (Client Component)**
   ```bash
   git clone <repo>
   npm install
   npm run build:client:mac
   # Creates build/Productivity Monkey-1.0.0.dmg
   ```
   - Requires macOS to build .dmg installer
   - Includes active-win with full Screen Recording + Accessibility permission support
   - Browser extensions can connect via native messaging

3. **Windows (Client Component)**
   ```bash
   git clone <repo>
   npm install
   npm run build:client:win
   # Creates build/Productivity Monkey Setup 1.0.0.exe
   ```
   - Requires Windows to build .exe installer
   - Includes active-win native module for Windows

## Active-Win Compatibility Notes

The `active-win` package (v9.0.0) is used for tracking active windows and has platform-specific behavior:

- **Import**: Use named import `{ activeWindow }` instead of default import
- **macOS**: Full support with URL capture via Accessibility permissions
- **Windows**: Full support with window title and app tracking
- **Linux**: Full support with window title and app tracking

**Breaking change fixed**: The code now uses `import { activeWindow } from 'active-win'` (correct) instead of `import activeWin from 'active-win'` (incorrect for v9.0.0).

## Development Workflows

### Server Development (Ubuntu)
```bash
npm run server:dev
# Auto-recompiles TypeScript and restarts server on changes
```

### Client Development (Mac/Windows)
```bash
npm run dev
# Auto-recompiles TypeScript and reloads Electron on changes
```

### Running Components

#### Start Server
```bash
npm run server
# Or with environment variables:
PORT=8080 DB_PATH=/data/prodmon.db GEMINI_API_KEY=xxx npm run server
```

#### Start Client
```bash
npm start
# Runs the Electron app
```

## Build Output Locations

- **TypeScript Output**: `dist/` folder
- **Electron Builds**: `build/` folder
  - macOS: `build/Productivity Monkey-1.0.0.dmg`
  - Windows: `build/Productivity Monkey Setup 1.0.0.exe`
  - Linux: `build/Productivity Monkey-1.0.0.AppImage`, `build/prodmon_1.0.0_amd64.snap`

## Common Issues

### Issue: TypeScript compilation fails with active-win error
**Solution**: Ensure you're using the named import:
```typescript
import { activeWindow } from 'active-win';
// NOT: import activeWin from 'active-win';
```

### Issue: Electron-builder times out on Ubuntu
**Solution**: Use `npm run build:server` instead of `npm run build` for server-only deployments. Electron-builder is not needed for the server component.

### Issue: Native module compilation fails
**Solution**:
- macOS: Install Xcode Command Line Tools: `xcode-select --install`
- Windows: Install Visual Studio Build Tools
- Linux: Install build-essential: `sudo apt-get install build-essential`

## Environment Variables

### Server Configuration
- `PORT`: Server port (default: 3000)
- `DB_PATH`: SQLite database path (default: ./prodmon-server.db)
- `GEMINI_API_KEY`: Google Gemini API key for LLM features (optional)

### Client Configuration
- Configured via UI settings (stored in electron-store)

## CI/CD Recommendations

### GitHub Actions Example

```yaml
# Server build (Ubuntu)
- name: Build Server
  run: npm run build:server

# Client builds (platform-specific)
- name: Build macOS Client
  if: matrix.os == 'macos-latest'
  run: npm run build:client:mac

- name: Build Windows Client
  if: matrix.os == 'windows-latest'
  run: npm run build:client:win
```

## Next Steps After Build

1. **Ubuntu Server**: Deploy `dist/` folder + run `npm run server`
2. **Client Machines**: Install packaged .dmg/.exe and configure server URL
3. **Browser Extensions**: Load unpacked extension from `browser-extension/chrome` or `browser-extension/firefox`

## Questions?

Refer to CLAUDE.md for project architecture details.
