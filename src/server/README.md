# Productivity Monkey Server

REST API server for centralized productivity data storage and analytics.

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server
npm run server
```

Server runs on `http://localhost:3000` by default.

## Configuration

### Environment Variables

```bash
PORT=3000                                           # Server port
DB_PATH=/var/lib/prodmon/prodmon.db                # Database file location
API_KEY=your-secret-api-key                        # Authentication key
GEMINI_API_KEY=AIzaSyBJSX1VOTwdl1Eln4UYlXNDlfeyJviEXJk  # Optional: LLM integration
```

### Example .env File

```bash
PORT=3000
DB_PATH=./prodmon-server.db
API_KEY=super-secure-random-key-here
GEMINI_API_KEY=AIzaSyBJSX1VOTwdl1Eln4UYlXNDlfeyJviEXJk
```

## API Endpoints

### Authentication

All endpoints require `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/health
```

### Available Endpoints

- `GET /health` - Health check
- `POST /api/users` - Create user
- `GET /api/users` - Get all users
- `GET /api/users/:userId` - Get specific user
- `POST /api/activity` - Record activity
- `POST /api/activity/batch` - Record activities (batch)
- `GET /api/activity/:userId` - Get user activities
- `GET /api/metrics/weekly/:userId` - Get weekly metrics
- `GET /api/metrics/app-usage/:userId` - Get app usage
- `GET /api/metrics/browser-activity/:userId` - Get browser activity
- `GET /api/reports/weekly/:userId` - Generate weekly report
- `GET /api/reports/team/:teamName` - Get team metrics
- `GET /api/llm/status` - Get LLM quota status

## Development

### Start in Development Mode

```bash
npm run server:dev
```

Auto-reloads on code changes using nodemon.

### Testing

```bash
# Health check
curl -H "X-API-Key: your-api-key" http://localhost:3000/health

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","title":"Engineer","team":"Engineering","department":"Product"}'

# Get users
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/users
```

## Production Deployment

See [SERVER_DEPLOYMENT.md](../SERVER_DEPLOYMENT.md) for:
- Systemd service setup
- PM2 process management
- Docker deployment
- Nginx reverse proxy
- SSL/TLS configuration
- Monitoring and logging

## Security

**IMPORTANT:**

1. ✅ Change default API key in production
2. ✅ Use HTTPS for remote access
3. ✅ Restrict network access with firewall
4. ✅ Set proper database file permissions
5. ✅ Keep dependencies updated

## Architecture

```
┌─────────────────────────────────────────┐
│           Express REST API              │
├─────────────────────────────────────────┤
│  Authentication (API Key)               │
│  Request Validation                     │
│  Error Handling                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      Business Logic Layer               │
├─────────────────────────────────────────┤
│  DatabaseManager                        │
│  MetricsCalculator                      │
│  ReportGenerator                        │
│  GeminiService (optional)               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│       SQLite Database                   │
│  (sql.js - runs in Node.js)             │
└─────────────────────────────────────────┘
```

## Database Schema

Shares same schema as client:

- `users` - User information
- `activity_records` - Activity tracking data
- `productivity_metrics` - Weekly aggregated metrics
- `app_usage` - Application usage tracking

Indexes optimized for:
- User lookups
- Time-range queries
- Category filtering
- Team aggregation

## Performance

### Expected Load

- **Single user:** ~10-20 requests/min
- **10 users:** ~100-200 requests/min
- **100 users:** ~1,000-2,000 requests/min

### Optimization

- Batch endpoints reduce HTTP overhead
- Database indexes for fast queries
- LLM quota management prevents overuse
- CORS enabled for browser clients

## Monitoring

### Logs

```bash
# View server logs
npm run server 2>&1 | tee server.log

# Or with PM2
pm2 logs prodmon-server

# Or with systemd
sudo journalctl -u prodmon-server -f
```

### Metrics to Monitor

- Request rate
- Response time
- Error rate
- Database size
- LLM quota usage
- Active users

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run server
```

### Database Locked

```bash
# Check if multiple server instances running
ps aux | grep server.js

# Ensure proper permissions
chmod 600 /path/to/prodmon.db
```

### API Key Issues

```bash
# Verify API key is set
echo $API_KEY

# Test with curl
curl -H "X-API-Key: $API_KEY" http://localhost:3000/health
```

## Support

For detailed documentation:
- [Server Deployment Guide](../SERVER_DEPLOYMENT.md)
- [Configuration Guide](../CONFIGURATION_GUIDE.md)
- [LLM Intelligence](../LLM_INTELLIGENCE.md)

---

🐒 **Productivity Monkey Server - Team Productivity, Centralized**
