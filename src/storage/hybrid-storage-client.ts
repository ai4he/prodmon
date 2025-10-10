import { ActivityRecord, User, ProductivityMetrics, AppUsage, WeeklyReport } from '../types';
import { IStorageClient, LocalStorageClient, RemoteStorageClient } from './storage-client';
import { DatabaseManager } from '../database/schema';
import { GeminiService } from '../llm/gemini-service';

/**
 * Hybrid storage client - ALWAYS saves locally, syncs to server when available
 * Provides offline support with automatic sync when connection is restored
 */
export class HybridStorageClient implements IStorageClient {
  private localClient: LocalStorageClient;
  private remoteClient: RemoteStorageClient | null;
  private syncQueue: ActivityRecord[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private readonly SYNC_INTERVAL = 30000; // Sync every 30 seconds
  private readonly BATCH_SIZE = 50; // Sync up to 50 records at a time

  constructor(
    db: DatabaseManager,
    llmService: GeminiService | undefined,
    serverUrl?: string,
    serverApiKey?: string
  ) {
    // Local storage is ALWAYS active
    this.localClient = new LocalStorageClient(db, llmService);

    // Remote storage is optional
    if (serverUrl) {
      this.remoteClient = new RemoteStorageClient(serverUrl, serverApiKey || '');
      this.startSyncLoop();
      console.log(`💾 Hybrid storage: Local + Remote (${serverUrl})`);
    } else {
      this.remoteClient = null;
      console.log('💾 Hybrid storage: Local only (no server configured)');
    }
  }

  /**
   * Start automatic sync loop
   */
  private startSyncLoop(): void {
    if (!this.remoteClient) return;

    this.syncInterval = setInterval(async () => {
      await this.syncPendingActivities();
    }, this.SYNC_INTERVAL);

    console.log('✓ Sync loop started (every 30 seconds)');
  }

  /**
   * Sync pending activities to server
   */
  private async syncPendingActivities(): Promise<void> {
    if (!this.remoteClient || this.syncQueue.length === 0) {
      return;
    }

    try {
      // Test connection
      const online = await this.remoteClient.healthCheck();

      if (online && !this.isOnline) {
        console.log('✓ Connection restored - starting sync');
      }

      this.isOnline = online;

      if (!online) {
        console.log(`⚠ Server offline - ${this.syncQueue.length} activities queued for sync`);
        return;
      }

      // Sync in batches
      const batch = this.syncQueue.splice(0, this.BATCH_SIZE);

      if (batch.length > 0) {
        await this.remoteClient.recordActivitiesBatch(batch);
        console.log(`✓ Synced ${batch.length} activities to server (${this.syncQueue.length} remaining)`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      this.isOnline = false;
      // Activities stay in queue for next sync attempt
    }
  }

  /**
   * Stop sync loop (cleanup)
   */
  public stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('✓ Sync loop stopped');
    }
  }

  // ============================================================================
  // IStorageClient Implementation - All methods save locally first
  // ============================================================================

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<string> {
    // Save to local database
    const userId = await this.localClient.createUser(user);

    // Try to sync to server
    if (this.remoteClient && this.isOnline) {
      try {
        await this.remoteClient.createUser(user);
        console.log(`✓ User synced to server: ${userId}`);
      } catch (error) {
        console.error('Failed to sync user to server:', error);
      }
    }

    return userId;
  }

  async getUser(userId: string): Promise<User | null> {
    // Always read from local database
    return this.localClient.getUser(userId);
  }

  async getAllUsers(): Promise<User[]> {
    // Always read from local database
    return this.localClient.getAllUsers();
  }

  async recordActivity(activity: ActivityRecord): Promise<void> {
    // ALWAYS save to local database
    await this.localClient.recordActivity(activity);

    // Add to sync queue for remote server
    if (this.remoteClient) {
      this.syncQueue.push(activity);

      // If queue is large, sync immediately
      if (this.syncQueue.length >= this.BATCH_SIZE) {
        await this.syncPendingActivities();
      }
    }
  }

  async recordActivitiesBatch(activities: ActivityRecord[]): Promise<void> {
    // ALWAYS save to local database
    await this.localClient.recordActivitiesBatch(activities);

    // Add to sync queue for remote server
    if (this.remoteClient) {
      this.syncQueue.push(...activities);

      // If queue is large, sync immediately
      if (this.syncQueue.length >= this.BATCH_SIZE) {
        await this.syncPendingActivities();
      }
    }
  }

  async getActivities(userId: string, start?: number, end?: number, limit?: number): Promise<ActivityRecord[]> {
    // Always read from local database
    return this.localClient.getActivities(userId, start, end, limit);
  }

  async getWeeklyMetrics(userId: string, weekStart: number, weekEnd: number): Promise<ProductivityMetrics> {
    // Always read from local database (most up-to-date)
    return this.localClient.getWeeklyMetrics(userId, weekStart, weekEnd);
  }

  async getAppUsage(userId: string, weekStart: number, weekEnd: number): Promise<AppUsage[]> {
    // Always read from local database
    return this.localClient.getAppUsage(userId, weekStart, weekEnd);
  }

  async getBrowserActivity(userId: string, weekStart: number, weekEnd: number): Promise<any[]> {
    // Always read from local database
    return this.localClient.getBrowserActivity(userId, weekStart, weekEnd);
  }

  async generateWeeklyReport(userId: string, weekStart: number, weekEnd: number): Promise<WeeklyReport> {
    // Always read from local database
    return this.localClient.generateWeeklyReport(userId, weekStart, weekEnd);
  }

  async getTeamMetrics(teamName: string, weekStart: number, weekEnd: number): Promise<any> {
    // Always read from local database
    return this.localClient.getTeamMetrics(teamName, weekStart, weekEnd);
  }

  async healthCheck(): Promise<boolean> {
    // Local is always healthy
    const localHealthy = await this.localClient.healthCheck();

    if (!this.remoteClient) {
      return localHealthy;
    }

    // Check remote health
    try {
      const remoteHealthy = await this.remoteClient.healthCheck();
      this.isOnline = remoteHealthy;
      return localHealthy && remoteHealthy;
    } catch {
      this.isOnline = false;
      return localHealthy; // Local is still healthy
    }
  }

  /**
   * Get sync status
   */
  public getSyncStatus(): {
    isOnline: boolean;
    queuedActivities: number;
    remoteConfigured: boolean;
  } {
    return {
      isOnline: this.isOnline,
      queuedActivities: this.syncQueue.length,
      remoteConfigured: this.remoteClient !== null
    };
  }

  /**
   * Force immediate sync
   */
  public async forceSync(): Promise<void> {
    console.log('🔄 Force sync requested...');
    await this.syncPendingActivities();
  }
}
