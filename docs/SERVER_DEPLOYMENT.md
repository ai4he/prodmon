# Server Deployment Guide

## Overview

Productivity Monkey now supports **remote/centralized storage** via a REST API server. This enables:

- ✅ **Team-wide data collection** - All team members send data to central server
- ✅ **Centralized analytics** - Single source of truth for team metrics
- ✅ **Scalable architecture** - Server can run on dedicated machine
- ✅ **Flexible deployment** - Local machine or remote server
- ✅ **Automatic fallback** - Falls back to local SQLite if server unavailable

---

## Architecture

### Local Storage (Default)
```
┌─────────────────┐
│  Electron App   │
│   + Browser     │──────> Local SQLite DB
│   Extension     │         (~/Library/...)
└─────────────────┘
```

### Remote Storage (New)
```
┌─────────────────┐
│  Electron App   │
│   + Browser     │──────> HTTP API ──────> Server SQLite DB
│   Extension     │                          (/path/to/db)
└─────────────────┘
```

### Team Setup
```
┌──────────────┐
│  User 1 App  │─────┐
└──────────────┘     │
                     │
┌──────────────┐     ├────> Central Server ───> Shared Database
│  User 2 App  │─────┤         (3000)
└──────────────┘     │
                     │
┌──────────────┐     │
│  User 3 App  │─────┘
└──────────────┘
```

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs Express, CORS, and all required dependencies.

### 2. Build TypeScript

```bash
npm run build
```

### 3. Start Server

#### Option A: Local Server (Same Machine)

```bash
# Default: runs on http://localhost:3000
npm run server
```

#### Option B: Remote Server (Different Machine)

```bash
# On server machine
export PORT=3000
export DB_PATH=/var/lib/prodmon/prodmon-server.db
export API_KEY=your-secure-random-api-key-here
export GEMINI_API_KEY=AIzaSyBJSX1VOTwdl1Eln4UYlXNDlfeyJviEXJk
npm run server
```

#### Option C: Development Mode (Auto-reload)

```bash
npm run server:dev
```

---

## Configuration

### Server Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `DB_PATH` | SQLite database path | `./prodmon-server.db` | No |
| `API_KEY` | Authentication key for clients | `your-secret-api-key` | **Yes** (production) |
| `GEMINI_API_KEY` | Google Gemini API key for LLM | - | No |

**Example `.env` file:**
```bash
PORT=3000
DB_PATH=/var/lib/prodmon/prodmon.db
API_KEY=super-secret-key-change-me-in-production
GEMINI_API_KEY=AIzaSyBJSX1VOTwdl1Eln4UYlXNDlfeyJviEXJk
```

### Client Configuration

Update your Electron app configuration to use remote storage:

**Option 1: Via Settings UI**

1. Open Productivity Monkey app
2. Go to Settings
3. Configure:
   - **Server URL**: `http://your-server:3000`
   - **API Key**: `super-secret-key-change-me-in-production`
   - **Storage Mode**: `remote`

**Option 2: Manually Edit Config**

Edit `~/Library/Application Support/prodmon/config.json` (macOS):

```json
{
  "userId": "user-123",
  "userName": "John Doe",
  "userEmail": "john@company.com",
  "title": "Engineer",
  "team": "Engineering",
  "department": "Product",
  "managerId": null,
  "trackingInterval": 5000,
  "idleThreshold": 300000,
  "serverUrl": "http://your-server:3000",
  "serverApiKey": "super-secret-key-change-me-in-production",
  "storageMode": "remote"
}
```

---

## API Endpoints

### Health Check
```http
GET /health
X-API-Key: your-api-key

Response:
{
  "status": "ok",
  "timestamp": 1699999999999,
  "llm": "enabled"
}
```

### Users

#### Create User
```http
POST /api/users
X-API-Key: your-api-key
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@company.com",
  "title": "Engineer",
  "team": "Engineering",
  "department": "Product",
  "managerId": null
}

Response:
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "User created successfully"
}
```

#### Get User
```http
GET /api/users/:userId
X-API-Key: your-api-key

Response:
{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@company.com",
  "title": "Engineer",
  "team": "Engineering",
  "department": "Product",
  "managerId": null,
  "createdAt": 1699999999999
}
```

#### Get All Users
```http
GET /api/users
X-API-Key: your-api-key

Response:
{
  "users": [...]
}
```

### Activity Records

#### Record Single Activity
```http
POST /api/activity
X-API-Key: your-api-key
Content-Type: application/json

{
  "userId": "user-id",
  "appName": "Visual Studio Code",
  "windowTitle": "main.ts - prodmon",
  "url": null,
  "category": "deep",
  "keystrokesCount": 45,
  "mouseMovements": 12,
  "isIdle": false,
  "mediaPlaying": false
}

Response:
{
  "activityId": "activity-id",
  "message": "Activity recorded successfully"
}
```

#### Record Activity Batch
```http
POST /api/activity/batch
X-API-Key: your-api-key
Content-Type: application/json

{
  "activities": [
    {
      "userId": "user-id",
      "appName": "Chrome",
      "category": "deep",
      ...
    },
    ...
  ]
}

Response:
{
  "inserted": 10,
  "message": "10 activities recorded successfully"
}
```

#### Get Activities
```http
GET /api/activity/:userId?start=1699999999&end=1700000000&limit=1000
X-API-Key: your-api-key

Response:
{
  "activities": [...]
}
```

### Metrics

#### Get Weekly Metrics
```http
GET /api/metrics/weekly/:userId?weekStart=1699999999&weekEnd=1700000000
X-API-Key: your-api-key

Response:
{
  "userId": "user-id",
  "weekStart": 1699999999,
  "weekEnd": 1700000000,
  "totalHours": 40.5,
  "deepWorkHours": 25.2,
  "focusScore": 78,
  ...
}
```

#### Get App Usage
```http
GET /api/metrics/app-usage/:userId?weekStart=1699999999&weekEnd=1700000000
X-API-Key: your-api-key

Response:
{
  "appUsage": [
    {
      "appName": "Visual Studio Code",
      "timeUsed": 15.5,
      "category": "deep",
      "keystrokesCount": 12450,
      "mouseMovements": 3200
    },
    ...
  ]
}
```

### Reports

#### Generate Weekly Report
```http
GET /api/reports/weekly/:userId?weekStart=1699999999&weekEnd=1700000000
X-API-Key: your-api-key

Response:
{
  "user": {...},
  "week": {...},
  "metrics": {...},
  "teamAverages": {...},
  "appUsage": [...],
  "insights": [...],
  "recommendations": [...]
}
```

#### Get Team Metrics
```http
GET /api/reports/team/:teamName?weekStart=1699999999&weekEnd=1700000000
X-API-Key: your-api-key

Response:
{
  "teamName": "Engineering",
  "averageFocusScore": 75.5,
  "totalDeepWorkHours": 125.5,
  "members": [...]
}
```

### LLM

#### Get LLM Status
```http
GET /api/llm/status
X-API-Key: your-api-key

Response:
{
  "enabled": true,
  "quota": {
    "used": 47,
    "limit": 1500,
    "remaining": 1453,
    "failureCount": 0
  },
  "available": true
}
```

---

## Production Deployment

### 1. Systemd Service (Linux)

Create `/etc/systemd/system/prodmon-server.service`:

```ini
[Unit]
Description=Productivity Monkey Server
After=network.target

[Service]
Type=simple
User=prodmon
WorkingDirectory=/opt/prodmon
Environment=PORT=3000
Environment=DB_PATH=/var/lib/prodmon/prodmon.db
Environment=API_KEY=your-production-api-key-here
Environment=GEMINI_API_KEY=AIzaSyBJSX1VOTwdl1Eln4UYlXNDlfeyJviEXJk
ExecStart=/usr/bin/node /opt/prodmon/dist/server/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable prodmon-server
sudo systemctl start prodmon-server
sudo systemctl status prodmon-server
```

### 2. PM2 (Node.js Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start dist/server/server.js --name prodmon-server

# Set environment variables
pm2 set prodmon-server PORT 3000
pm2 set prodmon-server DB_PATH /var/lib/prodmon/prodmon.db
pm2 set prodmon-server API_KEY your-production-api-key

# Save configuration
pm2 save

# Auto-start on boot
pm2 startup
```

### 3. Docker

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist
COPY ui ./ui

ENV PORT=3000
ENV DB_PATH=/data/prodmon.db
ENV API_KEY=change-me-in-production

EXPOSE 3000

VOLUME ["/data"]

CMD ["node", "dist/server/server.js"]
```

Build and run:

```bash
# Build image
docker build -t prodmon-server .

# Run container
docker run -d \
  --name prodmon-server \
  -p 3000:3000 \
  -v /var/lib/prodmon:/data \
  -e API_KEY=your-production-api-key \
  -e GEMINI_API_KEY=AIzaSyBJSX1VOTwdl1Eln4UYlXNDlfeyJviEXJk \
  prodmon-server
```

### 4. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name prodmon.yourcompany.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

With SSL (Let's Encrypt):

```bash
sudo certbot --nginx -d prodmon.yourcompany.com
```

---

## Security

### 1. API Key Authentication

**CRITICAL:** Change default API key in production!

Generate secure API key:
```bash
# macOS/Linux
openssl rand -hex 32

# Or use UUID
uuidgen
```

Set on server:
```bash
export API_KEY=your-generated-key-here
```

Configure in all clients:
```json
{
  "serverApiKey": "your-generated-key-here"
}
```

### 2. HTTPS/TLS

**Production servers MUST use HTTPS.**

Options:
- Nginx reverse proxy with SSL (recommended)
- Express HTTPS server with certificates
- Cloud provider load balancer with SSL termination

### 3. Firewall

Restrict access to server port:

```bash
# Allow only specific IPs
sudo ufw allow from 192.168.1.0/24 to any port 3000

# Or use network security groups in cloud
```

### 4. Database Permissions

```bash
# Set proper permissions on database file
chmod 600 /var/lib/prodmon/prodmon.db
chown prodmon:prodmon /var/lib/prodmon/prodmon.db
```

---

## Monitoring

### Health Checks

```bash
# Basic health check
curl -H "X-API-Key: your-api-key" http://localhost:3000/health

# With jq for pretty output
curl -H "X-API-Key: your-api-key" http://localhost:3000/health | jq
```

### Logs

```bash
# Systemd
sudo journalctl -u prodmon-server -f

# PM2
pm2 logs prodmon-server

# Docker
docker logs -f prodmon-server
```

### Metrics

Monitor:
- Request rate (requests/second)
- Response time (ms)
- Error rate (%)
- Database size (MB)
- Active users

---

## Troubleshooting

### Issue: Connection Refused

**Symptoms:** Client can't connect to server

**Solutions:**
1. Check server is running: `curl http://localhost:3000/health`
2. Check firewall: `sudo ufw status`
3. Check server logs for errors
4. Verify correct port in client config

### Issue: Unauthorized (401)

**Symptoms:** API returns 401 Unauthorized

**Solutions:**
1. Verify API key matches on client and server
2. Check `X-API-Key` header is being sent
3. Check for typos in API key

### Issue: Database Locked

**Symptoms:** SQLite errors about database being locked

**Solutions:**
1. Ensure only one server process is running
2. Check database file permissions
3. Use WAL mode for better concurrency:
   ```sql
   PRAGMA journal_mode=WAL;
   ```

### Issue: LLM Not Working

**Symptoms:** No AI insights in reports

**Solutions:**
1. Check `GEMINI_API_KEY` is set on server
2. Verify quota status: `GET /api/llm/status`
3. Check server logs for LLM errors
4. App will automatically fall back to rule-based categorization

---

## Migration

### Migrating from Local to Remote Storage

**Step 1: Backup local database**
```bash
cp ~/Library/Application\ Support/prodmon/prodmon.db ~/prodmon-backup.db
```

**Step 2: Set up server**
```bash
npm run server
```

**Step 3: Migrate data** (optional - if you want to preserve history)
```bash
# Copy local database to server
cp ~/Library/Application\ Support/prodmon/prodmon.db /var/lib/prodmon/prodmon-server.db
```

**Step 4: Update client config**
Add to config:
```json
{
  "serverUrl": "http://your-server:3000",
  "serverApiKey": "your-api-key"
}
```

**Step 5: Restart client**
```bash
npm start
```

### Switching Back to Local Storage

Simply remove `serverUrl` from config:
```json
{
  "serverUrl": null
}
```

App will automatically use local SQLite.

---

## Performance

### Expected Load

**Single User:**
- ~10-20 activity records/minute
- ~1 metric calculation/hour
- ~1 report generation/week

**10 Users:**
- ~100-200 requests/minute
- Server can handle on single core

**100 Users:**
- ~1,000-2,000 requests/minute
- Recommend dedicated server with 2+ cores
- Consider database optimization

### Optimization Tips

1. **Batch activity uploads** (already implemented)
   - Client buffers 10 activities before sending
   - Reduces HTTP overhead

2. **Database indexes** (already created)
   - Indexed on user_id, timestamp, category
   - Fast queries even with millions of records

3. **Enable WAL mode**
   ```javascript
   db.run('PRAGMA journal_mode=WAL');
   ```

4. **Add caching** (future enhancement)
   - Redis for frequently accessed metrics
   - Reduce database load

---

## Summary

### Local Storage
- ✅ **Pros**: No setup, works offline, privacy
- ❌ **Cons**: Per-user silos, no team analytics

### Remote Storage
- ✅ **Pros**: Team analytics, centralized data, scalability
- ❌ **Cons**: Requires server, network dependency, setup complexity

### Best of Both
- Use **local storage** for individual users
- Use **remote storage** for teams/organizations
- Automatic fallback ensures resilience

---

## Support

**Questions?** Open an issue on GitHub

**Production issues?** Check:
1. Server logs
2. Client logs
3. Network connectivity
4. API key configuration
5. Database permissions

**Need help?** Review troubleshooting section above or contact your system administrator.

---

🐒 **Productivity Monkey - Now with Team Power!** 🚀
