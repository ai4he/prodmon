/**
 * Native Messaging Host for Browser Extension Communication
 * Enables Chrome/Edge/Firefox extensions to send activity data to Electron app
 */

import { DatabaseManager } from '../database/schema';
import { v4 as uuidv4 } from 'uuid';
import { ActivityCategory } from '../types';

export interface BrowserActivityRecord {
  userId: string;
  timestamp: number;
  url: string;
  title: string;
  domain: string | null;
  category: string;
  sessionDuration: number;
  keystrokeCount: number;
  scrollCount: number;
  clickCount: number;
  isIdle: boolean;
  mediaPlaying: boolean;
  mediaSource: string | null;
  favIconUrl: string | null;
}

export class NativeMessagingHost {
  private db: DatabaseManager;
  private inputBuffer: Buffer = Buffer.alloc(0);

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  start() {
    console.error('Native messaging host started');

    // Read messages from stdin
    process.stdin.on('readable', () => {
      this.readMessage();
    });

    process.stdin.on('end', () => {
      console.error('Native messaging host ended');
      process.exit(0);
    });
  }

  private readMessage() {
    let chunk: Buffer | null;

    while ((chunk = process.stdin.read()) !== null) {
      this.inputBuffer = Buffer.concat([this.inputBuffer, chunk]);

      // Process complete messages
      while (this.inputBuffer.length >= 4) {
        const messageLength = this.inputBuffer.readUInt32LE(0);

        if (this.inputBuffer.length >= 4 + messageLength) {
          const messageBytes = this.inputBuffer.slice(4, 4 + messageLength);
          const message = JSON.parse(messageBytes.toString('utf8'));

          this.handleMessage(message);

          this.inputBuffer = this.inputBuffer.slice(4 + messageLength);
        } else {
          break;
        }
      }
    }
  }

  private handleMessage(message: any) {
    console.error('Received message from browser:', message.type);

    if (message.type === 'browser_activity') {
      this.saveBrowserActivity(message.data);
      this.sendResponse({ success: true, saved: true });
    } else if (message.type === 'ping') {
      this.sendResponse({ pong: true, version: '1.0.0' });
    } else if (message.type === 'get_config') {
      // Send userId to extension - read from config file
      const config = this.readConfig();

      this.sendResponse({
        success: true,
        userId: config?.userId || null,
        userName: config?.userName || 'Default User'
      });
    } else {
      this.sendResponse({ error: 'Unknown message type' });
    }
  }

  private readConfig(): any {
    try {
      const { homedir } = require('os');
      const { readFileSync, existsSync } = require('fs');
      const { join } = require('path');

      // electron-store stores data in different locations per platform
      const platform = process.platform;
      let configPath: string;

      if (platform === 'darwin') {
        configPath = join(homedir(), 'Library', 'Application Support', 'prodmon', 'config.json');
      } else if (platform === 'win32') {
        configPath = join(homedir(), 'AppData', 'Roaming', 'prodmon', 'config.json');
      } else {
        configPath = join(homedir(), '.config', 'prodmon', 'config.json');
      }

      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf8');
        const data = JSON.parse(content);
        return data.config; // electron-store wraps config in a 'config' key
      }

      return null;
    } catch (error) {
      console.error('Error reading config:', error);
      return null;
    }
  }

  private saveBrowserActivity(data: BrowserActivityRecord) {
    try {
      const database = this.db.getDb();

      // Map browser category to our ActivityCategory enum
      const category = this.mapCategory(data.category);

      // Insert browser activity record
      database.run(
        `INSERT INTO activity_records (
          id, user_id, timestamp, app_name, window_title, url, category,
          keystrokes_count, mouse_movements, is_idle, media_playing, media_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          data.userId,
          data.timestamp,
          `Browser - ${data.domain || 'Unknown'}`,
          data.title,
          data.url,
          category,
          data.keystrokeCount,
          data.scrollCount + data.clickCount, // Combine scroll and click as mouse movements
          data.isIdle ? 1 : 0,
          data.mediaPlaying ? 1 : 0,
          data.mediaSource
        ]
      );

      this.db.save();

      console.error(`Saved browser activity: ${data.domain} - ${category}`);
    } catch (error) {
      console.error('Error saving browser activity:', error);
    }
  }

  private mapCategory(browserCategory: string): ActivityCategory {
    switch (browserCategory) {
      case 'deep':
        return ActivityCategory.DEEP;
      case 'shallow':
        return ActivityCategory.SHALLOW;
      case 'distracted':
        return ActivityCategory.DISTRACTED;
      case 'admin':
        return ActivityCategory.ADMIN;
      default:
        return ActivityCategory.ADMIN;
    }
  }

  private sendResponse(response: any) {
    const message = JSON.stringify(response);
    const messageBuffer = Buffer.from(message, 'utf8');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(messageBuffer.length, 0);

    process.stdout.write(lengthBuffer);
    process.stdout.write(messageBuffer);
  }
}

// Export standalone function to run the host
export function runNativeMessagingHost(db: DatabaseManager) {
  const host = new NativeMessagingHost(db);
  host.start();
}
