# Productivity Monkey - Server Backend

## Quick Links

- 📘 **[Server Deployment Guide](SERVER_DEPLOYMENT.md)** - Complete deployment instructions
- ⚙️ **[Configuration Guide](CONFIGURATION_GUIDE.md)** - How to configure storage modes
- 📋 **[Implementation Summary](BACKEND_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- 🚀 **[Server README](src/server/README.md)** - Server-specific quick reference

---

## What's New?

Productivity Monkey now supports **centralized storage backend**:

### Before: Local Only
```
Each user → Own SQLite database → Individual analytics
```

### Now: Local OR Remote
```
Local Mode:  User → Local SQLite → Individual analytics
Remote Mode: Users → Server API → Shared SQLite → Team analytics
```

---

## Choose Your Mode

### Local Storage (Default)

**When to use:**
- Individual productivity tracking
- Privacy-sensitive environments
- Offline usage required
- Personal projects

**Setup:** None required - works out of the box

**Data location:** `~/Library/Application Support/prodmon/`

### Remote Storage (Team Mode)

**When to use:**
- Team productivity analytics
- Centralized data collection
- Multi-user reports
- Organization-wide insights

**Setup:** Configure server URL and API key

**Data location:** Centralized server

---

## Quick Start (Remote Mode)

### 1. Start Server

```bash
# On server machine (or same machine for testing)
npm install
npm run build
npm run server
```

Server starts on `http://localhost:3000`

### 2. Configure Client

Edit `~/Library/Application Support/com.prodmon.app/config.json`:

```json
{
  "userId": "user-123",
  "userName": "Your Name",
  "userEmail": "you@company.com",
  "title": "Your Title",
  "team": "Your Team",
  "department": "Your Department",
  "managerId": null,
  "trackingInterval": 5000,
  "idleThreshold": 300000,
  "serverUrl": "http://localhost:3000",
  "serverApiKey": "your-secret-api-key"
}
```

### 3. Restart Client

```bash
npm start
```

### 4. Verify

Check console for:
```
📡 Using remote storage: http://localhost:3000
✓ Saved 10 activities to storage
```

---

## Features

### Server Capabilities

- ✅ **REST API** - 11 endpoints for all operations
- ✅ **Authentication** - API key-based security
- ✅ **User Management** - Multi-user support
- ✅ **Activity Tracking** - Single and batch recording
- ✅ **Metrics Calculation** - Weekly reports, app usage, focus scores
- ✅ **Team Analytics** - Cross-user insights
- ✅ **LLM Integration** - AI-powered insights (optional)
- ✅ **Health Monitoring** - Health checks and status

### Client Features

- ✅ **Automatic Mode Selection** - Local or remote via config
- ✅ **Batch Uploads** - Efficient network usage
- ✅ **Automatic Retry** - No data loss on network failures
- ✅ **Offline Buffering** - Activities saved locally if server down
- ✅ **Seamless Switching** - Change modes without code changes

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│              Client Applications                 │
├──────────────────────────────────────────────────┤
│  Electron App + Browser Extension + Native Host  │
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │      Storage Client Abstraction            │  │
│  │  (Automatically selects local or remote)   │  │
│  └─────────────┬──────────────────────────────┘  │
└────────────────┼─────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│    Local     │   │    Remote    │
│   SQLite     │   │   HTTP API   │
└──────────────┘   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │    Server    │
                   │  Express.js  │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   SQLite     │
                   │ (Centralized)│
                   └──────────────┘
```

---

## Server API Examples

### Health Check
```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/health
```

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@company.com",
    "title": "Engineer",
    "team": "Engineering",
    "department": "Product"
  }'
```

### Get Team Metrics
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/api/reports/team/Engineering?weekStart=1699999999&weekEnd=1700000000"
```

See [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) for complete API documentation.

---

## Deployment Options

### Development
```bash
npm run server:dev  # Auto-reload on changes
```

### Production - PM2
```bash
pm2 start dist/server/server.js --name prodmon-server
pm2 save
pm2 startup
```

### Production - Docker
```bash
docker build -t prodmon-server .
docker run -d -p 3000:3000 \
  -e API_KEY=your-key \
  -v /data:/data \
  prodmon-server
```

### Production - Systemd
```bash
sudo systemctl enable prodmon-server
sudo systemctl start prodmon-server
```

See [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) for detailed instructions.

---

## Configuration

### Server Environment Variables

```bash
PORT=3000                          # Server port
DB_PATH=/var/lib/prodmon/db        # Database location
API_KEY=your-secure-key            # Authentication key
GEMINI_API_KEY=your-gemini-key     # Optional: LLM integration
```

### Client Configuration

```json
{
  "serverUrl": "http://server:3000",     // Server address
  "serverApiKey": "your-secure-key",     // Must match server
  "storageMode": "remote"                // Optional: explicit mode
}
```

See [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md) for details.

---

## Security

### ⚠️ IMPORTANT

1. **Change default API key** - Do NOT use default in production
2. **Use HTTPS** - For remote servers (via Nginx/load balancer)
3. **Firewall rules** - Restrict server access
4. **Strong API keys** - Use 32+ random characters

### Generate Secure API Key

```bash
# macOS/Linux
openssl rand -hex 32

# Or
uuidgen
```

---

## Monitoring

### Health Check
```bash
curl -H "X-API-Key: key" http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": 1699999999999,
  "llm": "enabled"
}
```

### Server Logs

```bash
# PM2
pm2 logs prodmon-server

# Systemd
sudo journalctl -u prodmon-server -f

# Docker
docker logs -f prodmon-server
```

---

## Troubleshooting

### Client Can't Connect to Server

1. Verify server is running: `curl http://server:3000/health`
2. Check firewall rules
3. Verify correct serverUrl in config
4. Check API key matches

### Server Won't Start

1. Check port is available: `lsof -i :3000`
2. Verify database path exists and is writable
3. Check environment variables are set
4. Review server logs for errors

### Data Not Syncing

1. Check console for "Using remote storage" message
2. Verify activities are being buffered: "Saved X activities"
3. Check server logs for incoming requests
4. Test API manually with curl

See [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) for more troubleshooting.

---

## Migration

### Local → Remote (Keep History)

```bash
# 1. Copy local database to server
cp ~/Library/Application\ Support/prodmon/prodmon.db \
   /server/path/prodmon-server.db

# 2. Start server with that database
DB_PATH=/server/path/prodmon-server.db npm run server

# 3. Configure client with serverUrl
# 4. Restart client
```

### Remote → Local

```bash
# 1. Remove serverUrl from config
# 2. Restart client
# 3. New activities saved locally
```

---

## Team Setup Example

**Scenario:** 5-person team, 1 server

### Step 1: Server Setup (Admin)

```bash
# On server machine
git clone <repo>
cd prodmon
npm install
npm run build

# Configure
export PORT=3000
export API_KEY=$(openssl rand -hex 32)
export DB_PATH=/var/lib/prodmon/team.db

# Start
npm run server

# Share API key with team
echo $API_KEY
```

### Step 2: Team Member Setup

Each team member configures their client:

```json
{
  "userId": "unique-per-user",
  "userName": "Team Member Name",
  "userEmail": "member@company.com",
  "title": "Job Title",
  "team": "Engineering",
  "department": "Product",
  "serverUrl": "http://server-ip:3000",
  "serverApiKey": "<api-key-from-step-1>"
}
```

### Step 3: Start Tracking

```bash
npm start  # On each team member machine
```

### Step 4: View Team Analytics

Access team reports via:
- Client UI (View Reports → Team metrics)
- Server API (`/api/reports/team/Engineering`)

---

## Performance

### Expected Load

| Users | Requests/min | Response Time | Recommendation |
|-------|-------------|---------------|----------------|
| 1 | 10-20 | <10ms | Any machine |
| 10 | 100-200 | <50ms | 1 CPU core |
| 100 | 1,000-2,000 | <100ms | 2+ CPU cores |

### Optimizations

- ✅ Batch uploads (10 activities per request)
- ✅ Database indexing
- ✅ Client-side buffering
- ✅ LLM caching (1-minute)

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) | Complete deployment guide (900+ lines) |
| [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md) | Configuration reference (400+ lines) |
| [BACKEND_IMPLEMENTATION_SUMMARY.md](BACKEND_IMPLEMENTATION_SUMMARY.md) | Technical implementation details |
| [server/README.md](server/README.md) | Server quick reference |
| [LLM_INTELLIGENCE.md](LLM_INTELLIGENCE.md) | LLM integration guide |
| [LLM_QUICK_START.md](LLM_QUICK_START.md) | LLM user guide |

---

## Support

**Questions?** Check documentation above

**Issues?** Troubleshooting sections in guides

**Production setup?** See [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md)

---

## Summary

### What You Get

- 🎯 **Flexible Storage** - Local or remote via simple config
- 🎯 **Team Analytics** - Cross-user insights and reports
- 🎯 **Production Ready** - Security, monitoring, deployment guides
- 🎯 **Easy Setup** - Configure once, works forever
- 🎯 **No Vendor Lock-in** - Self-hosted, open source

### Getting Started

**Individual Use:**
```bash
npm start  # That's it! (local storage by default)
```

**Team Use:**
```bash
# Server: npm run server
# Clients: Add serverUrl to config, npm start
```

---

🐒 **Productivity Monkey - Individual OR Team Tracking** 🚀

Choose your mode. Scale when ready. Never locked in.
