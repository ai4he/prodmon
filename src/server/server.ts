import express, { Request, Response } from 'express';
import cors from 'cors';
import { join } from 'path';
import { DatabaseManager } from '../database/schema';
import { MetricsCalculator } from '../analytics/metrics';
import { ReportGenerator } from '../analytics/reports';
import { GeminiService } from '../llm/gemini-service';
import { ActivityRecord, User, Config } from '../types';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './prodmon-server.db';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: Function) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} from ${ip}`);

  // Log request body for POST/PUT requests (first 200 chars)
  if ((method === 'POST' || method === 'PUT') && req.body) {
    const bodyStr = JSON.stringify(req.body).substring(0, 200);
    console.log(`  Body: ${bodyStr}${bodyStr.length >= 200 ? '...' : ''}`);
  }

  // Log response
  const originalSend = res.send;
  res.send = function (data: any) {
    console.log(`  Response: ${res.statusCode}`);
    return originalSend.call(this, data);
  };

  next();
});

// Initialize services
let db: DatabaseManager;
let metricsCalc: MetricsCalculator;
let reportGen: ReportGenerator;
let llmService: GeminiService | null = null;

async function initializeServices() {
  try {
    db = new DatabaseManager(DB_PATH);
    await db.initialize();
    console.log('✓ Database initialized at:', DB_PATH);

    metricsCalc = new MetricsCalculator(db);

    if (GEMINI_API_KEY) {
      llmService = new GeminiService(GEMINI_API_KEY);
      console.log('✓ LLM service initialized');
    }

    reportGen = new ReportGenerator(db, llmService || undefined);
    console.log('✓ Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Serve static files (web dashboard)
app.use(express.static(join(__dirname, 'public')));

// Root route - serve dashboard
app.get('/', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, 'public', 'dashboard.html'));
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    llm: llmService ? 'enabled' : 'disabled'
  });
});

// ============================================================================
// USER ENDPOINTS
// ============================================================================

// Create user
app.post('/api/users', (req: Request, res: Response) => {
  try {
    const { name, email, title, team, department, managerId } = req.body;

    if (!name || !email || !title || !team || !department) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userId = uuidv4();
    const createdAt = Date.now();

    const database = db.getDb();
    const stmt = database.prepare(
      `INSERT INTO users (id, name, email, title, team, department, manager_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    stmt.run([userId, name, email, title, team, department, managerId || null, createdAt]);
    stmt.free();
    db.save();

    res.status(201).json({
      userId,
      message: 'User created successfully'
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
app.get('/api/users/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const database = db.getDb();

    const stmt = database.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([userId]);

    let user: any = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      title: user.title,
      team: user.team,
      department: user.department,
      managerId: user.manager_id,
      createdAt: user.created_at
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users
app.get('/api/users', (req: Request, res: Response) => {
  try {
    const database = db.getDb();
    const stmt = database.prepare('SELECT * FROM users ORDER BY name');

    const users: any[] = [];
    while (stmt.step()) {
      const user = stmt.getAsObject();
      users.push({
        id: user.id,
        name: user.name,
        email: user.email,
        title: user.title,
        team: user.team,
        department: user.department,
        managerId: user.manager_id,
        createdAt: user.created_at
      });
    }
    stmt.free();

    res.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ACTIVITY ENDPOINTS
// ============================================================================

// Record activity (single)
app.post('/api/activity', (req: Request, res: Response) => {
  try {
    const activity: ActivityRecord = req.body;

    if (!activity.userId || !activity.appName || !activity.category) {
      return res.status(400).json({ error: 'Missing required activity fields' });
    }

    const database = db.getDb();
    const stmt = database.prepare(
      `INSERT INTO activity_records
       (id, user_id, timestamp, app_name, window_title, url, category, keystrokes_count, mouse_movements, is_idle, media_playing, media_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const id = activity.id || uuidv4();
    const timestamp = activity.timestamp || Date.now();

    stmt.run([
      id,
      activity.userId,
      timestamp,
      activity.appName,
      activity.windowTitle || '',
      activity.url || null,
      activity.category,
      activity.keystrokesCount || 0,
      activity.mouseMovements || 0,
      activity.isIdle ? 1 : 0,
      activity.mediaPlaying ? 1 : 0,
      activity.mediaSource || null
    ]);
    stmt.free();
    db.save();

    res.status(201).json({
      activityId: id,
      message: 'Activity recorded successfully'
    });
  } catch (error: any) {
    console.error('Error recording activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record activity batch
app.post('/api/activity/batch', (req: Request, res: Response) => {
  try {
    const { activities } = req.body;

    if (!Array.isArray(activities)) {
      return res.status(400).json({ error: 'Activities must be an array' });
    }

    const database = db.getDb();
    const stmt = database.prepare(
      `INSERT INTO activity_records
       (id, user_id, timestamp, app_name, window_title, url, category, keystrokes_count, mouse_movements, is_idle, media_playing, media_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    let inserted = 0;
    for (const activity of activities) {
      if (!activity.userId || !activity.appName || !activity.category) {
        continue; // Skip invalid records
      }

      const id = activity.id || uuidv4();
      const timestamp = activity.timestamp || Date.now();

      stmt.run([
        id,
        activity.userId,
        timestamp,
        activity.appName,
        activity.windowTitle || '',
        activity.url || null,
        activity.category,
        activity.keystrokesCount || 0,
        activity.mouseMovements || 0,
        activity.isIdle ? 1 : 0,
        activity.mediaPlaying ? 1 : 0,
        activity.mediaSource || null
      ]);
      inserted++;
    }

    stmt.free();
    db.save();

    res.status(201).json({
      inserted,
      message: `${inserted} activities recorded successfully`
    });
  } catch (error: any) {
    console.error('Error recording activities batch:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get activity records
app.get('/api/activity/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { start, end, limit = 1000 } = req.query;

    const database = db.getDb();
    let query = 'SELECT * FROM activity_records WHERE user_id = ?';
    const params: any[] = [userId];

    if (start) {
      query += ' AND timestamp >= ?';
      params.push(Number(start));
    }

    if (end) {
      query += ' AND timestamp <= ?';
      params.push(Number(end));
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(Number(limit));

    const stmt = database.prepare(query);
    stmt.bind(params);

    const activities: any[] = [];
    while (stmt.step()) {
      const record = stmt.getAsObject();
      activities.push({
        id: record.id,
        userId: record.user_id,
        timestamp: record.timestamp,
        appName: record.app_name,
        windowTitle: record.window_title,
        url: record.url,
        category: record.category,
        keystrokesCount: record.keystrokes_count,
        mouseMovements: record.mouse_movements,
        isIdle: record.is_idle === 1,
        mediaPlaying: record.media_playing === 1,
        mediaSource: record.media_source
      });
    }
    stmt.free();

    res.json({ activities });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// METRICS ENDPOINTS
// ============================================================================

// Get weekly metrics
app.get('/api/metrics/weekly/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { weekStart, weekEnd } = req.query;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart and weekEnd are required' });
    }

    const metrics = metricsCalc.calculateWeeklyMetrics(
      userId,
      Number(weekStart),
      Number(weekEnd)
    );

    res.json(metrics);
  } catch (error: any) {
    console.error('Error calculating metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get app usage
app.get('/api/metrics/app-usage/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { weekStart, weekEnd } = req.query;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart and weekEnd are required' });
    }

    const appUsage = metricsCalc.calculateAppUsage(
      userId,
      Number(weekStart),
      Number(weekEnd)
    );

    res.json({ appUsage });
  } catch (error: any) {
    console.error('Error calculating app usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get browser activity
app.get('/api/metrics/browser-activity/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { weekStart, weekEnd } = req.query;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart and weekEnd are required' });
    }

    const browserActivity = metricsCalc.getBrowserActivity(
      userId,
      Number(weekStart),
      Number(weekEnd)
    );

    res.json({ browserActivity });
  } catch (error: any) {
    console.error('Error fetching browser activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REPORT ENDPOINTS
// ============================================================================

// Generate weekly report
app.get('/api/reports/weekly/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { weekStart, weekEnd } = req.query;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart and weekEnd are required' });
    }

    const report = await reportGen.generateWeeklyReport(
      userId,
      Number(weekStart),
      Number(weekEnd)
    );

    res.json(report);
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get team metrics
app.get('/api/reports/team/:teamName', (req: Request, res: Response) => {
  try {
    const { teamName } = req.params;
    const { weekStart, weekEnd } = req.query;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart and weekEnd are required' });
    }

    // Get all users in team
    const database = db.getDb();
    const stmt = database.prepare('SELECT id, name FROM users WHERE team = ?');
    stmt.bind([teamName]);

    const teamMembers: any[] = [];
    while (stmt.step()) {
      const user = stmt.getAsObject();
      const metrics = metricsCalc.calculateWeeklyMetrics(
        user.id as string,
        Number(weekStart),
        Number(weekEnd)
      );

      teamMembers.push({
        userId: user.id,
        name: user.name,
        focusScore: metrics.focusScore,
        deepWorkHours: metrics.deepWorkHours
      });
    }
    stmt.free();

    const avgFocusScore = teamMembers.reduce((sum, m) => sum + m.focusScore, 0) / teamMembers.length;
    const totalDeepWork = teamMembers.reduce((sum, m) => sum + m.deepWorkHours, 0);

    res.json({
      teamName,
      averageFocusScore: avgFocusScore || 0,
      totalDeepWorkHours: totalDeepWork || 0,
      members: teamMembers
    });
  } catch (error: any) {
    console.error('Error fetching team metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LLM ENDPOINTS
// ============================================================================

// Get LLM status
app.get('/api/llm/status', (req: Request, res: Response) => {
  try {
    if (!llmService) {
      return res.json({
        enabled: false,
        message: 'LLM service not initialized'
      });
    }

    const quota = llmService.getQuotaStatus();
    res.json({
      enabled: true,
      quota: {
        used: quota.used,
        limit: quota.limit,
        remaining: quota.limit - quota.used,
        failureCount: quota.failureCount
      },
      available: quota.available
    });
  } catch (error: any) {
    console.error('Error fetching LLM status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

initializeServices().then(() => {
  app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('  🐒 Productivity Monkey Server');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Port: ${PORT}`);
    console.log(`  Database: ${DB_PATH}`);
    console.log(`  LLM: ${llmService ? 'Enabled' : 'Disabled'}`);
    console.log(`  Auth: Disabled (open access for debugging)`);
    console.log(`  Request Logging: Enabled`);
    console.log('═══════════════════════════════════════════════════');
    console.log('  Endpoints:');
    console.log('    GET  /health');
    console.log('    POST /api/users');
    console.log('    GET  /api/users');
    console.log('    GET  /api/users/:userId');
    console.log('    POST /api/activity');
    console.log('    POST /api/activity/batch');
    console.log('    GET  /api/activity/:userId');
    console.log('    GET  /api/metrics/weekly/:userId');
    console.log('    GET  /api/metrics/app-usage/:userId');
    console.log('    GET  /api/metrics/browser-activity/:userId');
    console.log('    GET  /api/reports/weekly/:userId');
    console.log('    GET  /api/reports/team/:teamName');
    console.log('    GET  /api/llm/status');
    console.log('═══════════════════════════════════════════════════');
  });
});

export default app;
