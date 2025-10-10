import { ActivityRecord, User, ProductivityMetrics, AppUsage, WeeklyReport } from '../types';
import { DatabaseManager } from '../database/schema';
import { MetricsCalculator } from '../analytics/metrics';
import { ReportGenerator } from '../analytics/reports';
import { GeminiService } from '../llm/gemini-service';

/**
 * Storage interface - can be implemented by local or remote storage
 */
export interface IStorageClient {
  // User operations
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<string>;
  getUser(userId: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;

  // Activity operations
  recordActivity(activity: ActivityRecord): Promise<void>;
  recordActivitiesBatch(activities: ActivityRecord[]): Promise<void>;
  getActivities(userId: string, start?: number, end?: number, limit?: number): Promise<ActivityRecord[]>;

  // Metrics operations
  getWeeklyMetrics(userId: string, weekStart: number, weekEnd: number): Promise<ProductivityMetrics>;
  getAppUsage(userId: string, weekStart: number, weekEnd: number): Promise<AppUsage[]>;
  getBrowserActivity(userId: string, weekStart: number, weekEnd: number): Promise<any[]>;

  // Report operations
  generateWeeklyReport(userId: string, weekStart: number, weekEnd: number): Promise<WeeklyReport>;
  getTeamMetrics(teamName: string, weekStart: number, weekEnd: number): Promise<any>;

  // Health check
  healthCheck(): Promise<boolean>;
}

/**
 * Local storage client - uses SQLite database
 */
export class LocalStorageClient implements IStorageClient {
  private db: DatabaseManager;
  private metricsCalc: MetricsCalculator;
  private reportGen: ReportGenerator;

  constructor(db: DatabaseManager, llmService?: GeminiService) {
    this.db = db;
    this.metricsCalc = new MetricsCalculator(db);
    this.reportGen = new ReportGenerator(db, llmService);
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<string> {
    const { v4: uuidv4 } = await import('uuid');
    const userId = uuidv4();
    const createdAt = Date.now();

    const database = this.db.getDb();
    const stmt = database.prepare(
      `INSERT INTO users (id, name, email, title, team, department, manager_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    stmt.run([
      userId,
      user.name,
      user.email,
      user.title,
      user.team,
      user.department,
      user.managerId || null,
      createdAt
    ]);
    stmt.free();
    this.db.save();

    return userId;
  }

  async getUser(userId: string): Promise<User | null> {
    const database = this.db.getDb();
    const stmt = database.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([userId]);

    let user: any = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) return null;

    return {
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      title: user.title as string,
      team: user.team as string,
      department: user.department as string,
      managerId: user.manager_id as string | null,
      createdAt: user.created_at as number
    };
  }

  async getAllUsers(): Promise<User[]> {
    const database = this.db.getDb();
    const stmt = database.prepare('SELECT * FROM users ORDER BY name');

    const users: User[] = [];
    while (stmt.step()) {
      const user = stmt.getAsObject();
      users.push({
        id: user.id as string,
        name: user.name as string,
        email: user.email as string,
        title: user.title as string,
        team: user.team as string,
        department: user.department as string,
        managerId: user.manager_id as string | null,
        createdAt: user.created_at as number
      });
    }
    stmt.free();

    return users;
  }

  async recordActivity(activity: ActivityRecord): Promise<void> {
    const { v4: uuidv4 } = await import('uuid');
    const database = this.db.getDb();

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
    this.db.save();
  }

  async recordActivitiesBatch(activities: ActivityRecord[]): Promise<void> {
    const { v4: uuidv4 } = await import('uuid');
    const database = this.db.getDb();

    const stmt = database.prepare(
      `INSERT INTO activity_records
       (id, user_id, timestamp, app_name, window_title, url, category, keystrokes_count, mouse_movements, is_idle, media_playing, media_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const activity of activities) {
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
    }

    stmt.free();
    this.db.save();
  }

  async getActivities(userId: string, start?: number, end?: number, limit: number = 1000): Promise<ActivityRecord[]> {
    const database = this.db.getDb();
    let query = 'SELECT * FROM activity_records WHERE user_id = ?';
    const params: any[] = [userId];

    if (start) {
      query += ' AND timestamp >= ?';
      params.push(start);
    }

    if (end) {
      query += ' AND timestamp <= ?';
      params.push(end);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const stmt = database.prepare(query);
    stmt.bind(params);

    const activities: ActivityRecord[] = [];
    while (stmt.step()) {
      const record = stmt.getAsObject();
      activities.push({
        id: record.id as string,
        userId: record.user_id as string,
        timestamp: record.timestamp as number,
        appName: record.app_name as string,
        windowTitle: record.window_title as string,
        url: record.url as string | undefined,
        category: record.category as any,
        keystrokesCount: record.keystrokes_count as number,
        mouseMovements: record.mouse_movements as number,
        isIdle: record.is_idle === 1,
        mediaPlaying: record.media_playing === 1,
        mediaSource: record.media_source as string | undefined
      });
    }
    stmt.free();

    return activities;
  }

  async getWeeklyMetrics(userId: string, weekStart: number, weekEnd: number): Promise<ProductivityMetrics> {
    return this.metricsCalc.calculateWeeklyMetrics(userId, weekStart, weekEnd);
  }

  async getAppUsage(userId: string, weekStart: number, weekEnd: number): Promise<AppUsage[]> {
    return this.metricsCalc.calculateAppUsage(userId, weekStart, weekEnd);
  }

  async getBrowserActivity(userId: string, weekStart: number, weekEnd: number): Promise<any[]> {
    return this.metricsCalc.getBrowserActivity(userId, weekStart, weekEnd);
  }

  async generateWeeklyReport(userId: string, weekStart: number, weekEnd: number): Promise<WeeklyReport> {
    return this.reportGen.generateWeeklyReport(userId, weekStart, weekEnd);
  }

  async getTeamMetrics(teamName: string, weekStart: number, weekEnd: number): Promise<any> {
    const database = this.db.getDb();
    const stmt = database.prepare('SELECT id, name FROM users WHERE team = ?');
    stmt.bind([teamName]);

    const teamMembers: any[] = [];
    while (stmt.step()) {
      const user = stmt.getAsObject();
      const metrics = this.metricsCalc.calculateWeeklyMetrics(
        user.id as string,
        weekStart,
        weekEnd
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

    return {
      teamName,
      averageFocusScore: avgFocusScore || 0,
      totalDeepWorkHours: totalDeepWork || 0,
      members: teamMembers
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.db.getDb();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Remote storage client - uses HTTP API
 */
export class RemoteStorageClient implements IStorageClient {
  private serverUrl: string;
  private apiKey: string;

  constructor(serverUrl: string, apiKey: string) {
    this.serverUrl = serverUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.serverUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<string> {
    const result = await this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
    return result.userId;
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      return await this.request(`/api/users/${userId}`);
    } catch (error: any) {
      if (error.message.includes('404')) return null;
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    const result = await this.request('/api/users');
    return result.users;
  }

  async recordActivity(activity: ActivityRecord): Promise<void> {
    await this.request('/api/activity', {
      method: 'POST',
      body: JSON.stringify(activity)
    });
  }

  async recordActivitiesBatch(activities: ActivityRecord[]): Promise<void> {
    await this.request('/api/activity/batch', {
      method: 'POST',
      body: JSON.stringify({ activities })
    });
  }

  async getActivities(userId: string, start?: number, end?: number, limit: number = 1000): Promise<ActivityRecord[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start.toString());
    if (end) params.append('end', end.toString());
    if (limit) params.append('limit', limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    const result = await this.request(`/api/activity/${userId}${query}`);
    return result.activities;
  }

  async getWeeklyMetrics(userId: string, weekStart: number, weekEnd: number): Promise<ProductivityMetrics> {
    return await this.request(
      `/api/metrics/weekly/${userId}?weekStart=${weekStart}&weekEnd=${weekEnd}`
    );
  }

  async getAppUsage(userId: string, weekStart: number, weekEnd: number): Promise<AppUsage[]> {
    const result = await this.request(
      `/api/metrics/app-usage/${userId}?weekStart=${weekStart}&weekEnd=${weekEnd}`
    );
    return result.appUsage;
  }

  async getBrowserActivity(userId: string, weekStart: number, weekEnd: number): Promise<any[]> {
    const result = await this.request(
      `/api/metrics/browser-activity/${userId}?weekStart=${weekStart}&weekEnd=${weekEnd}`
    );
    return result.browserActivity;
  }

  async generateWeeklyReport(userId: string, weekStart: number, weekEnd: number): Promise<WeeklyReport> {
    return await this.request(
      `/api/reports/weekly/${userId}?weekStart=${weekStart}&weekEnd=${weekEnd}`
    );
  }

  async getTeamMetrics(teamName: string, weekStart: number, weekEnd: number): Promise<any> {
    return await this.request(
      `/api/reports/team/${teamName}?weekStart=${weekStart}&weekEnd=${weekEnd}`
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.request('/health');
      return result.status === 'ok';
    } catch {
      return false;
    }
  }
}

/**
 * Factory to create appropriate storage client based on configuration
 */
export class StorageClientFactory {
  static create(
    config: { serverUrl?: string; serverApiKey?: string },
    localDb?: DatabaseManager,
    llmService?: GeminiService
  ): IStorageClient {
    if (!localDb) {
      throw new Error('Local database is required');
    }

    // ALWAYS use hybrid storage (local + optional remote sync)
    // This is imported dynamically to avoid circular dependencies
    const { HybridStorageClient } = require('./hybrid-storage-client');

    return new HybridStorageClient(
      localDb,
      llmService,
      config.serverUrl,
      config.serverApiKey
    );
  }
}
