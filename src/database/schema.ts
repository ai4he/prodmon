import initSqlJs, { Database } from 'sql.js';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';

export class DatabaseManager {
  private db: Database | null = null;
  private dbPath: string;
  private initialized: boolean = false;

  constructor(dbPath?: string) {
    if (dbPath) {
      this.dbPath = dbPath;
    } else {
      // Try to use Electron app path if available, otherwise use home directory
      try {
        const { app } = require('electron');
        this.dbPath = join(app.getPath('userData'), 'prodmon.db');
      } catch (error) {
        // Running outside Electron context (e.g., native messaging host)
        const platform = process.platform;
        let dataPath: string;

        if (platform === 'darwin') {
          dataPath = join(homedir(), 'Library', 'Application Support', 'prodmon');
        } else if (platform === 'win32') {
          dataPath = join(homedir(), 'AppData', 'Roaming', 'prodmon');
        } else {
          dataPath = join(homedir(), '.config', 'prodmon');
        }

        this.dbPath = join(dataPath, 'prodmon.db');
      }
    }
  }

  async initialize() {
    if (this.initialized) return;

    const SQL = await initSqlJs();

    // Ensure parent directory exists
    const { dirname } = require('path');
    const { mkdirSync } = require('fs');
    const dbDir = dirname(this.dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    // Load existing database or create new one
    if (existsSync(this.dbPath)) {
      const buffer = readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    this.createTables();
    this.initialized = true;
  }

  private createTables() {
    if (!this.db) return;

    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        title TEXT,
        team TEXT,
        department TEXT,
        manager_id TEXT,
        google_id TEXT UNIQUE,
        profile_picture TEXT,
        last_login INTEGER,
        created_at INTEGER NOT NULL
      )
    `);

    // Run migrations for existing tables
    this.runMigrations();

    // Activity records table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS activity_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        app_name TEXT NOT NULL,
        window_title TEXT,
        url TEXT,
        category TEXT NOT NULL,
        keystrokes_count INTEGER DEFAULT 0,
        mouse_movements INTEGER DEFAULT 0,
        is_idle INTEGER DEFAULT 0,
        media_playing INTEGER DEFAULT 0,
        media_source TEXT
      )
    `);

    // Productivity metrics table (weekly aggregates)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS productivity_metrics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        week_start INTEGER NOT NULL,
        week_end INTEGER NOT NULL,
        total_hours REAL NOT NULL,
        active_hours REAL NOT NULL,
        deep_work_hours REAL NOT NULL,
        shallow_work_hours REAL NOT NULL,
        admin_hours REAL NOT NULL,
        unproductive_hours REAL NOT NULL,
        idle_hours REAL NOT NULL,
        keystrokes_per_hour REAL NOT NULL,
        mouse_movements_per_hour REAL NOT NULL,
        context_switches_per_hour REAL NOT NULL,
        longest_focus_session REAL NOT NULL,
        average_session_length REAL NOT NULL,
        media_hours REAL NOT NULL,
        focus_score REAL NOT NULL,
        UNIQUE(user_id, week_start)
      )
    `);

    // App usage tracking
    this.db.run(`
      CREATE TABLE IF NOT EXISTS app_usage (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        week_start INTEGER NOT NULL,
        app_name TEXT NOT NULL,
        time_used REAL NOT NULL,
        category TEXT NOT NULL,
        keystrokes_count INTEGER DEFAULT 0,
        mouse_movements INTEGER DEFAULT 0,
        UNIQUE(user_id, week_start, app_name)
      )
    `);

    // Create indexes for performance
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_activity_user_timestamp ON activity_records(user_id, timestamp)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_activity_category ON activity_records(category)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_metrics_week ON productivity_metrics(week_start, week_end)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_users_team ON users(team)`);

    this.save();
  }

  private runMigrations() {
    if (!this.db) return;

    // Check if google_id column exists in users table
    try {
      const result = this.db.exec(`PRAGMA table_info(users)`);
      if (result.length > 0) {
        const columns = result[0].values.map(row => row[1]); // column name is at index 1

        // Add google_id if it doesn't exist (can't add UNIQUE with ALTER TABLE in SQLite)
        if (!columns.includes('google_id')) {
          console.log('Adding google_id column to users table...');
          this.db.run(`ALTER TABLE users ADD COLUMN google_id TEXT`);
          // Create unique index separately
          this.db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)`);
        }

        // Add profile_picture if it doesn't exist
        if (!columns.includes('profile_picture')) {
          console.log('Adding profile_picture column to users table...');
          this.db.run(`ALTER TABLE users ADD COLUMN profile_picture TEXT`);
        }

        // Add last_login if it doesn't exist
        if (!columns.includes('last_login')) {
          console.log('Adding last_login column to users table...');
          this.db.run(`ALTER TABLE users ADD COLUMN last_login INTEGER`);
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  }

  getDb(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  save() {
    if (!this.db) return;
    const data = this.db.export();
    writeFileSync(this.dbPath, data);
  }

  close() {
    this.save();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
