import { DatabaseManager } from '../database/schema';
import { ProductivityMetrics, ActivityRecord, ActivityCategory, AppUsage } from '../types';
import { startOfWeek, endOfWeek } from 'date-fns';

export class MetricsCalculator {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  calculateWeeklyMetrics(userId: string, weekStart: number, weekEnd: number): ProductivityMetrics {
    const database = this.db.getDb();

    // Get all activity records for the week
    const stmt = database.prepare(
      'SELECT * FROM activity_records WHERE user_id = ? AND timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC'
    );
    stmt.bind([userId, weekStart, weekEnd]);

    const records: any[] = [];
    while (stmt.step()) {
      records.push(stmt.getAsObject());
    }
    stmt.free();

    if (records.length === 0) {
      return this.getEmptyMetrics(userId, weekStart, weekEnd);
    }

    const totalHours = this.calculateTotalHours(records);
    const categoryHours = this.calculateCategoryHours(records);
    const inputMetrics = this.calculateInputMetrics(records);
    const contextSwitches = this.calculateContextSwitches(records);
    const sessionMetrics = this.calculateSessionMetrics(records);
    const mediaHours = this.calculateMediaHours(records);

    const activeHours = totalHours - categoryHours.idle;

    const focusScore = this.calculateFocusScore({
      deepWorkHours: categoryHours.deep,
      activeHours,
      contextSwitchesPerHour: contextSwitches / activeHours,
      avgSessionLength: sessionMetrics.average,
      unproductivePercent: categoryHours.distracted / activeHours
    });

    return {
      userId,
      weekStart,
      weekEnd,
      totalHours,
      activeHours,
      deepWorkHours: categoryHours.deep,
      shallowWorkHours: categoryHours.shallow,
      adminHours: categoryHours.admin,
      unproductiveHours: categoryHours.distracted,
      idleHours: categoryHours.idle,
      keystrokesPerHour: inputMetrics.keystrokesPerHour,
      mouseMovementsPerHour: inputMetrics.mousePerHour,
      contextSwitchesPerHour: contextSwitches / activeHours,
      longestFocusSession: sessionMetrics.longest,
      averageSessionLength: sessionMetrics.average,
      mediaHours,
      focusScore
    };
  }

  private calculateTotalHours(records: any[]): number {
    if (records.length === 0) return 0;
    const start = records[0].timestamp;
    const end = records[records.length - 1].timestamp;
    return (end - start) / (1000 * 60 * 60); // Convert to hours
  }

  private calculateCategoryHours(records: any[]): Record<string, number> {
    const categoryTimes: Record<string, number> = {
      deep: 0,
      shallow: 0,
      admin: 0,
      distracted: 0,
      idle: 0
    };

    for (let i = 0; i < records.length - 1; i++) {
      const current = records[i];
      const next = records[i + 1];
      const duration = (next.timestamp - current.timestamp) / (1000 * 60 * 60); // hours

      categoryTimes[current.category] += duration;
    }

    return categoryTimes;
  }

  private calculateInputMetrics(records: any[]): { keystrokesPerHour: number; mousePerHour: number } {
    const totalKeystrokes = records.reduce((sum, r) => sum + (r.keystrokes_count || 0), 0);
    const totalMouse = records.reduce((sum, r) => sum + (r.mouse_movements || 0), 0);
    const activeHours = records.length * (5 / 60); // Assuming 5-minute intervals

    return {
      keystrokesPerHour: totalKeystrokes / activeHours,
      mousePerHour: totalMouse / activeHours
    };
  }

  private calculateContextSwitches(records: any[]): number {
    let switches = 0;
    for (let i = 1; i < records.length; i++) {
      if (records[i].app_name !== records[i - 1].app_name) {
        switches++;
      }
    }
    return switches;
  }

  private calculateSessionMetrics(records: any[]): { longest: number; average: number } {
    const sessions: number[] = [];
    let currentSessionStart = records[0]?.timestamp;
    let currentApp = records[0]?.app_name;

    for (let i = 1; i < records.length; i++) {
      if (records[i].app_name !== currentApp) {
        const sessionLength = (records[i].timestamp - currentSessionStart) / (1000 * 60); // minutes
        sessions.push(sessionLength);
        currentSessionStart = records[i].timestamp;
        currentApp = records[i].app_name;
      }
    }

    const longest = Math.max(...sessions, 0);
    const average = sessions.length > 0 ? sessions.reduce((a, b) => a + b, 0) / sessions.length : 0;

    return { longest, average };
  }

  private calculateMediaHours(records: any[]): number {
    let mediaTime = 0;
    for (let i = 0; i < records.length - 1; i++) {
      if (records[i].media_playing) {
        const duration = (records[i + 1].timestamp - records[i].timestamp) / (1000 * 60 * 60);
        mediaTime += duration;
      }
    }
    return mediaTime;
  }

  calculateFocusScore(params: {
    deepWorkHours: number;
    activeHours: number;
    contextSwitchesPerHour: number;
    avgSessionLength: number;
    unproductivePercent: number;
  }): number {
    const { deepWorkHours, activeHours, contextSwitchesPerHour, avgSessionLength, unproductivePercent } = params;

    // Focus score components (0-100)
    const deepWorkScore = Math.min((deepWorkHours / activeHours) * 100, 40); // Max 40 points
    const contextSwitchScore = Math.max(0, 20 - (contextSwitchesPerHour * 1.5)); // Max 20 points, penalty for switches
    const sessionLengthScore = Math.min(avgSessionLength / 3, 20); // Max 20 points (60 min = 20 points)
    const distractionScore = Math.max(0, 20 - (unproductivePercent * 100)); // Max 20 points

    const totalScore = deepWorkScore + contextSwitchScore + sessionLengthScore + distractionScore;

    return Math.round(Math.min(totalScore, 100));
  }

  calculateAppUsage(userId: string, weekStart: number, weekEnd: number): AppUsage[] {
    const database = this.db.getDb();

    // Simplified query for sql.js
    const stmt = database.prepare(
      'SELECT app_name, category, COUNT(*) as count, SUM(keystrokes_count) as total_keystrokes, SUM(mouse_movements) as total_mouse FROM activity_records WHERE user_id = ? AND timestamp >= ? AND timestamp <= ? GROUP BY app_name, category ORDER BY count DESC'
    );
    stmt.bind([userId, weekStart, weekEnd]);

    const apps: any[] = [];
    while (stmt.step()) {
      apps.push(stmt.getAsObject());
    }
    stmt.free();

    return apps.map(app => ({
      appName: app.app_name as string,
      timeUsed: (app.count as number) * 5 / 60, // Approximate hours (5 sec intervals)
      category: app.category as ActivityCategory,
      keystrokesCount: app.total_keystrokes as number || 0,
      mouseMovements: app.total_mouse as number || 0
    }));
  }

  getBrowserActivity(userId: string, weekStart: number, weekEnd: number): any[] {
    const database = this.db.getDb();

    // Get browser-specific activity records (where url is not null)
    const stmt = database.prepare(
      `SELECT
        url,
        window_title,
        category,
        COUNT(*) as visit_count,
        SUM(keystrokes_count) as total_keystrokes,
        SUM(mouse_movements) as total_mouse
      FROM activity_records
      WHERE user_id = ?
        AND timestamp >= ?
        AND timestamp <= ?
        AND url IS NOT NULL
        AND url != ''
      GROUP BY url, window_title, category
      ORDER BY visit_count DESC
      LIMIT 20`
    );
    stmt.bind([userId, weekStart, weekEnd]);

    const websites: any[] = [];
    while (stmt.step()) {
      websites.push(stmt.getAsObject());
    }
    stmt.free();

    return websites.map(site => ({
      url: site.url as string,
      title: site.window_title as string,
      category: site.category as ActivityCategory,
      timeSpent: (site.visit_count as number) * 5 / 60, // hours
      visitCount: site.visit_count as number,
      keystrokesCount: site.total_keystrokes as number || 0,
      mouseMovements: site.total_mouse as number || 0
    }));
  }

  saveMetrics(metrics: ProductivityMetrics) {
    const database = this.db.getDb();

    const id = `${metrics.userId}-${metrics.weekStart}`;

    database.run(
      'INSERT OR REPLACE INTO productivity_metrics (id, user_id, week_start, week_end, total_hours, active_hours, deep_work_hours, shallow_work_hours, admin_hours, unproductive_hours, idle_hours, keystrokes_per_hour, mouse_movements_per_hour, context_switches_per_hour, longest_focus_session, average_session_length, media_hours, focus_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        metrics.userId,
        metrics.weekStart,
        metrics.weekEnd,
        metrics.totalHours,
        metrics.activeHours,
        metrics.deepWorkHours,
        metrics.shallowWorkHours,
        metrics.adminHours,
        metrics.unproductiveHours,
        metrics.idleHours,
        metrics.keystrokesPerHour,
        metrics.mouseMovementsPerHour,
        metrics.contextSwitchesPerHour,
        metrics.longestFocusSession,
        metrics.averageSessionLength,
        metrics.mediaHours,
        metrics.focusScore
      ]
    );

    this.db.save();
  }

  private getEmptyMetrics(userId: string, weekStart: number, weekEnd: number): ProductivityMetrics {
    return {
      userId,
      weekStart,
      weekEnd,
      totalHours: 0,
      activeHours: 0,
      deepWorkHours: 0,
      shallowWorkHours: 0,
      adminHours: 0,
      unproductiveHours: 0,
      idleHours: 0,
      keystrokesPerHour: 0,
      mouseMovementsPerHour: 0,
      contextSwitchesPerHour: 0,
      longestFocusSession: 0,
      averageSessionLength: 0,
      mediaHours: 0,
      focusScore: 0
    };
  }
}
