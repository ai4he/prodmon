# Configuration Guide

## Storage Modes

Productivity Monkey supports two storage modes:

### 1. Local Storage (Default)

Data stored in local SQLite database on your machine.

**Location:**
- macOS: `~/Library/Application Support/prodmon/prodmon.db`
- Windows: `%APPDATA%\prodmon\prodmon.db`
- Linux: `~/.config/prodmon/prodmon.db`

**Use Cases:**
- Individual users
- Privacy-sensitive environments
- Offline usage
- Personal productivity tracking

**Configuration:**
```json
{
  "userId": "user-123",
  "userName": "John Doe",
  "userEmail": "john@email.com",
  "title": "Engineer",
  "team": "Engineering",
  "department": "Product",
  "managerId": null,
  "trackingInterval": 5000,
  "idleThreshold": 300000
  // No serverUrl = local storage
}
```

### 2. Remote Storage

Data sent to central server via HTTP API.

**Use Cases:**
- Teams/organizations
- Centralized analytics
- Cross-machine reporting
- Multi-user deployments

**Configuration:**
```json
{
  "userId": "user-123",
  "userName": "John Doe",
  "userEmail": "john@company.com",
  "title": "Engineer",
  "team": "Engineering",
  "department": "Product",
  "managerId": "manager-456",
  "trackingInterval": 5000,
  "idleThreshold": 300000,
  "serverUrl": "http://your-server:3000",
  "serverApiKey": "your-api-key-here",
  "storageMode": "remote"
}
```

---

## Configuration File

### Location

**macOS:**
```bash
~/Library/Application Support/com.prodmon.app/config.json
```

**Windows:**
```powershell
%APPDATA%\com.prodmon.app\config.json
```

**Linux:**
```bash
~/.config/com.prodmon.app/config.json
```

### Format

```json
{
  "userId": "unique-user-id",
  "userName": "Display Name",
  "userEmail": "email@company.com",
  "title": "Job Title",
  "team": "Team Name",
  "department": "Department Name",
  "managerId": "manager-user-id-or-null",
  "trackingInterval": 5000,
  "idleThreshold": 300000,
  "serverUrl": "http://server:3000",
  "serverApiKey": "api-key",
  "storageMode": "local-or-remote"
}
```

### Field Descriptions

| Field | Type | Description | Default | Required |
|-------|------|-------------|---------|----------|
| `userId` | string | Unique user identifier | Auto-generated | Yes |
| `userName` | string | User's display name | - | Yes |
| `userEmail` | string | User's email address | - | Yes |
| `title` | string | Job title | - | Yes |
| `team` | string | Team name | - | Yes |
| `department` | string | Department name | - | Yes |
| `managerId` | string/null | Manager's user ID | `null` | No |
| `trackingInterval` | number | Tracking interval (ms) | `5000` | No |
| `idleThreshold` | number | Idle detection time (ms) | `300000` | No |
| `serverUrl` | string | Server URL for remote storage | - | No* |
| `serverApiKey` | string | API key for server auth | - | No* |
| `storageMode` | string | `"local"` or `"remote"` | `"local"` | No |

\* Required if using remote storage

---

## Switching Storage Modes

### From Local to Remote

**Step 1: Ensure server is running**
```bash
# On server machine
npm run server
```

**Step 2: Update configuration**

Edit config file or use Settings UI:

```json
{
  ...existing config...,
  "serverUrl": "http://your-server:3000",
  "serverApiKey": "your-api-key",
  "storageMode": "remote"
}
```

**Step 3: Restart app**
```bash
npm start
```

**Step 4: Verify connection**

Check console for:
```
📡 Using remote storage: http://your-server:3000
✓ Saved 10 activities to storage
```

### From Remote to Local

**Step 1: Update configuration**

Remove server settings:

```json
{
  ...existing config...,
  "serverUrl": null,
  "serverApiKey": null,
  "storageMode": "local"
}
```

Or simply:
```json
{
  ...existing config...
  // Remove serverUrl, serverApiKey, storageMode
}
```

**Step 2: Restart app**
```bash
npm start
```

**Step 3: Verify**

Check console for:
```
💾 Using local storage
```

---

## Environment Variables

You can also configure via environment variables (overrides config file):

```bash
# Server configuration
export PRODMON_SERVER_URL=http://your-server:3000
export PRODMON_API_KEY=your-api-key

# LLM configuration
export GEMINI_API_KEY=AIzaSyBJSX1VOTwdl1Eln4UYlXNDlfeyJviEXJk

# Tracking configuration
export TRACKING_INTERVAL=5000
export IDLE_THRESHOLD=300000

# Start app
npm start
```

---

## Team Setup Example

### Scenario: 5-person Engineering Team

**Step 1: Set up central server**

On dedicated machine (192.168.1.100):

```bash
# Install
git clone <repo>
cd prodmon
npm install
npm run build

# Configure
export PORT=3000
export DB_PATH=/var/lib/prodmon/team.db
export API_KEY=$(openssl rand -hex 32)
export GEMINI_API_KEY=AIzaSyBJSX1VOTwdl1Eln4UYlXNDlfeyJviEXJk

# Start
npm run server

# Note the API key for step 2
echo $API_KEY
```

**Step 2: Configure each team member's client**

Team Member 1 (Alice - Team Lead):
```json
{
  "userId": "alice-001",
  "userName": "Alice Johnson",
  "userEmail": "alice@company.com",
  "title": "Engineering Lead",
  "team": "Engineering",
  "department": "Product",
  "managerId": null,
  "trackingInterval": 5000,
  "idleThreshold": 300000,
  "serverUrl": "http://192.168.1.100:3000",
  "serverApiKey": "<api-key-from-step-1>",
  "storageMode": "remote"
}
```

Team Member 2-5 (Engineers):
```json
{
  "userId": "bob-002",
  "userName": "Bob Smith",
  "userEmail": "bob@company.com",
  "title": "Software Engineer",
  "team": "Engineering",
  "department": "Product",
  "managerId": "alice-001",
  "trackingInterval": 5000,
  "idleThreshold": 300000,
  "serverUrl": "http://192.168.1.100:3000",
  "serverApiKey": "<api-key-from-step-1>",
  "storageMode": "remote"
}
```

**Step 3: Create users on server**

```bash
curl -X POST http://192.168.1.100:3000/api/users \
  -H "X-API-Key: <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@company.com",
    "title": "Engineering Lead",
    "team": "Engineering",
    "department": "Product",
    "managerId": null
  }'
# Returns: {"userId": "alice-001", ...}

# Repeat for each team member...
```

**Step 4: Start tracking on all clients**

Each team member runs:
```bash
npm start
```

**Step 5: View team analytics**

On any client, or via API:

```bash
# Get team metrics
curl -H "X-API-Key: <api-key>" \
  "http://192.168.1.100:3000/api/reports/team/Engineering?weekStart=1699999999&weekEnd=1700000000"
```

---

## Advanced Configuration

### Custom Tracking Intervals

**Default: 5 seconds**

Faster tracking (more data, higher CPU):
```json
{
  "trackingInterval": 1000  // 1 second
}
```

Slower tracking (less data, lower CPU):
```json
{
  "trackingInterval": 10000  // 10 seconds
}
```

### Custom Idle Threshold

**Default: 5 minutes (300000 ms)**

Shorter idle (mark idle faster):
```json
{
  "idleThreshold": 120000  // 2 minutes
}
```

Longer idle (tolerate longer pauses):
```json
{
  "idleThreshold": 600000  // 10 minutes
}
```

### Multiple Teams/Departments

You can track multiple teams on same server:

**Team 1: Engineering**
```json
{
  "team": "Engineering",
  "department": "Product"
}
```

**Team 2: Design**
```json
{
  "team": "Design",
  "department": "Product"
}
```

**Team 3: Sales**
```json
{
  "team": "Sales",
  "department": "Business"
}
```

Server automatically handles multiple teams - team metrics are calculated per team.

---

## Security Best Practices

### 1. Protect API Keys

**DON'T:**
- Commit API keys to Git
- Share API keys in Slack/email
- Use default API key in production

**DO:**
- Generate unique, random API keys
- Store in environment variables or secure config
- Rotate keys periodically

### 2. Use HTTPS for Remote Servers

**Production remote storage MUST use HTTPS:**

```json
{
  "serverUrl": "https://prodmon.company.com"
}
```

### 3. Restrict Network Access

Use firewall rules to limit who can access server:

```bash
# Only allow office network
sudo ufw allow from 192.168.1.0/24 to any port 3000

# Or use VPN
# Only allow VPN subnet
sudo ufw allow from 10.8.0.0/24 to any port 3000
```

### 4. Database Encryption

For sensitive environments, encrypt SQLite database:

```bash
# Use SQLCipher (commercial)
# Or encrypt filesystem/disk
```

---

## Troubleshooting

### Issue: Config Not Loading

**Symptoms:** App uses default config instead of yours

**Solutions:**
1. Check config file location (see "Location" above)
2. Verify JSON syntax (use JSONLint)
3. Check file permissions
4. Look for errors in console logs

### Issue: Can't Connect to Server

**Symptoms:** "Failed to connect" errors

**Solutions:**
1. Verify `serverUrl` is correct
2. Check server is running: `curl http://server:3000/health`
3. Check firewall/network access
4. Verify API key matches server

### Issue: Dual Storage?

**Question:** Can I use both local and remote storage?

**Answer:** No - it's either/or. However:
- Local storage is always written to as a cache
- Remote storage is primary when configured
- If remote fails, data is buffered locally and retried

### Issue: Migrate Historical Data

**Question:** How do I move local data to remote server?

**Answer:**
```bash
# Copy local database to server
scp ~/Library/Application\ Support/prodmon/prodmon.db \
    user@server:/var/lib/prodmon/prodmon-server.db

# Then configure clients to use server
```

---

## Configuration Examples

### Example 1: Solo Developer (Local)

```json
{
  "userId": "dev-001",
  "userName": "Jane Developer",
  "userEmail": "jane@freelance.com",
  "title": "Freelancer",
  "team": "Personal",
  "department": "Personal",
  "managerId": null,
  "trackingInterval": 5000,
  "idleThreshold": 300000
}
```

### Example 2: Team Member (Remote)

```json
{
  "userId": "emp-12345",
  "userName": "John Engineer",
  "userEmail": "john@bigcorp.com",
  "title": "Senior Engineer",
  "team": "Platform",
  "department": "Engineering",
  "managerId": "mgr-999",
  "trackingInterval": 5000,
  "idleThreshold": 300000,
  "serverUrl": "https://prodmon.bigcorp.internal",
  "serverApiKey": "prod-key-abc123xyz789",
  "storageMode": "remote"
}
```

### Example 3: Manager (Remote + Team View)

```json
{
  "userId": "mgr-999",
  "userName": "Sarah Manager",
  "userEmail": "sarah@bigcorp.com",
  "title": "Engineering Manager",
  "team": "Platform",
  "department": "Engineering",
  "managerId": null,
  "trackingInterval": 5000,
  "idleThreshold": 300000,
  "serverUrl": "https://prodmon.bigcorp.internal",
  "serverApiKey": "prod-key-abc123xyz789",
  "storageMode": "remote"
}
```

---

## FAQ

**Q: What happens if server goes down?**

A: Client buffers activities locally and retries. You won't lose data.

**Q: Can I switch storage modes without data loss?**

A: Yes, but local and remote databases are separate. Copy database file to migrate.

**Q: How do I know which mode I'm using?**

A: Check console on startup:
- `💾 Using local storage`
- `📡 Using remote storage: http://...`

**Q: Can I use different servers for different teams?**

A: Each client can only connect to one server, but you can run multiple servers for different teams.

**Q: Is there a GUI for configuration?**

A: Currently manual config file editing. Settings UI coming in future release.

---

## Summary

### Local Storage
- **When:** Individual use, privacy, offline
- **Config:** Remove `serverUrl`
- **Location:** `~/Library/Application Support/prodmon/`

### Remote Storage
- **When:** Teams, central analytics, collaboration
- **Config:** Set `serverUrl` and `serverApiKey`
- **Requires:** Server setup (see SERVER_DEPLOYMENT.md)

### Hybrid Approach
- Local cache + remote sync (automatic)
- Best of both worlds
- Resilient to network issues

---

🐒 **Configure once, track forever!**
