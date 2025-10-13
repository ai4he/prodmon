# Quick Start - Server Mode

## ✅ Server is Working!

The server has been successfully built and tested.

---

## Test Results

**Health Check:** ✅ Passed
```json
{"status":"ok","timestamp":1760022081122,"llm":"disabled"}
```

**User Creation:** ✅ Passed
```json
{"userId":"2988121c-146b-4d8b-b41b-d64488064d96","message":"User created successfully"}
```

---

## Running the Server

### 1. Start Server

```bash
npm run server
```

You should see:
```
═══════════════════════════════════════════════════
  🐒 Productivity Monkey Server
═══════════════════════════════════════════════════
  Port: 3000
  Database: ./prodmon-server.db
  LLM: Disabled
  API Key: DEFAULT (change in production!)
═══════════════════════════════════════════════════
```

### 2. Test Health Endpoint

```bash
curl -H "X-API-Key: your-secret-api-key" http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":1760022081122,"llm":"disabled"}
```

### 3. Create a Test User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "X-API-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "title": "Engineer",
    "team": "Engineering",
    "department": "Product"
  }'
```

Expected response:
```json
{"userId":"<uuid>","message":"User created successfully"}
```

---

## Configuring Client for Remote Storage

### Option 1: Manual Config Edit

Edit `~/Library/Application Support/com.prodmon.app/config.json`:

```json
{
  "userId": "user-123",
  "userName": "Your Name",
  "userEmail": "you@company.com",
  "title": "Engineer",
  "team": "Engineering",
  "department": "Product",
  "managerId": null,
  "trackingInterval": 5000,
  "idleThreshold": 300000,
  "serverUrl": "http://localhost:3000",
  "serverApiKey": "your-secret-api-key"
}
```

### Option 2: Environment Variables

```bash
export PRODMON_SERVER_URL=http://localhost:3000
export PRODMON_API_KEY=your-secret-api-key
npm start
```

---

## Verifying Client Connection

After configuring and starting the client (`npm start`), check the console for:

```
📡 Using remote storage: http://localhost:3000
✓ Saved 10 activities to storage
```

---

## Testing the Full Flow

### Terminal 1: Start Server
```bash
npm run server
```

### Terminal 2: Start Client
```bash
npm start
```

### Terminal 3: Monitor Server Logs
```bash
# Watch for incoming requests
curl -H "X-API-Key: your-secret-api-key" \
  http://localhost:3000/api/activity/<user-id>
```

---

## Production Configuration

### Change API Key

**IMPORTANT:** Change the default API key before production use!

```bash
# Generate secure API key
openssl rand -hex 32

# Set on server
export API_KEY=<generated-key>
npm run server

# Configure on all clients
{
  "serverApiKey": "<generated-key>"
}
```

### Enable LLM (Optional)

```bash
export GEMINI_API_KEY=AIzaSyBJSX1VOTwdl1Eln4UYlXNDlfeyJviEXJk
npm run server
```

Server will show:
```
LLM: Enabled
```

---

## Common Issues

### Issue: Port 3000 Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm run server
```

### Issue: Client Can't Connect

1. Verify server is running: `curl http://localhost:3000/health`
2. Check `serverUrl` in config matches server address
3. Verify `serverApiKey` matches server's `API_KEY`

### Issue: Unauthorized (401)

Check that API key in client config matches server:
```bash
# On server
echo $API_KEY

# In client config
"serverApiKey": "<should-match>"
```

---

## Next Steps

### For Team Deployment

See [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) for:
- Production deployment options (PM2, Docker, systemd)
- Nginx reverse proxy setup
- SSL/TLS configuration
- Security hardening

### For Configuration Details

See [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md) for:
- Complete configuration reference
- Team setup examples
- Switching between local and remote
- Environment variables

---

## Summary

✅ **Server built successfully**
✅ **Endpoints tested and working**
✅ **Ready for local or remote deployment**

**Quick commands:**
```bash
# Start server
npm run server

# Test health
curl -H "X-API-Key: your-secret-api-key" http://localhost:3000/health

# Start client with remote storage
# (after configuring serverUrl in config)
npm start
```

🐒 **Happy tracking!**
