import { platform } from 'os';
import { ActivityRecord, ActivityCategory, Config } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { GeminiService } from '../llm/gemini-service';

export class ActivityTracker {
  private config: Config;
  private lastActivity: number = Date.now();
  private currentApp: string = '';
  private currentWindowTitle: string = '';
  private sessionStartTime: number = Date.now();
  private keystrokesInInterval: number = 0;
  private mouseMovementsInInterval: number = 0;
  private previousMousePosition: { x: number; y: number } | null = null;
  private llmService: GeminiService | null = null;
  private llmCacheTime: number = 0;
  private llmCacheKey: string = '';
  private readonly LLM_CACHE_DURATION = 300000; // Cache LLM results for 5 minutes (reduced API calls)

  constructor(config: Config, llmService?: GeminiService) {
    this.config = config;
    this.llmService = llmService || null;
  }

  async captureActivity(): Promise<ActivityRecord | null> {
    try {
      // Dynamic import for cross-platform compatibility
      // get-windows (formerly active-win) is an ES module, but we compile to CommonJS
      const { activeWindow } = await import('get-windows');

      // Request with both Screen Recording and Accessibility permissions for maximum detail
      // Screen Recording: enables window title capture
      // Accessibility: enables direct URL capture from browsers (more accurate than parsing titles)
      const activeWin = await activeWindow({
        screenRecordingPermission: true,
        accessibilityPermission: true
      });

      if (!activeWin) {
        return this.createIdleRecord();
      }

      const now = Date.now();
      const isIdle = this.checkIfIdle(now);

      // Detect context switch
      if (this.currentApp !== activeWin.owner.name ||
          this.currentWindowTitle !== activeWin.title) {
        this.sessionStartTime = now;
        this.currentApp = activeWin.owner.name;
        this.currentWindowTitle = activeWin.title;
      }

      // Use URL from active-win if available (via Accessibility permission on macOS)
      // This is much more accurate than parsing titles and works for all supported browsers
      const url = ('url' in activeWin ? activeWin.url : undefined) || this.extractUrlFromTitle(activeWin.title);
      const mediaInfo = this.detectMedia(activeWin.title, activeWin.owner.name);

      // Try LLM categorization first, fallback to rule-based
      let category = await this.categorizeSmart(
        activeWin.owner.name,
        activeWin.title,
        url,
        isIdle
      );

      // If LLM not available or failed, use rule-based
      if (!category) {
        category = this.categorizeActivity(
          activeWin.owner.name,
          activeWin.title,
          url,
          isIdle
        );
      }

      const record: ActivityRecord = {
        id: uuidv4(),
        userId: this.config.userId,
        timestamp: now,
        appName: activeWin.owner.name,
        windowTitle: activeWin.title,
        url,
        category,
        keystrokesCount: this.keystrokesInInterval,
        mouseMovements: this.mouseMovementsInInterval,
        isIdle,
        mediaPlaying: mediaInfo.playing,
        mediaSource: mediaInfo.source
      };

      // Reset counters
      this.keystrokesInInterval = 0;
      this.mouseMovementsInInterval = 0;
      this.lastActivity = now;

      return record;
    } catch (error) {
      console.error('Error capturing activity:', error);
      return null;
    }
  }

  private createIdleRecord(): ActivityRecord {
    return {
      id: uuidv4(),
      userId: this.config.userId,
      timestamp: Date.now(),
      appName: 'System',
      windowTitle: 'Idle',
      category: ActivityCategory.IDLE,
      keystrokesCount: 0,
      mouseMovements: 0,
      isIdle: true
    };
  }

  private checkIfIdle(now: number): boolean {
    return (now - this.lastActivity) > this.config.idleThreshold;
  }

  private extractUrlFromTitle(title: string): string | undefined {
    // Extract URL from browser tab titles
    const urlPattern = /https?:\/\/[^\s]+/;
    const match = title.match(urlPattern);
    return match ? match[0] : undefined;
  }

  private detectMedia(title: string, appName: string): { playing: boolean; source?: string } {
    const lowerTitle = title.toLowerCase();
    const lowerApp = appName.toLowerCase();

    // Detect music/video services
    const mediaServices = ['spotify', 'youtube', 'netflix', 'apple music', 'soundcloud', 'twitch'];

    for (const service of mediaServices) {
      if (lowerTitle.includes(service) || lowerApp.includes(service)) {
        return { playing: true, source: service };
      }
    }

    // Check for common media indicators in browser titles
    if (lowerTitle.includes('▶') || lowerTitle.includes('⏸') ||
        lowerTitle.includes('playing') || lowerTitle.includes('paused')) {
      return { playing: true, source: 'Browser Media' };
    }

    return { playing: false };
  }

  /**
   * Smart categorization using LLM (with caching to reduce API calls)
   */
  private async categorizeSmart(
    appName: string,
    windowTitle: string,
    url: string | undefined,
    isIdle: boolean
  ): Promise<ActivityCategory | null> {
    if (isIdle) {
      return ActivityCategory.IDLE;
    }

    // Create cache key from app + title + url
    const cacheKey = `${appName}|${windowTitle.substring(0, 50)}|${url || ''}`;
    const now = Date.now();

    // Only call LLM if:
    // 1. Context has changed (different app/title/url)
    // 2. OR cache has expired (5 minutes)
    const contextChanged = cacheKey !== this.llmCacheKey;
    const cacheExpired = (now - this.llmCacheTime) > this.LLM_CACHE_DURATION;
    const shouldUseLLM = contextChanged || cacheExpired;

    if (this.llmService && shouldUseLLM) {
      try {
        const category = await this.llmService.categorizeActivity(appName, windowTitle, url);
        if (category) {
          this.llmCacheTime = now;
          this.llmCacheKey = cacheKey;
          return this.mapLLMCategory(category);
        }
      } catch (error) {
        // LLM failed, will fallback to rule-based
        // Don't log error here - already logged in gemini-service.ts
      }
    }

    return null; // Fallback to rule-based
  }

  private mapLLMCategory(category: string): ActivityCategory {
    switch (category) {
      case 'deep': return ActivityCategory.DEEP;
      case 'shallow': return ActivityCategory.SHALLOW;
      case 'distracted': return ActivityCategory.DISTRACTED;
      case 'admin': return ActivityCategory.ADMIN;
      default: return ActivityCategory.ADMIN;
    }
  }

  private categorizeActivity(appName: string, windowTitle: string, url: string | undefined, isIdle: boolean): ActivityCategory {
    if (isIdle) {
      return ActivityCategory.IDLE;
    }

    const lowerApp = appName.toLowerCase();
    const lowerTitle = windowTitle.toLowerCase();
    const lowerUrl = url ? url.toLowerCase() : '';

    // Deep work apps
    const deepWorkApps = [
      'code', 'visual studio', 'xcode', 'intellij', 'pycharm', 'webstorm',
      'figma', 'sketch', 'photoshop', 'illustrator', 'aftereffects',
      'word', 'excel', 'powerpoint', 'keynote', 'pages', 'numbers',
      'terminal', 'iterm', 'cmd', 'powershell',
      'notion', 'obsidian', 'roam',
      'zendesk', 'salesforce', 'hubspot'
    ];

    // Shallow work apps
    const shallowWorkApps = [
      'slack', 'teams', 'discord', 'telegram',
      'mail', 'outlook', 'gmail',
      'calendar', 'zoom', 'meet', 'skype'
    ];

    // Distraction apps
    const distractionApps = [
      'youtube', 'netflix', 'spotify', 'apple music',
      'facebook', 'twitter', 'instagram', 'reddit', 'tiktok',
      'games', 'steam', 'epic games'
    ];

    // Enhanced categorization using URL (when available via Accessibility permission)
    if (lowerUrl) {
      // Deep work URLs - development, documentation, design
      const deepWorkUrls = [
        'github.com', 'gitlab.com', 'bitbucket.org',
        'stackoverflow.com', 'stackexchange.com',
        'developer.mozilla.org', 'docs.microsoft.com', 'dev.to',
        'figma.com', 'miro.com', 'excalidraw.com',
        'aws.amazon.com', 'cloud.google.com', 'azure.microsoft.com',
        'jupyter.org', 'kaggle.com', 'colab.research.google.com'
      ];

      // Shallow work URLs - communication, project management
      const shallowWorkUrls = [
        'slack.com', 'teams.microsoft.com', 'discord.com',
        'mail.google.com', 'outlook.office.com', 'outlook.live.com',
        'calendar.google.com', 'zoom.us', 'meet.google.com',
        'asana.com', 'trello.com', 'monday.com', 'jira.atlassian.com',
        'notion.so', 'airtable.com'
      ];

      // Distraction URLs
      const distractionUrls = [
        'youtube.com', 'netflix.com', 'hulu.com', 'disneyplus.com',
        'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
        'reddit.com', 'tiktok.com', 'twitch.tv',
        'news.ycombinator.com', 'espn.com', 'cnn.com'
      ];

      for (const urlPattern of deepWorkUrls) {
        if (lowerUrl.includes(urlPattern)) {
          return ActivityCategory.DEEP;
        }
      }

      for (const urlPattern of shallowWorkUrls) {
        if (lowerUrl.includes(urlPattern)) {
          return ActivityCategory.SHALLOW;
        }
      }

      for (const urlPattern of distractionUrls) {
        if (lowerUrl.includes(urlPattern)) {
          return ActivityCategory.DISTRACTED;
        }
      }
    }

    // Fallback to app-based categorization
    for (const app of deepWorkApps) {
      if (lowerApp.includes(app) || lowerTitle.includes(app)) {
        return ActivityCategory.DEEP;
      }
    }

    for (const app of shallowWorkApps) {
      if (lowerApp.includes(app) || lowerTitle.includes(app)) {
        return ActivityCategory.SHALLOW;
      }
    }

    for (const app of distractionApps) {
      if (lowerApp.includes(app) || lowerTitle.includes(app)) {
        return ActivityCategory.DISTRACTED;
      }
    }

    // Default to admin for unclassified work apps
    return ActivityCategory.ADMIN;
  }

  trackKeystroke() {
    this.keystrokesInInterval++;
    this.lastActivity = Date.now();
  }

  trackMouseMovement(x: number, y: number) {
    if (this.previousMousePosition) {
      const distance = Math.sqrt(
        Math.pow(x - this.previousMousePosition.x, 2) +
        Math.pow(y - this.previousMousePosition.y, 2)
      );

      // Only count as movement if significant (> 10 pixels)
      if (distance > 10) {
        this.mouseMovementsInInterval++;
        this.lastActivity = Date.now();
      }
    }
    this.previousMousePosition = { x, y };
  }
}
