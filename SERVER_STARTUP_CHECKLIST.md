# Server Startup Checklist for prodmon.haielab.org

## Current Status
⚠️ **Server is DOWN** - Cloudflare returns 521 error (Web Server Is Down)

---

## Quick Start Server (Do This First!)

### On the server host (prodmon.haielab.org):

1. **SSH into server**:
   ```bash
   ssh user@prodmon.haielab.org
   ```

2. **Navigate to project directory**:
   ```bash
   cd /path/to/prodmon  # Change to your actual path
   ```

3. **Check if server is running**:
   ```bash
   pm2 status
   # or
   ps aux | grep node | grep prodmon
   ```

4. **If NOT running, start the server**:

   **Option A - Using PM2 (recommended for production)**:
   ```bash
   # Set environment variables
   export PORT=3000
   export API_KEY=$(openssl rand -hex 32)
   export GEMINI_API_KEY=your-gemini-api-key
   export DB_PATH=/var/lib/prodmon/prodmon-server.db

   # Save API key to file (for client configuration)
   echo $API_KEY > ~/prodmon-api-key.txt
   chmod 600 ~/prodmon-api-key.txt
   echo "API Key saved to ~/prodmon-api-key.txt"

   # Start with PM2
   pm2 start npm --name "prodmon-server" -- run server
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start on boot
   ```

   **Option B - Direct Node.js**:
   ```bash
   # Set environment variables
   export PORT=3000
   export API_KEY=your-secure-api-key-here
   export GEMINI_API_KEY=your-gemini-api-key
   export DB_PATH=./prodmon-server.db

   # Start server
   npm run server
   ```

5. **Verify server is running locally**:
   ```bash
   curl http://localhost:3000/health
   # Expected: {"status":"ok","timestamp":...}
   ```

6. **Check server logs**:
   ```bash
   pm2 logs prodmon-server
   # or if running directly, check console output
   ```

---

## Verify External Access

Once server is running locally, test external access:

```bash
# From your local machine (not the server):
curl https://prodmon.haielab.org/health
# Should return: {"status":"ok","timestamp":...}
```

If still getting 521 error, check:

### Cloudflare Settings

1. **Go to Cloudflare dashboard** → Select haielab.org domain
2. **SSL/TLS** → Set mode to "Full" or "Full (strict)"
3. **Firewall** → Ensure no rules blocking traffic
4. **Origin Rules** → Check origin server IP and port are correct

### Server Firewall

```bash
# On server, check if port 3000 is accessible
sudo ufw status
sudo ufw allow 3000/tcp  # If not already allowed

# Or for iptables:
sudo iptables -L -n | grep 3000
```

### Network/Proxy Configuration

```bash
# Check if server is binding to correct interface
netstat -tuln | grep 3000
# Should show: 0.0.0.0:3000 or :::3000

# If only showing 127.0.0.1:3000, update server config to bind to 0.0.0.0
```

---

## Configure Clients

Once server health check passes, configure clients:

### Get API Key

```bash
# On server:
cat ~/prodmon-api-key.txt
# Or check environment variable:
echo $API_KEY
```

### Test from Client Machine

```bash
# On client machine:
cd /path/to/prodmon
node test-server-connection.js https://prodmon.haielab.org YOUR_API_KEY
```

Expected output:
```
✅ Health check passed
✅ Get users passed
✅ Create activity passed
🎉 All tests passed! Server is ready to use.
```

### Configure Client App

1. Build and start client:
   ```bash
   npm install
   npm run build
   npm start
   ```

2. Open Settings (tray menu → Settings)

3. Configure:
   - **Server URL**: `https://prodmon.haielab.org`
   - **API Key**: `<paste from ~/prodmon-api-key.txt>`

4. Click "Test Connection" → Should show ✅

5. Click "Save Settings"

6. Restart app

7. Verify in console logs:
   ```
   📡 Remote server: https://prodmon.haielab.org
   ✅ Server health check passed
   ✓ Saved activities to storage
   ```

---

## Monitoring

### Check Server Health

```bash
# Server logs
pm2 logs prodmon-server

# Server status
pm2 status

# Database activity
sqlite3 /var/lib/prodmon/prodmon-server.db "SELECT COUNT(*) FROM activity_records"
```

### Check Client Sync

```bash
# Client should log every 5 seconds:
✓ Saved 10 activities to storage
✓ Synced to remote server
```

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| 521 Error | Server not running → Start with `pm2 start` or `npm run server` |
| Connection refused | Check firewall → `sudo ufw allow 3000/tcp` |
| 401/403 Error | Invalid API key → Verify key matches server config |
| Timeout | Network issue → Check firewall, proxy, or VPN |
| Server starts but crashes | Check logs → `pm2 logs prodmon-server` |
| Port already in use | Another process using port 3000 → `lsof -i :3000`, kill or use different port |

---

## Production Deployment Checklist

For production deployment:

- [ ] Server running with PM2 (auto-restart on crash)
- [ ] PM2 configured to start on boot (`pm2 startup`)
- [ ] Strong API key generated and saved securely
- [ ] Database path configured (`DB_PATH` environment variable)
- [ ] Gemini API key configured (for LLM features)
- [ ] Firewall configured (allow port 3000 or configured port)
- [ ] Cloudflare SSL set to "Full" or "Full (strict)"
- [ ] Server health endpoint accessible: `curl https://prodmon.haielab.org/health`
- [ ] API endpoints accessible with API key
- [ ] Monitoring/logging configured
- [ ] Backup strategy for database
- [ ] API key distributed to team members securely

---

## Next Steps After Server is Running

1. ✅ Verify server health: `curl https://prodmon.haielab.org/health`
2. ✅ Test with script: `node test-server-connection.js https://prodmon.haielab.org API_KEY`
3. ✅ Configure one test client
4. ✅ Verify data syncing (check server database)
5. 📢 Distribute configuration to team members
6. 📊 Monitor server performance and logs

---

## Contact

If you encounter issues:
1. Check server logs: `pm2 logs prodmon-server`
2. Check Cloudflare dashboard for errors
3. Run test script for diagnostics
4. Check this documentation for troubleshooting steps

**Remember**: The API key is sensitive - distribute securely (encrypted, password manager, secure channel).
