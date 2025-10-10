import { DatabaseManager } from '../database/schema';
import { MetricsCalculator } from './metrics';
import { WeeklyReport, User, ProductivityMetrics, Insight, AppUsage } from '../types';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { GeminiService } from '../llm/gemini-service';

export class ReportGenerator {
  private db: DatabaseManager;
  private metricsCalc: MetricsCalculator;
  private llmService: GeminiService | null = null;

  constructor(db: DatabaseManager, llmService?: GeminiService) {
    this.db = db;
    this.metricsCalc = new MetricsCalculator(db);
    this.llmService = llmService || null;
  }

  async generateWeeklyReport(userId: string, weekStart: number, weekEnd: number): Promise<WeeklyReport> {
    const user = this.getUser(userId);
    const metrics = this.metricsCalc.calculateWeeklyMetrics(userId, weekStart, weekEnd);
    const teamAverages = this.getTeamAverages(user.team, weekStart, weekEnd);
    const appUsage = this.metricsCalc.calculateAppUsage(userId, weekStart, weekEnd);
    const browserActivity = this.metricsCalc.getBrowserActivity(userId, weekStart, weekEnd);
    const insights = await this.generateInsights(metrics, teamAverages, appUsage, browserActivity);
    const recommendations = this.generateRecommendations(insights, metrics);

    return {
      user,
      week: { start: weekStart, end: weekEnd },
      metrics,
      teamAverages,
      appUsage,
      insights,
      recommendations
    };
  }

  private getUser(userId: string): User {
    const database = this.db.getDb();
    const stmt = database.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([userId]);

    let user: any = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    return {
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      title: user.title as string,
      team: user.team as string,
      managerId: user.manager_id as string | null,
      department: user.department as string,
      createdAt: user.created_at as number
    };
  }

  private getTeamAverages(team: string, weekStart: number, weekEnd: number): ProductivityMetrics {
    const database = this.db.getDb();

    const stmt = database.prepare('SELECT id FROM users WHERE team = ?');
    stmt.bind([team]);

    const teamUsers: any[] = [];
    while (stmt.step()) {
      teamUsers.push(stmt.getAsObject());
    }
    stmt.free();

    if (teamUsers.length === 0) {
      return this.getEmptyMetrics('team-avg', weekStart, weekEnd);
    }

    const allMetrics = teamUsers.map(u =>
      this.metricsCalc.calculateWeeklyMetrics(u.id, weekStart, weekEnd)
    );

    return this.averageMetrics(allMetrics, weekStart, weekEnd);
  }

  private averageMetrics(metrics: ProductivityMetrics[], weekStart: number, weekEnd: number): ProductivityMetrics {
    if (metrics.length === 0) {
      return this.getEmptyMetrics('avg', weekStart, weekEnd);
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      userId: 'team-average',
      weekStart,
      weekEnd,
      totalHours: avg(metrics.map(m => m.totalHours)),
      activeHours: avg(metrics.map(m => m.activeHours)),
      deepWorkHours: avg(metrics.map(m => m.deepWorkHours)),
      shallowWorkHours: avg(metrics.map(m => m.shallowWorkHours)),
      adminHours: avg(metrics.map(m => m.adminHours)),
      unproductiveHours: avg(metrics.map(m => m.unproductiveHours)),
      idleHours: avg(metrics.map(m => m.idleHours)),
      keystrokesPerHour: avg(metrics.map(m => m.keystrokesPerHour)),
      mouseMovementsPerHour: avg(metrics.map(m => m.mouseMovementsPerHour)),
      contextSwitchesPerHour: avg(metrics.map(m => m.contextSwitchesPerHour)),
      longestFocusSession: avg(metrics.map(m => m.longestFocusSession)),
      averageSessionLength: avg(metrics.map(m => m.averageSessionLength)),
      mediaHours: avg(metrics.map(m => m.mediaHours)),
      focusScore: avg(metrics.map(m => m.focusScore))
    };
  }

  private async generateInsights(
    metrics: ProductivityMetrics,
    teamAvg: ProductivityMetrics,
    appUsage: AppUsage[],
    browserActivity: any[]
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Try LLM-generated summary first
    if (this.llmService) {
      try {
        const llmSummary = await this.llmService.generateWeeklySummary({
          totalHours: metrics.totalHours,
          deepWorkHours: metrics.deepWorkHours,
          shallowWorkHours: metrics.shallowWorkHours,
          distractedHours: metrics.unproductiveHours,
          topApps: appUsage.slice(0, 5).map(app => ({
            name: app.appName,
            hours: app.timeUsed,
            category: app.category
          })),
          topWebsites: browserActivity.slice(0, 5).map(site => ({
            url: site.url,
            title: site.title,
            hours: site.timeSpent
          })),
          focusScore: metrics.focusScore,
          contextSwitchesPerHour: metrics.contextSwitchesPerHour
        });

        if (llmSummary) {
          insights.push({
            type: 'info',
            message: `🤖 AI Insights: ${llmSummary}`
          });
        }
      } catch (error) {
        console.error('Error generating LLM summary:', error);
      }
    }

    // Deep work comparison
    const deepWorkDelta = ((metrics.deepWorkHours - teamAvg.deepWorkHours) / teamAvg.deepWorkHours) * 100;
    if (Math.abs(deepWorkDelta) > 15) {
      insights.push({
        type: deepWorkDelta < 0 ? 'warning' : 'success',
        message: `Deep work ${deepWorkDelta < 0 ? 'down' : 'up'} ${Math.abs(deepWorkDelta).toFixed(0)}% vs team average`,
        delta: deepWorkDelta
      });
    }

    // Context switching
    if (metrics.contextSwitchesPerHour > teamAvg.contextSwitchesPerHour * 1.5) {
      const delta = ((metrics.contextSwitchesPerHour - teamAvg.contextSwitchesPerHour) / teamAvg.contextSwitchesPerHour) * 100;
      insights.push({
        type: 'warning',
        message: `Context switching very high: ${metrics.contextSwitchesPerHour.toFixed(0)} switches/hour (${delta.toFixed(0)}% above team)`,
        delta
      });
    }

    // Media usage
    if (metrics.mediaHours > 8) {
      insights.push({
        type: 'warning',
        message: `Heavy media use detected: ${metrics.mediaHours.toFixed(1)}h this week - may affect focus depth`
      });
    }

    // Session length
    if (metrics.longestFocusSession > 60) {
      insights.push({
        type: 'success',
        message: `Excellent focus session: ${metrics.longestFocusSession.toFixed(0)} minutes sustained work`
      });
    } else if (metrics.longestFocusSession < 30) {
      insights.push({
        type: 'warning',
        message: `Fragmented focus: longest session only ${metrics.longestFocusSession.toFixed(0)} minutes`
      });
    }

    // Communication tools
    const commApps = appUsage.filter(a =>
      ['slack', 'teams', 'gmail', 'mail', 'outlook'].some(comm =>
        a.appName.toLowerCase().includes(comm)
      )
    );
    const commTime = commApps.reduce((sum, app) => sum + app.timeUsed, 0);
    const commPercent = (commTime / metrics.activeHours) * 100;

    if (commPercent > 40) {
      insights.push({
        type: 'warning',
        message: `Communication tools consuming ${commPercent.toFixed(0)}% of active time`
      });
    }

    // Focus score
    if (metrics.focusScore >= 70) {
      insights.push({
        type: 'success',
        message: `Strong focus score: ${metrics.focusScore}/100`
      });
    } else if (metrics.focusScore < 50) {
      insights.push({
        type: 'warning',
        message: `Low focus score: ${metrics.focusScore}/100 - multiple productivity drags detected`
      });
    }

    return insights;
  }

  private generateRecommendations(insights: Insight[], metrics: ProductivityMetrics): string[] {
    const recommendations: string[] = [];

    const hasHighContextSwitching = insights.some(i =>
      i.message.includes('Context switching')
    );
    const hasLowDeepWork = insights.some(i =>
      i.message.includes('Deep work') && i.message.includes('down')
    );
    const hasHighMedia = insights.some(i =>
      i.message.includes('media')
    );
    const hasShortSessions = metrics.averageSessionLength < 15;

    if (hasHighContextSwitching) {
      recommendations.push('Focus Blocks: Schedule 2-hour blocks with notifications paused to reduce app switching');
    }

    if (hasLowDeepWork) {
      recommendations.push('Deep Work Goals: Target 12-15h of deep work per week (current: ' + metrics.deepWorkHours.toFixed(1) + 'h)');
    }

    if (hasHighMedia) {
      recommendations.push('Media Policy: Consider instrumental/lo-fi music only during focus periods');
    }

    if (hasShortSessions) {
      recommendations.push('Batch Communication: Process Slack/email in scheduled batches rather than real-time');
    }

    if (metrics.contextSwitchesPerHour > 15) {
      recommendations.push('Browser Hygiene: Use separate browser profiles for different work contexts');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up the good work! Maintain current productivity patterns');
    }

    return recommendations;
  }

  formatReportAsText(report: WeeklyReport): string {
    const { user, week, metrics, teamAverages, appUsage, insights, recommendations } = report;

    let output = '';

    output += `═══════════════════════════════════════════════════\n`;
    output += `  WEEKLY PRODUCTIVITY REPORT\n`;
    output += `═══════════════════════════════════════════════════\n\n`;

    output += `👤 ${user.name}\n`;
    output += `   Role: ${user.title}\n`;
    output += `   Team: ${user.team}\n`;
    output += `   Week: ${format(week.start, 'MMM d')} - ${format(week.end, 'MMM d, yyyy')}\n\n`;

    output += `📊 PRODUCTIVITY SUMMARY\n`;
    output += `${'─'.repeat(51)}\n`;
    output += `Metric                          You      Team Avg   Delta\n`;
    output += `${'─'.repeat(51)}\n`;
    output += this.formatMetricRow('Total Hours', metrics.totalHours, teamAverages.totalHours);
    output += this.formatMetricRow('Active Hours', metrics.activeHours, teamAverages.activeHours);
    output += this.formatMetricRow('Deep Work', metrics.deepWorkHours, teamAverages.deepWorkHours);
    output += this.formatMetricRow('Shallow Work', metrics.shallowWorkHours, teamAverages.shallowWorkHours);
    output += this.formatMetricRow('Unproductive', metrics.unproductiveHours, teamAverages.unproductiveHours);
    output += `${'─'.repeat(51)}\n\n`;

    output += `🧠 FOCUS SCORE: ${metrics.focusScore}/100\n\n`;

    output += `🖱️ ACTIVITY & BEHAVIOR\n`;
    output += `${'─'.repeat(51)}\n`;
    output += `  Keystrokes/hour:        ${metrics.keystrokesPerHour.toFixed(0)} (team: ${teamAverages.keystrokesPerHour.toFixed(0)})\n`;
    output += `  Mouse movements/hour:   ${metrics.mouseMovementsPerHour.toFixed(0)} (team: ${teamAverages.mouseMovementsPerHour.toFixed(0)})\n`;
    output += `  Context switches/hour:  ${metrics.contextSwitchesPerHour.toFixed(0)} (team: ${teamAverages.contextSwitchesPerHour.toFixed(0)})\n`;
    output += `  Longest focus session:  ${metrics.longestFocusSession.toFixed(0)} mins (team: ${teamAverages.longestFocusSession.toFixed(0)})\n`;
    output += `  Avg session length:     ${metrics.averageSessionLength.toFixed(0)} mins (team: ${teamAverages.averageSessionLength.toFixed(0)})\n`;
    output += `  Media time:             ${metrics.mediaHours.toFixed(1)}h\n\n`;

    output += `🧰 TOP APPLICATIONS\n`;
    output += `${'─'.repeat(51)}\n`;
    const topApps = appUsage.slice(0, 10);
    for (const app of topApps) {
      const hours = app.timeUsed.toFixed(1);
      const category = app.category.padEnd(10);
      output += `  ${app.appName.padEnd(25)} ${hours}h  ${category}\n`;
    }
    output += '\n';

    output += `📬 INSIGHTS & ALERTS\n`;
    output += `${'─'.repeat(51)}\n`;
    for (const insight of insights) {
      const icon = insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : 'ℹ️';
      output += `  ${icon} ${insight.message}\n`;
    }
    output += '\n';

    output += `💡 RECOMMENDATIONS\n`;
    output += `${'─'.repeat(51)}\n`;
    for (let i = 0; i < recommendations.length; i++) {
      output += `  ${i + 1}. ${recommendations[i]}\n`;
    }
    output += '\n';

    output += `═══════════════════════════════════════════════════\n`;
    output += `  🐒 Generated by Productivity Monkey\n`;
    output += `═══════════════════════════════════════════════════\n`;

    return output;
  }

  private formatMetricRow(label: string, value: number, teamValue: number): string {
    const delta = value - teamValue;
    const deltaPercent = teamValue > 0 ? (delta / teamValue) * 100 : 0;
    const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
    const deltaStr = `${arrow}${Math.abs(delta).toFixed(1)}h`;

    return `${label.padEnd(30)} ${value.toFixed(1)}h    ${teamValue.toFixed(1)}h     ${deltaStr}\n`;
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
