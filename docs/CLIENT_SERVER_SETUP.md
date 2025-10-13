# Client-Server Setup Guide

## Overview

This guide explains how to configure the Productivity Monkey desktop client to connect to your centralized server at **prodmon.haielab.org**.

## Prerequisites

1. **Server Running**: Ensure the server is running on prodmon.haielab.org
2. **API Key**: Get the API key from your server administrator
3. **Network Access**: Ensure you can reach the server (firewall/VPN configured)

---

## Quick Start

### Step 1: Test Server Connection (Command Line)

Before configuring the client, verify the server is accessible:

```bash
# Test basic connectivity
node test-server-connection.js https://prodmon.haielab.org

# Test with API key (replace YOUR_API_KEY)
node test-server-connection.js https://prodmon.haielab.org YOUR_API_KEY
```

Expected output if server is working:
```
✅ Health check passed
✅ Get users passed
✅ Create activity passed
🎉 All tests passed! Server is ready to use.
```

If you see errors:
- **521 Error / Connection Refused**: Server is not running or not accessible
- **401/403 Error**: Invalid API key
- **Timeout**: Network/firewall issue

---

### Step 2: Configure Client via Settings UI

1. **Build and start the client**:
   ```bash
   npm install
   npm run build
   npm start
   ```

2. **Open Settings**:
   - Click the Productivity Monkey tray icon (menu bar)
   - Select "Settings"

3. **Configure Server**:
   - **Server URL**: `https://prodmon.haielab.org`
   - **Server API Key**: `<your-api-key-here>`

4. **Test Connection**:
   - Click "Test Connection" button
   - You should see "✅ Connection successful!"

5. **Save and Restart**:
   - Click "Save Settings"
   - Quit and restart the app (Tray menu > Quit, then `npm start`)

---

### Step 3: Verify Data Sync

After restarting, check the console logs:

```
💾 Using hybrid storage (local + remote sync)
📡 Remote server: https://prodmon.haielab.org
✅ Server health check passed
✓ Saved 10 activities to storage
```

You should see activities being synced to the server every 5 seconds.

---

## Configuration File (Alternative Method)

You can also edit the configuration file directly:

**macOS**: `~/Library/Application Support/com.prodmon.app/config.json`

**Linux**: `~/.config/com.prodmon.app/config.json`

**Windows**: `%APPDATA%\com.prodmon.app\config.json`

### Example Configuration:

```json
{
  "userId": "user-12345",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "title": "Software Engineer",
  "team": "Engineering",
  "department": "Product",
  "managerId": null,
  "trackingInterval": 5000,
  "idleThreshold": 300000,
  "serverUrl": "https://prodmon.haielab.org",
  "serverApiKey": "your-api-key-here"
}
```

After editing, restart the app.

---

## Troubleshooting

### Issue 1: Server Not Responding (521 Error)

**Problem**: Cloudflare returns error 521 "Web Server Is Down"

**Solution**:
1. SSH to the server hosting prodmon.haielab.org
2. Check if Node.js server is running:
   ```bash
   pm2 status
   # or
   ps aux | grep node
   ```
3. Start the server if not running:
   ```bash
   cd /path/to/prodmon
   npm run server
   # or with pm2
   pm2 start npm --name "prodmon" -- run server
   ```
4. Check server logs:
   ```bash
   pm2 logs prodmon
   # or
   tail -f /path/to/prodmon/server.log
   ```

### Issue 2: Cannot Connect from Client

**Problem**: Client shows "Connection failed" even though server is running

**Possible causes**:
1. **Firewall blocking**: Check server firewall allows port 3000 (or configured port)
2. **Cloudflare SSL**: Ensure Cloudflare SSL mode is "Full" or "Full (strict)"
3. **Origin server config**: Check server is listening on correct host/port

**Debug steps**:
```bash
# On server machine, check if server is listening
netstat -tuln | grep 3000

# Test locally on server
curl http://localhost:3000/health

# Test from client machine
curl https://prodmon.haielab.org/health
```

### Issue 3: Authentication Failed (401/403)

**Problem**: "Authentication error" when testing connection

**Solution**:
1. Verify API key matches server configuration
2. Check server logs for authentication errors
3. Ensure API key is set correctly on server:
   ```bash
   # Check environment variable on server
   echo $API_KEY
   ```

### Issue 4: Data Not Syncing

**Problem**: Activities logged locally but not appearing on server

**Debug**:
1. Check client console logs for sync errors
2. Enable verbose logging in client
3. Check server database:
   ```bash
   # On server
   sqlite3 /path/to/prodmon-server.db
   sqlite> SELECT COUNT(*) FROM activity_records;
   sqlite> SELECT * FROM activity_records ORDER BY timestamp DESC LIMIT 5;
   ```

---

## Server Setup (For Reference)

If you need to set up the server on prodmon.haielab.org:

### Install and Configure

```bash
# Clone repo
git clone <repo-url>
cd prodmon

# Install dependencies
npm install
npm run build

# Set environment variables
export PORT=3000
export API_KEY=$(openssl rand -hex 32)
export GEMINI_API_KEY=your-gemini-key-here
export DB_PATH=/var/lib/prodmon/prodmon-server.db

# Save API key for client configuration
echo $API_KEY > ~/prodmon-api-key.txt
chmod 600 ~/prodmon-api-key.txt

# Start server
npm run server

# Or use PM2 for production
pm2 start npm --name "prodmon-server" -- run server
pm2 save
pm2 startup
```

### Cloudflare Configuration

1. **DNS**: Set A/AAAA record for `prodmon.haielab.org` pointing to server IP
2. **SSL/TLS**: Set to "Full" or "Full (strict)" mode
3. **Firewall**: Allow origin server IP
4. **Port**: Ensure origin server port is accessible (default 3000)

---

## Testing Checklist

Before deploying to all clients, verify:

- [ ] Server health endpoint responds: `curl https://prodmon.haielab.org/health`
- [ ] Can create users: `curl -X POST -H "X-API-Key: $API_KEY" https://prodmon.haielab.org/api/users -d '{"name":"Test","email":"test@example.com","title":"Tester","team":"Test","department":"Test"}'`
- [ ] Can record activity: `curl -X POST -H "X-API-Key: $API_KEY" https://prodmon.haielab.org/api/activity -d '{"userId":"test","timestamp":1234567890,"appName":"Test","windowTitle":"Test","category":"admin","keystrokesCount":0,"mouseMovements":0,"isIdle":false}'`
- [ ] Test script passes: `node test-server-connection.js https://prodmon.haielab.org $API_KEY`
- [ ] Client can connect via Settings UI
- [ ] Client logs show successful sync
- [ ] Activities appear in server database

---

## Security Best Practices

1. **Use HTTPS**: Always use `https://` URL (never HTTP in production)
2. **Protect API Key**:
   - Never commit to Git
   - Use strong, randomly generated keys
   - Rotate periodically
3. **Restrict Access**:
   - Use firewall rules to limit who can access server
   - Consider VPN for remote workers
4. **Monitor**:
   - Check server logs regularly
   - Set up alerts for failed authentication attempts

---

## Client Distribution

For distributing to team members:

### Option 1: Settings UI (Recommended)

Provide team members with:
1. Server URL: `https://prodmon.haielab.org`
2. API Key: `<get from server admin>`
3. Instructions to configure via Settings UI

### Option 2: Pre-configured Config File

1. Create template config file:
   ```json
   {
     "userId": "REPLACE_WITH_USER_ID",
     "userName": "REPLACE_WITH_NAME",
     "userEmail": "REPLACE_WITH_EMAIL",
     "title": "REPLACE_WITH_TITLE",
     "team": "Engineering",
     "department": "Product",
     "managerId": null,
     "trackingInterval": 5000,
     "idleThreshold": 300000,
     "serverUrl": "https://prodmon.haielab.org",
     "serverApiKey": "YOUR_API_KEY_HERE"
   }
   ```

2. Distribute to team members with instructions to:
   - Replace placeholders with their info
   - Copy to config location
   - Start app

### Option 3: Automated Deployment Script

Create a deployment script that:
1. Downloads/installs client
2. Configures server URL and API key
3. Creates user account on server
4. Starts client

---

## Support

For issues or questions:
1. Check server logs
2. Check client console logs
3. Run test script for diagnostics
4. Contact system administrator

---

## Summary

**TL;DR**:
1. Ensure server is running: `curl https://prodmon.haielab.org/health`
2. Get API key from server admin
3. Open client Settings, enter server URL and API key
4. Test connection, save, restart
5. Verify sync in console logs

**Server is currently down** - Please start the Node.js server on prodmon.haielab.org before configuring clients.
