#!/usr/bin/env node
/**
 * Standalone native messaging host runner
 * This is the entry point called by the browser extension
 */

const path = require('path');
const fs = require('fs');

// Find the correct base path for the application
let basePath = __dirname;

// Check if we're in the resources folder (packaged app)
if (basePath.includes('resources')) {
  basePath = path.join(basePath, 'app');
}

const { DatabaseManager } = require(path.join(basePath, 'dist/database/schema'));
const { NativeMessagingHost } = require(path.join(basePath, 'dist/browser/native-host'));

// Initialize database - use default path (same as Electron app)
const db = new DatabaseManager();

db.initialize().then(() => {
  // Log to stderr for debugging (stdout is used for native messaging protocol)
  console.error('Native messaging host initialized successfully');

  // Start native messaging host
  const host = new NativeMessagingHost(db);
  host.start();
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
