import 'dotenv/config';
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell } from 'electron';
import { join } from 'path';
import Store from 'electron-store';
import { ProductivityAgent } from './agent';
import { DatabaseManager } from './database/schema';
import { MetricsCalculator } from './analytics/metrics';
import { ReportGenerator } from './analytics/reports';
import { GeminiService } from './llm/gemini-service';
import { IStorageClient, StorageClientFactory } from './storage/storage-client';
import { Config, User } from './types';
import { startOfWeek, endOfWeek } from 'date-fns';
import { installNativeMessagingHost, installNativeMessagingHostForEdge } from './browser/install-native-host';
import { GoogleOAuthService } from './auth/google-oauth';
import { v4 as uuidv4 } from 'uuid';

class ProductivityMonkeyApp {
  private mainWindow: BrowserWindow | null = null;
  private authWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private store: Store;
  private db: DatabaseManager;
  private storage: IStorageClient | null = null;
  private agent: ProductivityAgent | null = null;
  private metricsCalc: MetricsCalculator;
  private reportGen: ReportGenerator;
  private llmService: GeminiService | null = null;
  private oauthService: GoogleOAuthService | null = null;

  constructor() {
    this.store = new Store();
    this.db = new DatabaseManager();
    this.metricsCalc = new MetricsCalculator(this.db);

    // Initialize LLM service
    const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyBJSX1VOTwdl1Eln4UYlXNDlfeyJviEXJk';
    this.llmService = new GeminiService(geminiApiKey);

    this.reportGen = new ReportGenerator(this.db, this.llmService);

    // Initialize OAuth service
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost';
    const jwtSecret = process.env.JWT_SECRET || 'electron-jwt-secret-change-in-production';

    if (googleClientId && googleClientSecret) {
      this.oauthService = new GoogleOAuthService(
        {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          redirectUri: googleRedirectUri
        },
        jwtSecret
      );
      console.log('✓ OAuth service initialized for Electron');
      console.log('  Redirect URI:', googleRedirectUri);
    } else {
      console.warn('⚠ OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    }

    this.setupIPC();
  }

  async init() {
    await app.whenReady();

    // Initialize database
    await this.db.initialize();

    this.createTray();

    // Auto-install native messaging manifests for all detected extensions
    await this.autoInstallNativeMessaging();

    // Check if user is authenticated
    const authToken = this.store.get('authToken') as string | undefined;
    let config = this.store.get('config') as Config | undefined;

    if (authToken && this.oauthService) {
      // Verify token is still valid
      const decoded = this.oauthService.verifyJWT(authToken);
      if (decoded && config) {
        // User is authenticated, start tracking
        console.log('✓ User authenticated:', decoded.email);
        this.startAgent(config);
        this.showDashboard();
        return;
      } else {
        // Token expired or invalid
        console.log('⚠ Auth token expired or invalid');
        this.store.delete('authToken');
        this.store.delete('config');
      }
    }

    // No valid authentication - show auth window
    if (this.oauthService) {
      this.showAuthWindow();
    } else {
      // OAuth not configured - fall back to auto-generation for development
      console.log('⚠ OAuth not configured, using local user');
      if (!config) {
        config = this.autoGenerateConfig();
        this.store.set('config', config);
      }
      this.startAgent(config);
      this.showDashboard();
    }
  }

  private autoGenerateConfig(): Config {
    const userId = `user-${Date.now()}`;
    const userName = 'Default User';

    // Save user to database
    const db = this.db.getDb();
    db.run(
      'INSERT INTO users (id, name, email, title, team, department, manager_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        userName,
        'user@local',
        'User',
        'Default Team',
        'Default Department',
        null,
        Date.now()
      ]
    );
    this.db.save();

    console.log('Auto-generated user config:', userId);

    return {
      userId,
      userName,
      userEmail: 'user@local',
      title: 'User',
      team: 'Default Team',
      department: 'Default Department',
      managerId: null,
      trackingInterval: 5000,
      idleThreshold: 5 * 60 * 1000
    };
  }

  private async autoInstallNativeMessaging() {
    const { existsSync, readdirSync } = require('fs');
    const { join } = require('path');
    const { homedir } = require('os');

    const platform = process.platform;
    let extensionDirs: string[] = [];

    // Find Chrome extensions
    if (platform === 'darwin') {
      const chromeExtPath = join(homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'Extensions');
      if (existsSync(chromeExtPath)) {
        extensionDirs.push(chromeExtPath);
      }
      const edgeExtPath = join(homedir(), 'Library', 'Application Support', 'Microsoft Edge', 'Default', 'Extensions');
      if (existsSync(edgeExtPath)) {
        extensionDirs.push(edgeExtPath);
      }
    } else if (platform === 'win32') {
      const chromeExtPath = join(homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Extensions');
      if (existsSync(chromeExtPath)) {
        extensionDirs.push(chromeExtPath);
      }
      const edgeExtPath = join(homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Extensions');
      if (existsSync(edgeExtPath)) {
        extensionDirs.push(edgeExtPath);
      }
    } else {
      const chromeExtPath = join(homedir(), '.config', 'google-chrome', 'Default', 'Extensions');
      if (existsSync(chromeExtPath)) {
        extensionDirs.push(chromeExtPath);
      }
    }

    // Look for our extension by searching for manifest with our name
    const extensionIds: string[] = [];

    for (const extDir of extensionDirs) {
      try {
        const dirs = readdirSync(extDir);
        for (const id of dirs) {
          const versionDir = join(extDir, id);
          const versions = readdirSync(versionDir);
          if (versions.length > 0) {
            const manifestPath = join(versionDir, versions[0], 'manifest.json');
            if (existsSync(manifestPath)) {
              const { readFileSync } = require('fs');
              const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
              if (manifest.name && manifest.name.includes('Productivity Monkey')) {
                extensionIds.push(id);
                console.log('Found Productivity Monkey extension:', id);
              }
            }
          }
        }
      } catch (error) {
        // Ignore errors reading extension directories
      }
    }

    // Install native messaging for all found extension IDs
    if (extensionIds.length > 0) {
      for (const extensionId of extensionIds) {
        try {
          installNativeMessagingHost(extensionId);
          installNativeMessagingHostForEdge(extensionId);
          console.log('Auto-installed native messaging for extension:', extensionId);
        } catch (error) {
          console.error('Error auto-installing native messaging:', error);
        }
      }
    } else {
      console.log('No Productivity Monkey extension found - will need manual setup');
    }
  }

  private createTray() {
    // Create a simple but visible tray icon using canvas
    const icon = this.createTrayIcon();
    this.tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Dashboard', click: () => this.showDashboard() },
      { label: 'View Reports', click: () => this.showReports() },
      { type: 'separator' },
      {
        label: 'Tracking',
        submenu: [
          { label: 'Start', click: () => this.startTracking() },
          { label: 'Stop', click: () => this.stopTracking() }
        ]
      },
      { type: 'separator' },
      { label: 'Browser Extension Setup', click: () => this.showBrowserExtensionSetup() },
      { label: 'Settings', click: () => this.showSettings() },
      { label: 'Sign Out', click: () => this.signOut() },
      { label: 'Quit', click: () => app.quit() }
    ]);

    this.tray.setToolTip('Productivity Monkey');
    this.tray.setContextMenu(contextMenu);
  }

  private createTrayIcon(): Electron.NativeImage {
    // Create a simple 16x16 black square icon that will be visible in menu bar
    // This is a minimal PNG that Electron can render
    const size = 16;

    // Create a minimal visible icon: a simple filled circle/dot
    // PNG data for a 16x16 black circle (base64 encoded)
    const iconData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAD/SURBVDiNpdMxSgNBFAbgb2Y3u4lBUhiw8ABewMZGTyCpvIAXELyAYCsIXkC8gHgCwU4QrLSwsBEbs5vdmfG/wU0IapPAD6955r0/w/AGfuEBL3jFHfZRYYgKh7jGE17xgCO0+I0D3OIFz3jEMTrsYxdH2MItnnGJBn06DLjEDZ5wgRYddriMeVziAjVG9OlxjGs84wIteuzgOOZRiwG/6HGKW7zgAi169DjBXcw1avy/HidxrlE3yNFfJgftYBbzxTWKpkGOfjWYRd3E3J0wbYMc/V+DWezF3J0wfYMc/b8Gs9iP+fsa5OgnZ45OmL5Bjn4SM53bYCrQJ5vT0lTfSQoGAAAAAElFTkSuQmCC',
      'base64'
    );

    const icon = nativeImage.createFromBuffer(iconData);

    // For Retina displays, mark it as template image for proper rendering
    icon.setTemplateImage(true);

    return icon;
  }

  private showAuthWindow() {
    if (this.authWindow) {
      this.authWindow.focus();
      return;
    }

    this.authWindow = new BrowserWindow({
      width: 500,
      height: 700,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      title: 'Sign In - Productivity Monkey'
    });

    this.authWindow.loadFile(join(__dirname, '../ui/auth.html'));

    this.authWindow.on('closed', () => {
      this.authWindow = null;
    });
  }

  private showSetupWindow() {
    this.mainWindow = new BrowserWindow({
      width: 600,
      height: 700,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    this.mainWindow.loadFile(join(__dirname, '../ui/setup.html'));
  }

  private showDashboard() {
    if (this.mainWindow) {
      this.mainWindow.focus();
      return;
    }

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    this.mainWindow.loadFile(join(__dirname, '../ui/dashboard.html'));

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private showReports() {
    const reportsWindow = new BrowserWindow({
      width: 1000,
      height: 900,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    reportsWindow.loadFile(join(__dirname, '../ui/reports.html'));
  }

  private showSettings() {
    const settingsWindow = new BrowserWindow({
      width: 600,
      height: 500,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    settingsWindow.loadFile(join(__dirname, '../ui/settings.html'));
  }

  private async showBrowserExtensionSetup() {
    const result = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Install for Chrome/Edge', 'Get Extension ID', 'Cancel'],
      defaultId: 0,
      title: 'Browser Extension Setup',
      message: 'Setup Native Messaging for Browser Extension',
      detail: 'To track browser activity, you need to:\n\n1. Install the browser extension from browser-extension/chrome\n2. Get the extension ID\n3. Install native messaging host\n\nWhat would you like to do?'
    });

    if (result.response === 0) {
      // Create a simple window to get extension ID
      const inputWindow = new BrowserWindow({
        width: 500,
        height: 250,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      });

      inputWindow.loadURL(`data:text/html,
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 30px; }
            input { width: 100%; padding: 10px; font-size: 14px; margin: 10px 0; }
            button { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; }
            button:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <h2>Enter Browser Extension ID</h2>
          <p>Find your extension ID in chrome://extensions (Developer mode enabled)</p>
          <input type="text" id="extensionId" placeholder="abcdefghijklmnopqrstuvwxyz123456" />
          <br><br>
          <button onclick="install()">Install</button>
          <button onclick="cancel()">Cancel</button>
          <script>
            const { ipcRenderer } = require('electron');
            function install() {
              const id = document.getElementById('extensionId').value;
              if (id) {
                ipcRenderer.send('install-native-host', id);
                window.close();
              } else {
                alert('Please enter an extension ID');
              }
            }
            function cancel() {
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    } else if (result.response === 1) {
      dialog.showMessageBox({
        type: 'info',
        title: 'How to Find Extension ID',
        message: 'Finding Your Extension ID',
        detail: '1. Open Chrome/Edge\n2. Go to chrome://extensions or edge://extensions\n3. Enable "Developer mode"\n4. Find the Productivity Monkey extension\n5. Copy the ID shown below the extension name\n\nExample: abcdefghijklmnopqrstuvwxyz123456'
      });
    }
  }

  private startAgent(config: Config) {
    if (this.agent) {
      console.log('Agent already running');
      return;
    }

    // Initialize storage client based on config
    this.storage = StorageClientFactory.create(
      {
        serverUrl: config.serverUrl,
        serverApiKey: config.serverApiKey
      },
      this.db,
      this.llmService || undefined
    );

    // Get Gemini API key from environment or config
    const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyBJSX1VOTwdl1Eln4UYlXNDlfeyJviEXJk';

    this.agent = new ProductivityAgent(config, this.db, geminiApiKey);
    this.agent.start();

    // Calculate metrics periodically (every hour)
    setInterval(() => {
      this.calculateAndSaveMetrics(config.userId);
    }, 60 * 60 * 1000);
  }

  private startTracking() {
    const config = this.store.get('config') as Config;
    if (config && !this.agent) {
      this.startAgent(config);
    }
  }

  private stopTracking() {
    if (this.agent) {
      this.agent.stop();
      this.agent = null;
    }
  }

  private signOut() {
    // Stop tracking
    if (this.agent) {
      this.agent.stop();
      this.agent = null;
    }

    // Clear stored data
    this.store.delete('authToken');
    this.store.delete('config');

    // Close main window
    if (this.mainWindow) {
      this.mainWindow.close();
      this.mainWindow = null;
    }

    // Show auth window
    if (this.oauthService) {
      this.showAuthWindow();
    } else {
      dialog.showMessageBox({
        type: 'info',
        title: 'Signed Out',
        message: 'You have been signed out. Please restart the application to sign in again.'
      });
      app.quit();
    }
  }

  private calculateAndSaveMetrics(userId: string) {
    const now = Date.now();
    const weekStart = startOfWeek(now).getTime();
    const weekEnd = endOfWeek(now).getTime();

    const metrics = this.metricsCalc.calculateWeeklyMetrics(userId, weekStart, weekEnd);
    this.metricsCalc.saveMetrics(metrics);

    console.log('Metrics calculated and saved:', metrics.focusScore);
  }

  private setupIPC() {
    // ============================================================================
    // AUTHENTICATION HANDLERS
    // ============================================================================

    // Get Google OAuth URL
    ipcMain.handle('get-google-oauth-url', async () => {
      if (!this.oauthService) {
        throw new Error('OAuth service not initialized');
      }
      return this.oauthService.getAuthorizationUrl();
    });

    // Handle Google OAuth (opens browser window)
    ipcMain.handle('sign-in-with-google', async () => {
      if (!this.oauthService) {
        throw new Error('OAuth service not initialized');
      }

      try {
        const authUrl = this.oauthService.getAuthorizationUrl();
        console.log('🔐 Starting OAuth flow...');
        console.log('  Auth URL:', authUrl);

        // Create a new window for OAuth
        const oauthWindow = new BrowserWindow({
          width: 500,
          height: 700,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          },
          title: 'Sign in with Google'
        });

        oauthWindow.loadURL(authUrl);

        return new Promise((resolve, reject) => {
          let authCodeReceived = false;

          // Listen for redirect with code (before navigation)
          oauthWindow.webContents.on('will-redirect', async (event, url) => {
            console.log('🔄 OAuth will-redirect:', url);

            if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
              event.preventDefault();
              authCodeReceived = true;

              const urlObj = new URL(url);
              const code = urlObj.searchParams.get('code');
              const error = urlObj.searchParams.get('error');

              console.log('  Code received:', code ? 'Yes' : 'No');
              console.log('  Error:', error || 'None');

              oauthWindow.close();

              if (error) {
                reject(new Error(error));
                return;
              }

              if (!code) {
                reject(new Error('No authorization code received'));
                return;
              }

              try {
                // Exchange code for tokens
                const tokens = await this.oauthService!.getTokensFromCode(code);

                if (!tokens.id_token) {
                  reject(new Error('No ID token received'));
                  return;
                }

                // Get user info from ID token
                const googleUser = await this.oauthService!.verifyIdToken(tokens.id_token);

                let userId: string;
                let userFromServer: any = null;

                // If server is configured, check if user exists on server first
                if (process.env.SERVER_URL) {
                  try {
                    console.log('🔍 Checking for existing user on server...');
                    const response = await fetch(`${process.env.SERVER_URL}/api/users`);
                    if (response.ok) {
                      const data = await response.json() as any;
                      // Find user by email
                      userFromServer = data.users?.find((u: any) => u.email === googleUser.email);
                      if (userFromServer) {
                        userId = userFromServer.id;
                        console.log('✓ Found existing user on server:', userId);
                      } else {
                        // User doesn't exist on server - create them
                        console.log('🔨 Creating new user on server...');
                        const createResponse = await fetch(`${process.env.SERVER_URL}/api/users`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: googleUser.name,
                            email: googleUser.email,
                            title: 'User',
                            team: 'Default Team',
                            department: 'Default Department'
                          })
                        });
                        if (createResponse.ok) {
                          const createData = await createResponse.json() as any;
                          userId = createData.userId;
                          console.log('✓ Created user on server:', userId);
                        }
                      }
                    }
                  } catch (error) {
                    console.log('⚠ Could not check server for user, will create locally');
                  }
                }

                // Check local database
                const database = this.db.getDb();
                let stmt = database.prepare('SELECT * FROM users WHERE email = ?');
                stmt.bind([googleUser.email]);

                let localUser: any = null;
                if (stmt.step()) {
                  localUser = stmt.getAsObject();
                }
                stmt.free();

                // Use server user ID if found, otherwise use local or create new
                if (!userId!) {
                  userId = localUser?.id || uuidv4();
                }

                // Update or create local user with the consistent user ID
                if (localUser) {
                  // Update existing local user (keep same ID or update to server ID)
                  if (localUser.id !== userId) {
                    // Need to update the user ID to match server
                    database.run(`DELETE FROM users WHERE id = ?`, [localUser.id]);
                  }
                  const insertStmt = database.prepare(
                    `INSERT OR REPLACE INTO users (id, name, email, title, team, department, manager_id, google_id, profile_picture, last_login, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                  );
                  insertStmt.run([
                    userId,
                    googleUser.name,
                    googleUser.email,
                    userFromServer?.title || localUser.title || 'User',
                    userFromServer?.team || localUser.team || 'Default Team',
                    userFromServer?.department || localUser.department || 'Default Department',
                    userFromServer?.managerId || localUser.manager_id || null,
                    googleUser.id,
                    googleUser.picture,
                    Date.now(),
                    localUser.created_at || Date.now()
                  ]);
                  insertStmt.free();
                } else {
                  // Create new local user with server's user ID (if available)
                  const insertStmt = database.prepare(
                    `INSERT INTO users (id, name, email, title, team, department, manager_id, google_id, profile_picture, last_login, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                  );
                  insertStmt.run([
                    userId,
                    googleUser.name,
                    googleUser.email,
                    userFromServer?.title || 'User',
                    userFromServer?.team || 'Default Team',
                    userFromServer?.department || 'Default Department',
                    userFromServer?.managerId || null,
                    googleUser.id,
                    googleUser.picture,
                    Date.now(),
                    Date.now()
                  ]);
                  insertStmt.free();
                }

                this.db.save();
                console.log('✓ Local user synced with ID:', userId);

                // Generate JWT
                const token = this.oauthService!.generateJWT(userId, googleUser.email);

                // Store auth token
                this.store.set('authToken', token);

                // Create config with server sync
                const config: Config = {
                  userId,
                  userName: googleUser.name,
                  userEmail: googleUser.email,
                  title: userFromServer?.title || localUser?.title || 'User',
                  team: userFromServer?.team || localUser?.team || 'Default Team',
                  department: userFromServer?.department || localUser?.department || 'Default Department',
                  managerId: userFromServer?.managerId || localUser?.manager_id || null,
                  trackingInterval: 5000,
                  idleThreshold: 5 * 60 * 1000,
                  serverUrl: process.env.SERVER_URL,
                  serverApiKey: process.env.SERVER_API_KEY
                };

                this.store.set('config', config);

                // Start tracking
                this.startAgent(config);

                resolve({
                  success: true,
                  user: {
                    id: userId,
                    name: googleUser.name,
                    email: googleUser.email,
                    picture: googleUser.picture
                  }
                });
              } catch (error: any) {
                reject(error);
              }
            }
          });

          // Also listen for navigation (after redirect)
          oauthWindow.webContents.on('did-navigate', async (event, url) => {
            console.log('🔄 OAuth did-navigate:', url);

            if ((url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) && !authCodeReceived) {
              authCodeReceived = true;

              const urlObj = new URL(url);
              const code = urlObj.searchParams.get('code');
              const error = urlObj.searchParams.get('error');

              console.log('  Code received (did-navigate):', code ? 'Yes' : 'No');
              console.log('  Error:', error || 'None');

              oauthWindow.close();

              if (error) {
                reject(new Error(error));
                return;
              }

              if (!code) {
                reject(new Error('No authorization code received'));
                return;
              }

              try {
                // Exchange code for tokens
                const tokens = await this.oauthService!.getTokensFromCode(code);

                if (!tokens.id_token) {
                  reject(new Error('No ID token received'));
                  return;
                }

                // Get user info from ID token
                const googleUser = await this.oauthService!.verifyIdToken(tokens.id_token);

                let userId: string;
                let userFromServer: any = null;

                // If server is configured, check if user exists on server first
                if (process.env.SERVER_URL) {
                  try {
                    console.log('🔍 Checking for existing user on server...');
                    const response = await fetch(`${process.env.SERVER_URL}/api/users`);
                    if (response.ok) {
                      const data = await response.json() as any;
                      // Find user by email
                      userFromServer = data.users?.find((u: any) => u.email === googleUser.email);
                      if (userFromServer) {
                        userId = userFromServer.id;
                        console.log('✓ Found existing user on server:', userId);
                      } else {
                        // User doesn't exist on server - create them
                        console.log('🔨 Creating new user on server...');
                        const createResponse = await fetch(`${process.env.SERVER_URL}/api/users`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: googleUser.name,
                            email: googleUser.email,
                            title: 'User',
                            team: 'Default Team',
                            department: 'Default Department'
                          })
                        });
                        if (createResponse.ok) {
                          const createData = await createResponse.json() as any;
                          userId = createData.userId;
                          console.log('✓ Created user on server:', userId);
                        }
                      }
                    }
                  } catch (error) {
                    console.log('⚠ Could not check server for user, will create locally');
                  }
                }

                // Check local database
                const database = this.db.getDb();
                let stmt = database.prepare('SELECT * FROM users WHERE email = ?');
                stmt.bind([googleUser.email]);

                let localUser: any = null;
                if (stmt.step()) {
                  localUser = stmt.getAsObject();
                }
                stmt.free();

                // Use server user ID if found, otherwise use local or create new
                if (!userId!) {
                  userId = localUser?.id || uuidv4();
                }

                // Update or create local user with the consistent user ID
                if (localUser) {
                  // Update existing local user (keep same ID or update to server ID)
                  if (localUser.id !== userId) {
                    // Need to update the user ID to match server
                    database.run(`DELETE FROM users WHERE id = ?`, [localUser.id]);
                  }
                  const insertStmt = database.prepare(
                    `INSERT OR REPLACE INTO users (id, name, email, title, team, department, manager_id, google_id, profile_picture, last_login, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                  );
                  insertStmt.run([
                    userId,
                    googleUser.name,
                    googleUser.email,
                    userFromServer?.title || localUser.title || 'User',
                    userFromServer?.team || localUser.team || 'Default Team',
                    userFromServer?.department || localUser.department || 'Default Department',
                    userFromServer?.managerId || localUser.manager_id || null,
                    googleUser.id,
                    googleUser.picture,
                    Date.now(),
                    localUser.created_at || Date.now()
                  ]);
                  insertStmt.free();
                } else {
                  // Create new local user with server's user ID (if available)
                  const insertStmt = database.prepare(
                    `INSERT INTO users (id, name, email, title, team, department, manager_id, google_id, profile_picture, last_login, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                  );
                  insertStmt.run([
                    userId,
                    googleUser.name,
                    googleUser.email,
                    userFromServer?.title || 'User',
                    userFromServer?.team || 'Default Team',
                    userFromServer?.department || 'Default Department',
                    userFromServer?.managerId || null,
                    googleUser.id,
                    googleUser.picture,
                    Date.now(),
                    Date.now()
                  ]);
                  insertStmt.free();
                }

                this.db.save();
                console.log('✓ Local user synced with ID:', userId);

                // Generate JWT
                const token = this.oauthService!.generateJWT(userId, googleUser.email);

                // Store auth token
                this.store.set('authToken', token);

                // Create config with server sync
                const config: Config = {
                  userId,
                  userName: googleUser.name,
                  userEmail: googleUser.email,
                  title: userFromServer?.title || localUser?.title || 'User',
                  team: userFromServer?.team || localUser?.team || 'Default Team',
                  department: userFromServer?.department || localUser?.department || 'Default Department',
                  managerId: userFromServer?.managerId || localUser?.manager_id || null,
                  trackingInterval: 5000,
                  idleThreshold: 5 * 60 * 1000,
                  serverUrl: process.env.SERVER_URL,
                  serverApiKey: process.env.SERVER_API_KEY
                };

                this.store.set('config', config);

                // Start tracking
                this.startAgent(config);

                resolve({
                  success: true,
                  user: {
                    id: userId,
                    name: googleUser.name,
                    email: googleUser.email,
                    picture: googleUser.picture
                  }
                });
              } catch (error: any) {
                reject(error);
              }
            }
          });

          oauthWindow.on('closed', () => {
            if (!authCodeReceived) {
              console.log('❌ OAuth window closed without receiving auth code');
              reject(new Error('OAuth window closed before receiving authorization code. Please try again.'));
            }
          });
        });
      } catch (error: any) {
        console.error('OAuth error:', error);
        throw error;
      }
    });

    // Sign out
    ipcMain.handle('sign-out', async () => {
      // Stop tracking
      if (this.agent) {
        this.agent.stop();
        this.agent = null;
      }

      // Clear stored data
      this.store.delete('authToken');
      this.store.delete('config');

      // Close main window
      if (this.mainWindow) {
        this.mainWindow.close();
        this.mainWindow = null;
      }

      // Show auth window
      this.showAuthWindow();

      return { success: true };
    });

    // Setup user configuration
    ipcMain.handle('setup-user', async (_event, userData: {
      name: string;
      email: string;
      title: string;
      team: string;
      department: string;
      managerId?: string;
    }) => {
      const userId = `user-${Date.now()}`;

      // Save user to database
      const db = this.db.getDb();
      db.run(
        'INSERT INTO users (id, name, email, title, team, department, manager_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          userId,
          userData.name,
          userData.email,
          userData.title,
          userData.team,
          userData.department,
          userData.managerId || null,
          Date.now()
        ]
      );
      this.db.save();

      // Save config
      const config: Config = {
        userId,
        userName: userData.name,
        userEmail: userData.email,
        title: userData.title,
        team: userData.team,
        department: userData.department,
        managerId: userData.managerId || null,
        trackingInterval: 5000, // 5 seconds
        idleThreshold: 5 * 60 * 1000 // 5 minutes
      };

      this.store.set('config', config);

      // Start agent
      this.startAgent(config);

      return { success: true };
    });

    // Get dashboard data
    ipcMain.handle('get-dashboard-data', async () => {
      const config = this.store.get('config') as Config;
      if (!config) {
        return null;
      }

      const now = Date.now();
      const weekStart = startOfWeek(now).getTime();
      const weekEnd = endOfWeek(now).getTime();

      const metrics = this.metricsCalc.calculateWeeklyMetrics(config.userId, weekStart, weekEnd);
      const appUsage = this.metricsCalc.calculateAppUsage(config.userId, weekStart, weekEnd);
      const browserActivity = this.metricsCalc.getBrowserActivity(config.userId, weekStart, weekEnd);

      return {
        metrics,
        appUsage,
        browserActivity,
        user: {
          name: config.userName,
          title: config.title,
          team: config.team
        }
      };
    });

    // Get weekly report (now async for LLM integration)
    ipcMain.handle('get-weekly-report', async (_event, userId?: string) => {
      const config = this.store.get('config') as Config;
      const targetUserId = userId || config.userId;

      const now = Date.now();
      const weekStart = startOfWeek(now).getTime();
      const weekEnd = endOfWeek(now).getTime();

      const report = await this.reportGen.generateWeeklyReport(targetUserId, weekStart, weekEnd);
      return report;
    });

    // Get LLM quota status
    ipcMain.handle('get-llm-status', async () => {
      if (!this.llmService) {
        return { enabled: false, message: 'LLM service not initialized' };
      }

      const quota = this.llmService.getQuotaStatus();
      return {
        enabled: true,
        quota: {
          used: quota.used,
          limit: quota.limit,
          remaining: quota.limit - quota.used,
          resetDate: 'Daily at midnight',
          failureCount: quota.failureCount
        },
        available: quota.available
      };
    });

    // Get team leaderboard
    ipcMain.handle('get-team-leaderboard', async () => {
      const config = this.store.get('config') as Config;

      const db = this.db.getDb();
      const stmt = db.prepare(
        'SELECT u.id, u.name, u.title, pm.focus_score, pm.deep_work_hours FROM users u LEFT JOIN productivity_metrics pm ON u.id = pm.user_id WHERE u.team = ? ORDER BY pm.focus_score DESC'
      );
      stmt.bind([config.team]);

      const teamMembers: any[] = [];
      while (stmt.step()) {
        teamMembers.push(stmt.getAsObject());
      }
      stmt.free();

      return teamMembers;
    });

    // Install native messaging host
    ipcMain.on('install-native-host', (event, extensionId: string) => {
      try {
        installNativeMessagingHost(extensionId);
        installNativeMessagingHostForEdge(extensionId);

        dialog.showMessageBox({
          type: 'info',
          title: 'Success',
          message: 'Native messaging host installed successfully!',
          detail: 'Installed for both Chrome and Edge browsers.\n\nYou can now use the browser extension to track activity.'
        });
      } catch (error: any) {
        dialog.showErrorBox('Installation Error', error.message);
      }
    });

    // Export report
    ipcMain.handle('export-report', async (_event, userId: string, format: 'text' | 'json') => {
      const config = this.store.get('config') as Config;
      const effectiveUserId = userId || config?.userId;

      if (!effectiveUserId) {
        throw new Error('No user ID available');
      }

      const now = Date.now();
      const weekStart = startOfWeek(now).getTime();
      const weekEnd = endOfWeek(now).getTime();

      const report = await this.reportGen.generateWeeklyReport(effectiveUserId, weekStart, weekEnd);

      if (format === 'text') {
        return this.reportGen.formatReportAsText(report);
      } else {
        return JSON.stringify(report, null, 2);
      }
    });

    // Run diagnostics
    ipcMain.handle('run-diagnostics', async () => {
      return this.runDiagnostics();
    });

    // Get sync status (for debugging)
    ipcMain.handle('get-sync-status', async () => {
      if (this.storage && 'getSyncStatus' in this.storage) {
        return (this.storage as any).getSyncStatus();
      }
      return { error: 'Sync status not available' };
    });
  }

  private runDiagnostics() {
    const diagnostics: any = {
      desktopTracking: { status: 'error', message: 'Not running' },
      database: { status: 'error', totalRecords: 0, recentRecords: 0 },
      browserActivity: { status: 'error', count: 0, recentCount: 0 },
      nativeMessaging: {
        chrome: { status: 'error', message: 'Not installed', extensionId: null },
        edge: { status: 'error', message: 'Not installed' }
      }
    };

    // Check desktop tracking
    if (this.agent) {
      diagnostics.desktopTracking = { status: 'ok', message: 'Running' };
    } else {
      diagnostics.desktopTracking = { status: 'warning', message: 'Tracking is stopped' };
    }

    // Check database
    try {
      const db = this.db.getDb();

      const totalStmt = db.prepare('SELECT COUNT(*) as count FROM activity_records');
      totalStmt.step();
      const totalCount = totalStmt.getAsObject().count as number;
      totalStmt.free();

      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const recentStmt = db.prepare('SELECT COUNT(*) as count FROM activity_records WHERE timestamp > ?');
      recentStmt.bind([oneHourAgo]);
      recentStmt.step();
      const recentCount = recentStmt.getAsObject().count as number;
      recentStmt.free();

      diagnostics.database = {
        status: totalCount > 0 ? 'ok' : 'warning',
        totalRecords: totalCount,
        recentRecords: recentCount
      };

      // Check browser activity
      const browserStmt = db.prepare("SELECT COUNT(*) as count FROM activity_records WHERE app_name LIKE 'Browser -%'");
      browserStmt.step();
      const browserCount = browserStmt.getAsObject().count as number;
      browserStmt.free();

      const browserRecentStmt = db.prepare("SELECT COUNT(*) as count FROM activity_records WHERE app_name LIKE 'Browser -%' AND timestamp > ?");
      browserRecentStmt.bind([oneHourAgo]);
      browserRecentStmt.step();
      const browserRecentCount = browserRecentStmt.getAsObject().count as number;
      browserRecentStmt.free();

      diagnostics.browserActivity = {
        status: browserCount > 0 ? 'ok' : 'warning',
        count: browserCount,
        recentCount: browserRecentCount
      };

      if (browserCount === 0) {
        diagnostics.browserActivity.status = 'error';
      }
    } catch (error) {
      console.error('Error checking database:', error);
    }

    // Check native messaging manifests
    const { existsSync } = require('fs');
    const { join } = require('path');
    const { homedir } = require('os');

    const platform = process.platform;

    // Chrome manifest
    let chromeManifestPath: string;
    if (platform === 'darwin') {
      chromeManifestPath = join(homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts', 'com.prodmon.app.json');
    } else if (platform === 'win32') {
      chromeManifestPath = join(homedir(), 'AppData', 'Local', 'Productivity Monkey', 'NativeMessagingHost', 'com.prodmon.app.json');
    } else {
      chromeManifestPath = join(homedir(), '.config', 'google-chrome', 'NativeMessagingHosts', 'com.prodmon.app.json');
    }

    if (existsSync(chromeManifestPath)) {
      try {
        const { readFileSync } = require('fs');
        const manifest = JSON.parse(readFileSync(chromeManifestPath, 'utf8'));
        const extensionId = manifest.allowed_origins?.[0]?.replace('chrome-extension://', '').replace('/', '') || null;

        diagnostics.nativeMessaging.chrome = {
          status: 'ok',
          message: `Installed at ${chromeManifestPath}`,
          extensionId
        };
      } catch (error) {
        diagnostics.nativeMessaging.chrome = {
          status: 'warning',
          message: `Found but could not read: ${chromeManifestPath}`,
          extensionId: null
        };
      }
    } else {
      diagnostics.nativeMessaging.chrome = {
        status: 'error',
        message: 'Not installed. Use "Browser Extension Setup" from tray menu',
        extensionId: null
      };
    }

    // Edge manifest
    let edgeManifestPath: string;
    if (platform === 'darwin') {
      edgeManifestPath = join(homedir(), 'Library', 'Application Support', 'Microsoft Edge', 'NativeMessagingHosts', 'com.prodmon.app.json');
    } else if (platform === 'win32') {
      edgeManifestPath = join(homedir(), 'AppData', 'Local', 'Productivity Monkey', 'NativeMessagingHost', 'com.prodmon.app.json');
    } else {
      edgeManifestPath = join(homedir(), '.config', 'microsoft-edge', 'NativeMessagingHosts', 'com.prodmon.app.json');
    }

    if (existsSync(edgeManifestPath)) {
      diagnostics.nativeMessaging.edge = {
        status: 'ok',
        message: `Installed at ${edgeManifestPath}`
      };
    } else {
      diagnostics.nativeMessaging.edge = {
        status: 'error',
        message: 'Not installed. Use "Browser Extension Setup" from tray menu'
      };
    }

    return diagnostics;
  }
}

// Start the app
const monkeyApp = new ProductivityMonkeyApp();
monkeyApp.init();

// Handle app lifecycle
app.on('window-all-closed', () => {
  // Don't quit on macOS when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Re-create window on macOS when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    monkeyApp.init();
  }
});
