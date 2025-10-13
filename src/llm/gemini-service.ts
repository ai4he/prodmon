/**
 * Gemini LLM Service
 * Provides intelligent enhancements using Google's Gemini API
 * Includes quota management and graceful fallbacks
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface QuotaInfo {
  dailyRequests: number;
  lastResetDate: string;
  failureCount: number;
  lastFailure?: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private quotaPath: string;
  private quota: QuotaInfo;
  private enabled: boolean = true;
  private readonly MAX_DAILY_REQUESTS = 1500; // Gemini free tier limit
  private readonly MAX_FAILURES = 3; // Disable after 3 consecutive failures (reduced from 5)
  private hasLoggedDisabled: boolean = false; // Track if we've already logged the disabled message

  constructor(apiKey?: string) {
    // Setup quota tracking file
    const dataDir = this.getDataDir();
    this.quotaPath = join(dataDir, 'gemini-quota.json');
    this.quota = this.loadQuota();

    // Initialize Gemini if API key is provided
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-flash-lite-latest - fastest, most lightweight model
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
        console.log('✓ Gemini LLM service initialized (gemini-flash-lite-latest)');
      } catch (error) {
        console.error('Failed to initialize Gemini:', error);
        this.enabled = false;
      }
    } else {
      console.log('No Gemini API key provided, LLM features disabled');
      this.enabled = false;
    }
  }

  private getDataDir(): string {
    const platform = process.platform;
    let dataPath: string;

    if (platform === 'darwin') {
      dataPath = join(homedir(), 'Library', 'Application Support', 'prodmon');
    } else if (platform === 'win32') {
      dataPath = join(homedir(), 'AppData', 'Roaming', 'prodmon');
    } else {
      dataPath = join(homedir(), '.config', 'prodmon');
    }

    if (!existsSync(dataPath)) {
      mkdirSync(dataPath, { recursive: true });
    }

    return dataPath;
  }

  private loadQuota(): QuotaInfo {
    if (existsSync(this.quotaPath)) {
      try {
        const data = readFileSync(this.quotaPath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        console.error('Error loading quota data:', error);
      }
    }

    return {
      dailyRequests: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      failureCount: 0
    };
  }

  private saveQuota() {
    try {
      writeFileSync(this.quotaPath, JSON.stringify(this.quota, null, 2));
    } catch (error) {
      console.error('Error saving quota data:', error);
    }
  }

  private checkAndResetQuota(): boolean {
    const today = new Date().toISOString().split('T')[0];

    // Reset daily counter if new day
    if (this.quota.lastResetDate !== today) {
      this.quota.dailyRequests = 0;
      this.quota.lastResetDate = today;
      this.quota.failureCount = 0; // Reset failures on new day
      this.hasLoggedDisabled = false; // Reset log flag on new day
      this.saveQuota();
    }

    // Check if quota exceeded
    if (this.quota.dailyRequests >= this.MAX_DAILY_REQUESTS) {
      if (!this.hasLoggedDisabled) {
        console.warn('⚠ Daily Gemini quota exceeded, using rule-based categorization');
        this.hasLoggedDisabled = true;
      }
      return false;
    }

    // Check if too many consecutive failures
    if (this.quota.failureCount >= this.MAX_FAILURES) {
      if (!this.hasLoggedDisabled) {
        console.warn(`⚠ Gemini API not responding (${this.MAX_FAILURES} failures), using rule-based categorization`);
        this.hasLoggedDisabled = true;
      }
      return false;
    }

    return true;
  }

  private incrementQuota(success: boolean) {
    this.quota.dailyRequests++;

    if (!success) {
      this.quota.failureCount++;
      this.quota.lastFailure = new Date().toISOString();
    } else {
      this.quota.failureCount = 0; // Reset failure count on success
    }

    this.saveQuota();
  }

  isAvailable(): boolean {
    return this.enabled && this.checkAndResetQuota();
  }

  getQuotaStatus(): { available: boolean; used: number; limit: number; failureCount: number } {
    this.checkAndResetQuota();
    return {
      available: this.isAvailable(),
      used: this.quota.dailyRequests,
      limit: this.MAX_DAILY_REQUESTS,
      failureCount: this.quota.failureCount
    };
  }

  /**
   * Smart activity categorization using LLM
   * Analyzes app name, window title, and URL to determine activity category
   */
  async categorizeActivity(
    appName: string,
    windowTitle: string,
    url?: string
  ): Promise<'deep' | 'shallow' | 'admin' | 'distracted' | null> {
    if (!this.isAvailable()) {
      return null; // Fallback to rule-based categorization
    }

    try {
      const prompt = `You are a productivity analyzer. Categorize this computer activity into ONE of these categories:
- "deep": Deep work (coding, writing, design, complex problem-solving, learning)
- "shallow": Shallow work (email, chat, meetings, project management)
- "admin": Administrative tasks (settings, file management, general browsing)
- "distracted": Distractions (social media, entertainment, news)

Activity details:
App: ${appName}
Title: ${windowTitle}
URL: ${url || 'N/A'}

Respond with ONLY ONE WORD: deep, shallow, admin, or distracted.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().toLowerCase().trim();

      this.incrementQuota(true);

      // Validate response
      if (['deep', 'shallow', 'admin', 'distracted'].includes(response)) {
        return response as any;
      }

      // Invalid response, use fallback
      return null;
    } catch (error) {
      // Error calling LLM, increment failure count
      this.incrementQuota(false);
      return null;
    }
  }

  /**
   * Generate intelligent weekly summary with insights
   */
  async generateWeeklySummary(data: {
    totalHours: number;
    deepWorkHours: number;
    shallowWorkHours: number;
    distractedHours: number;
    topApps: Array<{ name: string; hours: number; category: string }>;
    topWebsites: Array<{ url: string; title: string; hours: number }>;
    focusScore: number;
    contextSwitchesPerHour: number;
  }): Promise<string | null> {
    if (!this.isAvailable()) {
      return null; // Fallback to template-based summary
    }

    try {
      const prompt = `You are a productivity coach analyzing someone's weekly work patterns. Generate a brief, actionable summary (3-4 sentences) with specific insights and one concrete recommendation.

Weekly Data:
- Total active time: ${data.totalHours.toFixed(1)}h
- Deep work: ${data.deepWorkHours.toFixed(1)}h (${((data.deepWorkHours / data.totalHours) * 100).toFixed(0)}%)
- Shallow work: ${data.shallowWorkHours.toFixed(1)}h
- Distractions: ${data.distractedHours.toFixed(1)}h
- Focus score: ${data.focusScore}/100
- Context switches per hour: ${data.contextSwitchesPerHour.toFixed(1)}

Top 3 apps:
${data.topApps.slice(0, 3).map(app => `- ${app.name}: ${app.hours.toFixed(1)}h (${app.category})`).join('\n')}

Top 3 websites:
${data.topWebsites.slice(0, 3).map(site => `- ${site.title}: ${site.hours.toFixed(1)}h`).join('\n')}

Provide:
1. A brief assessment of their productivity patterns
2. One specific strength they demonstrated
3. One specific area for improvement with an actionable tip

Keep it positive, specific, and actionable. Max 4 sentences.`;

      const result = await this.model.generateContent(prompt);
      const summary = result.response.text().trim();

      this.incrementQuota(true);
      return summary;
    } catch (error) {
      console.error('Error generating LLM summary:', error);
      this.incrementQuota(false);
      return null;
    }
  }

  /**
   * Extract project name from window title or URL
   */
  async extractProjectName(
    appName: string,
    windowTitle: string,
    url?: string
  ): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const prompt = `Extract the project or task name from this activity. Return ONLY the project name, nothing else.

App: ${appName}
Title: ${windowTitle}
URL: ${url || 'N/A'}

Examples:
- "main.ts - MyProject - Visual Studio Code" → "MyProject"
- "Pull Request #456 - acme/webapp - GitHub" → "webapp"
- "README.md - documentation - Vim" → "documentation"
- "YouTube - JavaScript Tutorial" → "JavaScript learning"

Return only the project/task name (2-3 words max), or "General" if unclear:`;

      const result = await this.model.generateContent(prompt);
      const projectName = result.response.text().trim();

      this.incrementQuota(true);

      // Validate response (reasonable length)
      if (projectName.length > 0 && projectName.length < 50) {
        return projectName;
      }

      return null;
    } catch (error) {
      console.error('Error extracting project name:', error);
      this.incrementQuota(false);
      return null;
    }
  }

  /**
   * Detect if user is in a focused work session
   */
  async analyzeFocusSession(activities: Array<{
    appName: string;
    windowTitle: string;
    category: string;
    duration: number;
  }>): Promise<{ isFocused: boolean; insight: string } | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const prompt = `Analyze this sequence of activities to determine if the user is in a focused work session.

Activities (last 30 minutes):
${activities.map((a, i) => `${i + 1}. ${a.appName} - ${a.windowTitle} (${a.duration}s, ${a.category})`).join('\n')}

Respond in JSON format:
{
  "isFocused": true/false,
  "insight": "One sentence explaining why (e.g., 'Deep work on coding with minimal context switching' or 'Fragmented attention across multiple distractions')"
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();

      this.incrementQuota(true);

      // Parse JSON response
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      console.error('Error analyzing focus session:', error);
      this.incrementQuota(false);
      return null;
    }
  }

  /**
   * Generate personalized productivity tips based on patterns
   */
  async generateProductivityTips(patterns: {
    mostProductiveTime: string;
    biggestDistraction: string;
    averageSessionLength: number;
    contextSwitchRate: number;
  }): Promise<string[] | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const prompt = `Based on these productivity patterns, generate 3 specific, actionable tips:

Patterns:
- Most productive time: ${patterns.mostProductiveTime}
- Biggest distraction: ${patterns.biggestDistraction}
- Average focus session: ${patterns.averageSessionLength.toFixed(0)} minutes
- Context switches per hour: ${patterns.contextSwitchRate.toFixed(1)}

Generate 3 tips as a JSON array of strings. Each tip should be:
1. Specific and actionable
2. Based on the data patterns
3. One sentence
4. Positive and encouraging

Example: ["Block ${patterns.mostProductiveTime} for your hardest tasks", "Use website blocker for ${patterns.biggestDistraction} during deep work", "Aim for 90-minute focus blocks to reduce context switching"]

Return ONLY the JSON array, no other text.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();

      this.incrementQuota(true);

      // Parse JSON response
      const tips = JSON.parse(response);
      return Array.isArray(tips) ? tips : null;
    } catch (error) {
      console.error('Error generating productivity tips:', error);
      this.incrementQuota(false);
      return null;
    }
  }
}
