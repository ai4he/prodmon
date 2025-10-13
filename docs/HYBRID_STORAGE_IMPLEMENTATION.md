# Hybrid Storage Implementation

## Overview

Implemented a **dual-storage hybrid system** that:
- ✅ **ALWAYS saves locally** - All data stored in local SQLite database
- ✅ **Auto-syncs to server** - Background sync every 30 seconds
- ✅ **Offline support** - Queues activities when server is offline
- ✅ **Automatic reconnection** - Syncs queued data when connection restored
- ✅ **No authentication** - Open access for easy debugging
- ✅ **Request logging** - All server requests logged to console
- ✅ **Web dashboard** - View all users' data in browser

---

## Architecture

### Previous Implementation
```
Config with serverUrl? → Remote storage
Config without serverUrl? → Local storage
```

**Problem**: You had to choose one or the other.

### New Hybrid Implementation
```
Always Local Storage (primary)
    ↓
    ├─→ Save to local SQLite (instant)
    │
    └─→ Queue for sync to server (background)
            ↓
        Sync every 30 seconds
            ↓
        Server saves to its own SQLite
```

**Benefits**:
- Data never lost (always in local database)
- Works offline seamlessly
- Server gets all data eventually
- No user intervention needed

---

## How It Works

### 1. Activity Recording

```typescript
// User does something (keystroke, mouse click, etc.)
activity = {
  appName: "VS Code",
  category: "deep",
  timestamp: 1234567890
}

// STEP 1: Save to local database (instant)
await localClient.recordActivity(activity);
console.log("✓ Saved locally");

// STEP 2: Add to sync queue
syncQueue.push(activity);

// STEP 3: Sync when queue reaches 50 items or every 30 seconds
if (syncQueue.length >= 50) {
  await syncToServer();
}
```

### 2. Automatic Sync Loop

```typescript
// Runs every 30 seconds
setInterval(async () => {
  // Check if server is online
  const online = await serverHealthCheck();

  if (online) {
    // Sync queued activities
    const batch = syncQueue.splice(0, 50); // Get first 50
    await server.recordActivitiesBatch(batch);
    console.log(`✓ Synced ${batch.length} activities`);
  } else {
    console.log(`⚠ Server offline - ${syncQueue.length} queued`);
  }
}, 30000);
```

### 3. Offline Handling

```
User Activity → Save Local ✓
                      ↓
                 Add to Queue
                      ↓
             Try Sync to Server
                      ↓
         Server Offline? → Stay in Queue
                      ↓
            Next Sync Attempt (30s later)
                      ↓
         Server Online? → Sync Now ✓
```

---

## Server Features

### 1. Request Logging

Every request is logged:

```
[2025-10-09T17:05:40.000Z] POST /api/activity/batch from ::ffff:127.0.0.1
  Body: {"activities":[{"id":"abc123","userId":"user-001","appName":"Chrome",...
  Response: 201
```

**What's Logged:**
- Timestamp
- HTTP method (GET, POST, etc.)
- URL path
- Client IP address
- Request body (first 200 characters)
- Response status code

### 2. No Authentication

All endpoints are open:
- No API keys required
- No headers needed
- Easy debugging
- Fast iteration

**Before:**
```bash
curl -H "X-API-Key: your-secret-api-key" http://localhost:3000/api/users
```

**Now:**
```bash
curl http://localhost:3000/api/users
```

### 3. Web Dashboard

Access at: **http://localhost:3000**

**Features:**
- 📊 View all users in dropdown
- 📈 Real-time metrics (total hours, deep work, focus score)
- 🧰 Top applications used
- 🌐 Browser activity with visit counts
- 🔄 Refresh button for latest data
- 👥 Switch between users instantly

**Screenshots of Data:**
- Total Hours this week
- Deep Work hours
- Focus Score (0-100)
- Active Hours
- Top 10 Applications
- Top 15 Websites

---

## Files Created/Modified

### New Files

1. **src/storage/hybrid-storage-client.ts** (300+ lines)
   - Dual storage implementation
   - Automatic sync mechanism
   - Offline queue management
   - Connection monitoring

2. **src/server/public/dashboard.html** (450+ lines)
   - Web dashboard UI
   - User switching
   - Real-time data display
   - Responsive design

### Modified Files

1. **src/storage/storage-client.ts**
   - Updated factory to always use hybrid storage
   - Removed API key from requests

2. **src/server/server.ts**
   - Removed authentication middleware
   - Added request logging middleware
   - Added static file serving
   - Updated startup message

3. **src/main.ts**
   - Creates visible tray icon

---

## Configuration

### Client Configuration

**With Server (Recommended):**
```json
{
  "userId": "user-001",
  "userName": "John Doe",
  "userEmail": "john@company.com",
  "team": "Engineering",
  "serverUrl": "http://localhost:3000",
  "trackingInterval": 5000
}
```

**Without Server (Still Works!):**
```json
{
  "userId": "user-001",
  "userName": "John Doe",
  "userEmail": "john@company.com",
  "team": "Engineering",
  "trackingInterval": 5000
}
```

Both configurations work. The difference:
- **With serverUrl**: Syncs to server in background
- **Without serverUrl**: Local only (no sync)

---

## Usage

### Start Server

```bash
npm run server
```

**You'll see:**
```
═══════════════════════════════════════════════════
  🐒 Productivity Monkey Server
═══════════════════════════════════════════════════
  Port: 3000
  Database: ./prodmon-server.db
  LLM: Disabled
  Auth: Disabled (open access for debugging)
  Request Logging: Enabled
═══════════════════════════════════════════════════
```

### Start Client

```bash
npm start
```

**Console Output:**
```
💾 Hybrid storage: Local + Remote (http://localhost:3000)
✓ Sync loop started (every 30 seconds)
```

**After some activity:**
```
✓ Synced 10 activities to server (0 remaining)
```

**If server goes offline:**
```
⚠ Server offline - 45 activities queued for sync
```

**When server comes back:**
```
✓ Connection restored - starting sync
✓ Synced 45 activities to server (0 remaining)
```

### View Web Dashboard

Open browser to: **http://localhost:3000**

1. Select user from dropdown
2. View their metrics
3. See top apps and websites
4. Switch users to compare
5. Click "Refresh" for latest data

---

## Testing The System

### Test 1: Normal Operation

```bash
# Terminal 1: Start server
npm run server

# Terminal 2: Start client
npm start

# Terminal 3: Watch server logs
# (they appear in Terminal 1)

# Use your computer normally
# Check server logs for incoming requests
```

**Expected Logs:**
```
[2025-10-09T17:10:00.000Z] POST /api/activity/batch from ::ffff:127.0.0.1
  Body: {"activities":[{"id":"...","appName":"Chrome",...]}
  Response: 201
```

### Test 2: Offline Mode

```bash
# Terminal 1: Start client
npm start

# Terminal 2: Kill server
killall -9 node

# Use computer for 2-3 minutes

# Client console shows:
⚠ Server offline - 23 activities queued for sync

# Restart server
npm run server

# Client console shows:
✓ Connection restored - starting sync
✓ Synced 23 activities to server (0 remaining)
```

### Test 3: Web Dashboard

```bash
# Start server
npm run server

# Open browser
open http://localhost:3000

# Should see:
# - User dropdown
# - Metrics cards
# - App list
# - Browser activity

# Select different users from dropdown
# Click "Refresh" button
```

---

## Data Flow

### Complete Flow Diagram

```
User Activity (Keystroke, Click, etc.)
        ↓
   ActivityTracker.captureActivity()
        ↓
   HybridStorageClient.recordActivity()
        ↓
   ┌────┴────┐
   │         │
   ↓         ↓
Local DB   Sync Queue
(instant) (background)
   ↓         ↓
SQLite    Every 30s
 File      ↓
           syncToServer()
           ↓
       POST /api/activity/batch
           ↓
       Server Database
           ↓
       Server SQLite File
           ↓
       Web Dashboard
       (http://localhost:3000)
```

---

## Sync Queue Management

### Queue Behavior

```typescript
// Activities accumulate in queue
syncQueue = [activity1, activity2, ..., activity50]

// Every 30 seconds OR when queue reaches 50
if (syncQueue.length >= 50 || timeElapsed >= 30000) {
  // Sync in batches of 50
  batch = syncQueue.splice(0, 50);

  try {
    await server.post('/api/activity/batch', { activities: batch });
    console.log(`✓ Synced ${batch.length} activities`);
  } catch (error) {
    // Put back in queue if failed
    syncQueue.unshift(...batch);
    console.error('Sync failed, will retry');
  }
}
```

### Queue Status

Get sync status programmatically:

```typescript
const status = storageClient.getSyncStatus();

console.log(status);
// {
//   isOnline: true,
//   queuedActivities: 12,
//   remoteConfigured: true
// }
```

---

## Server API (No Auth Required!)

All endpoints work without authentication:

### Users
```bash
# Get all users
curl http://localhost:3000/api/users

# Get specific user
curl http://localhost:3000/api/users/user-001
```

### Activities
```bash
# Record activity
curl -X POST http://localhost:3000/api/activity \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-001","appName":"Chrome","category":"deep"}'

# Get user activities
curl "http://localhost:3000/api/activity/user-001?start=0&end=9999999999999"
```

### Metrics
```bash
# Weekly metrics
curl "http://localhost:3000/api/metrics/weekly/user-001?weekStart=1699999999&weekEnd=1700000000"

# App usage
curl "http://localhost:3000/api/metrics/app-usage/user-001?weekStart=1699999999&weekEnd=1700000000"

# Browser activity
curl "http://localhost:3000/api/metrics/browser-activity/user-001?weekStart=1699999999&weekEnd=1700000000"
```

---

## Benefits Achieved

### For You (Developer)

✅ **Easy Debugging**
- See all requests in real-time
- No authentication complexity
- Inspect server database directly

✅ **No Data Loss**
- Everything saved locally first
- Offline mode automatic
- Sync queue preserves data

✅ **Flexible Testing**
- Test with/without server
- Simulate offline scenarios
- Multiple clients to one server

### For Users

✅ **Transparent Operation**
- Works offline seamlessly
- No configuration needed
- Automatic reconnection

✅ **Always Accessible**
- Local data always available
- Dashboard shows history
- No waiting for sync

### For Teams

✅ **Centralized Analytics**
- All team data in one place
- Web dashboard for managers
- Compare users easily

✅ **Scalable**
- Add users anytime
- Server handles multiple clients
- No manual data collection

---

## Troubleshooting

### Issue: Client Not Syncing

**Symptoms:** Console shows "Server offline" but server is running

**Solution:**
1. Check `serverUrl` in config matches server address
2. Verify server is running (`curl http://localhost:3000/health`)
3. Check firewall isn't blocking connections

### Issue: Web Dashboard Empty

**Symptoms:** Dashboard shows "0h" for all metrics

**Solution:**
1. Check server database has data: `sqlite3 prodmon-server.db "SELECT COUNT(*) FROM activity_records"`
2. Verify user exists: `curl http://localhost:3000/api/users`
3. Check date range (dashboard shows current week only)

### Issue: Too Many Queued Activities

**Symptoms:** Console shows "1000 activities queued"

**Solution:**
1. Force sync: `storageClient.forceSync()`
2. Or just wait - they'll sync when server comes online
3. Increase sync frequency if needed

---

## Configuration Options

### Sync Interval

Change sync frequency:

```typescript
// In hybrid-storage-client.ts
private readonly SYNC_INTERVAL = 30000; // 30 seconds (default)

// For faster sync:
private readonly SYNC_INTERVAL = 10000; // 10 seconds

// For slower sync (save bandwidth):
private readonly SYNC_INTERVAL = 60000; // 1 minute
```

### Batch Size

Change how many activities sync at once:

```typescript
// In hybrid-storage-client.ts
private readonly BATCH_SIZE = 50; // 50 activities (default)

// For larger batches:
private readonly BATCH_SIZE = 100; // 100 activities

// For smaller batches:
private readonly BATCH_SIZE = 25; // 25 activities
```

---

## Summary

### What Changed

**Before:**
- Choose local OR remote storage
- No offline support
- Authentication required
- No visibility into syncing

**After:**
- Always local + optional remote
- Automatic offline support
- No authentication (debugging mode)
- Real-time sync logging
- Web dashboard for all users
- Request logging on server

### Quick Commands

```bash
# Start server (with logging)
npm run server

# Start client (with sync)
npm start

# View dashboard
open http://localhost:3000

# Check server database
sqlite3 prodmon-server.db "SELECT COUNT(*) FROM activity_records"

# Check local database
sqlite3 ~/Library/Application\ Support/prodmon/prodmon.db "SELECT COUNT(*) FROM activity_records"
```

### Key Features

1. ✅ **Hybrid Storage** - Local + remote always
2. ✅ **Auto Sync** - Background sync every 30s
3. ✅ **Offline Support** - Queue when offline, sync when back
4. ✅ **Request Logging** - See all server activity
5. ✅ **No Auth** - Easy debugging
6. ✅ **Web Dashboard** - View all users in browser
7. ✅ **Visible Icon** - Menu bar icon works

---

## Next Steps

1. **Run server:** `npm run server`
2. **Run client:** `npm start` (with serverUrl in config)
3. **Open dashboard:** http://localhost:3000
4. **Use computer normally** - data syncs automatically
5. **Watch server logs** - see requests in real-time
6. **Switch users in dashboard** - compare team members

🐒 **All data is always safe - stored locally and synced to server!**
