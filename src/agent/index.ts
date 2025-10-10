import { ActivityTracker } from './tracker';
import { DatabaseManager } from '../database/schema';
import { Config, ActivityRecord } from '../types';
import Store from 'electron-store';
import { globalShortcut, powerMonitor } from 'electron';
import { GeminiService } from '../llm/gemini-service';
import { IStorageClient, StorageClientFactory } from '../storage/storage-client';

export class ProductivityAgent {
  private tracker: ActivityTracker;
  private db: DatabaseManager;
  private storage: IStorageClient;
  private config: Config;
  private llmService: GeminiService | null = null;
  private trackingInterval: NodeJS.Timeout | null = null;
  private inputMonitorInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private activityBuffer: ActivityRecord[] = [];
  private readonly BATCH_SIZE = 10; // Send activities in batches

  constructor(config: Config, db: DatabaseManager, geminiApiKey?: string) {
    this.config = config;
    this.db = db;

    // Initialize LLM service if API key provided
    if (geminiApiKey) {
      this.llmService = new GeminiService(geminiApiKey);
    }

    this.tracker = new ActivityTracker(config, this.llmService || undefined);

    // Initialize storage client (local or remote based on config)
    this.storage = StorageClientFactory.create(
      {
        serverUrl: config.serverUrl,
        serverApiKey: config.serverApiKey
      },
      db,
      this.llmService || undefined
    );
  }

  start() {
    if (this.isRunning) {
      console.log('Agent already running');
      return;
    }

    console.log('Starting Productivity Monkey Agent...');
    this.isRunning = true;

    // Track active window every interval
    this.trackingInterval = setInterval(async () => {
      const record = await this.tracker.captureActivity();
      if (record) {
        this.saveActivityRecord(record);
      }
    }, this.config.trackingInterval);

    // Monitor input activity (simplified - real implementation would use native modules)
    this.setupInputMonitoring();

    // Handle system sleep/wake
    this.setupPowerMonitoring();

    console.log('Agent started successfully');
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping agent...');

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.inputMonitorInterval) {
      clearInterval(this.inputMonitorInterval);
      this.inputMonitorInterval = null;
    }

    // Flush remaining activities before stopping
    await this.flushActivityBuffer();

    globalShortcut.unregisterAll();
    this.isRunning = false;

    console.log('Agent stopped');
  }

  private setupInputMonitoring() {
    // This is a simplified version - production would use robotjs or native modules
    // to track actual keyboard/mouse events
    this.inputMonitorInterval = setInterval(() => {
      // Simulate input tracking - in production, this would be event-driven
      // using robotjs or platform-specific APIs
    }, 1000);
  }

  private setupPowerMonitoring() {
    powerMonitor.on('suspend', () => {
      console.log('System going to sleep');
      // Save idle record
      const idleRecord: ActivityRecord = {
        id: this.generateId(),
        userId: this.config.userId,
        timestamp: Date.now(),
        appName: 'System',
        windowTitle: 'Sleep',
        category: 'idle' as any,
        keystrokesCount: 0,
        mouseMovements: 0,
        isIdle: true
      };
      this.saveActivityRecord(idleRecord);
    });

    powerMonitor.on('resume', () => {
      console.log('System waking up');
    });
  }

  private async saveActivityRecord(record: ActivityRecord) {
    try {
      // Add to buffer
      this.activityBuffer.push(record);

      // Send batch when buffer is full
      if (this.activityBuffer.length >= this.BATCH_SIZE) {
        await this.flushActivityBuffer();
      }
    } catch (error) {
      console.error('Error saving activity record:', error);
    }
  }

  private async flushActivityBuffer() {
    if (this.activityBuffer.length === 0) return;

    try {
      const batch = [...this.activityBuffer];
      this.activityBuffer = [];

      // Use storage client (works for both local and remote)
      await this.storage.recordActivitiesBatch(batch);

      console.log(`✓ Saved ${batch.length} activities to storage`);
    } catch (error) {
      console.error('Error flushing activity buffer:', error);
      // Re-add to buffer to retry later
      this.activityBuffer.unshift(...this.activityBuffer);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
