# Productivity Monkey Documentation

Complete documentation for setup, configuration, deployment, and troubleshooting.

---

## 🚀 Getting Started

### Quick Setup
- **[Quick Start - Server Mode](QUICK_START_SERVER.md)** - Deploy and test the server in minutes
- **[Client-Server Setup](CLIENT_SERVER_SETUP.md)** - Configure desktop clients to connect to server
- **[Server Startup Checklist](SERVER_STARTUP_CHECKLIST.md)** - Step-by-step production server setup

### Configuration
- **[Configuration Guide](CONFIGURATION_GUIDE.md)** - Complete configuration reference
  - Local vs remote storage modes
  - Team setup examples
  - Environment variables
  - Security best practices

---

## 🖥️ Server Deployment

### Deployment Guides
- **[Server Deployment](SERVER_DEPLOYMENT.md)** - Production deployment options
  - PM2 process manager
  - Docker containers
  - systemd services
  - Nginx reverse proxy
  - SSL/TLS configuration

- **[Server README](README_SERVER.md)** - Server-specific documentation
  - API endpoints
  - Database schema
  - Authentication

- **[Backend Implementation Summary](BACKEND_IMPLEMENTATION_SUMMARY.md)** - Server architecture overview
  - Technology stack
  - Design decisions
  - API design

---

## 🧠 AI Features

### LLM Integration
- **[LLM Intelligence](LLM_INTELLIGENCE.md)** - AI-powered work categorization
  - How smart categorization works
  - Gemini API integration
  - Quota management
  - Fallback to rule-based

- **[LLM Quick Start](LLM_QUICK_START.md)** - Enable Gemini AI in 5 minutes
  - Get API key
  - Configure
  - Test

- **[Gemini Optimization](GEMINI_OPTIMIZATION.md)** - API optimization strategies
  - Caching implementation
  - Rate limiting
  - Cost reduction

---

## 🔄 Storage & Sync

- **[Hybrid Storage Implementation](HYBRID_STORAGE_IMPLEMENTATION.md)** - Local + remote sync architecture
  - How hybrid storage works
  - Offline support
  - Conflict resolution
  - Sync strategies

---

## 🌐 Browser Extension

- **[Browser Activity Display](BROWSER_ACTIVITY_DISPLAY.md)** - Browser tracking features
  - URL tracking
  - Engagement metrics
  - Native messaging

- **[Extension Memory Leak Fix](EXTENSION_MEMORY_LEAK_FIX.md)** - v1.1.0 critical fixes
  - Memory leak causes
  - Fixes applied
  - Update instructions
  - Performance improvements

---

## 💻 Platform-Specific Guides

### Windows
- **[Windows Setup](WINDOWS_SETUP.md)** - Complete Windows 10/11 setup guide
  - Prerequisites and installation
  - Native module building
  - Browser extension setup
  - Native messaging configuration
  - Building Windows installer
  - Troubleshooting Windows-specific issues

### Linux
- **[Linux Setup](LINUX_SETUP.md)** - Complete Linux setup guide
  - Prerequisites for Ubuntu, Fedora, Arch
  - X11 vs Wayland requirements
  - Build tools and X11 libraries
  - Browser extension setup
  - Building AppImage and .deb packages
  - Native messaging configuration
  - Distribution compatibility matrix
  - Troubleshooting Linux-specific issues

### macOS

### Permissions & Setup
- **[macOS Permissions](MACOS_PERMISSIONS.md)** - Required permissions explained
  - Accessibility permission
  - Screen Recording permission
  - Why they're needed
  - How to grant

- **[Accessibility Enhancement](ACCESSIBILITY_ENHANCEMENT.md)** - Enhanced tracking on macOS
  - URL capture from browsers
  - Better window information
  - Permission setup

- **[Enable Accessibility](ENABLE_ACCESSIBILITY.md)** - Step-by-step permission guide
  - Screenshots
  - Troubleshooting

### UI Fixes
- **[Menubar Icon Fix](MENUBAR_ICON_FIX.md)** - macOS tray icon fixes
  - Retina display support
  - Template images
  - Visibility improvements

---

## 📚 Documentation Index by Topic

### For New Users
1. [Quick Start - Server Mode](QUICK_START_SERVER.md)
2. [Client-Server Setup](CLIENT_SERVER_SETUP.md)
3. [Configuration Guide](CONFIGURATION_GUIDE.md)

### For Administrators
1. [Server Deployment](SERVER_DEPLOYMENT.md)
2. [Server Startup Checklist](SERVER_STARTUP_CHECKLIST.md)
3. [Configuration Guide](CONFIGURATION_GUIDE.md) - Team setup section
4. [Backend Implementation Summary](BACKEND_IMPLEMENTATION_SUMMARY.md)

### For Developers
1. [Backend Implementation Summary](BACKEND_IMPLEMENTATION_SUMMARY.md)
2. [Hybrid Storage Implementation](HYBRID_STORAGE_IMPLEMENTATION.md)
3. [LLM Intelligence](LLM_INTELLIGENCE.md)
4. [Extension Memory Leak Fix](EXTENSION_MEMORY_LEAK_FIX.md)

### For Troubleshooting
1. [Windows Setup](WINDOWS_SETUP.md) - Windows-specific issues
2. [Linux Setup](LINUX_SETUP.md) - Linux-specific issues
3. [macOS Permissions](MACOS_PERMISSIONS.md) - macOS-specific issues
4. [Enable Accessibility](ENABLE_ACCESSIBILITY.md) - Permission issues
5. [Extension Memory Leak Fix](EXTENSION_MEMORY_LEAK_FIX.md) - Browser crashes
6. [Server Startup Checklist](SERVER_STARTUP_CHECKLIST.md) - Server issues

---

## 🔍 Quick Links

| Need to... | See document |
|-----------|-------------|
| Set up on Windows | [Windows Setup](WINDOWS_SETUP.md) |
| Set up on Linux | [Linux Setup](LINUX_SETUP.md) |
| Deploy server for first time | [Server Startup Checklist](SERVER_STARTUP_CHECKLIST.md) |
| Configure client to use remote server | [Client-Server Setup](CLIENT_SERVER_SETUP.md) |
| Enable AI categorization | [LLM Quick Start](LLM_QUICK_START.md) |
| Fix browser tab crashes | [Extension Memory Leak Fix](EXTENSION_MEMORY_LEAK_FIX.md) |
| Grant macOS permissions | [Enable Accessibility](ENABLE_ACCESSIBILITY.md) |
| Set up team tracking | [Configuration Guide](CONFIGURATION_GUIDE.md) |
| Deploy to production | [Server Deployment](SERVER_DEPLOYMENT.md) |
| Understand the architecture | [Backend Implementation Summary](BACKEND_IMPLEMENTATION_SUMMARY.md) |

---

## 📝 Contributing to Documentation

When adding new documentation:

1. **Keep in docs/ folder** - All detailed docs go here
2. **Update this README** - Add links to new docs
3. **Update main README** - Add to main project README if essential
4. **Use clear titles** - Make docs easy to find
5. **Include examples** - Show, don't just tell

---

## 🐒 Need Help?

Can't find what you're looking for?

1. Check the [main README](../README.md)
2. Check the [QUICK_START guide](../QUICK_START.md)
3. Search this docs folder
4. Open a GitHub issue

---

**Last Updated:** October 2025
