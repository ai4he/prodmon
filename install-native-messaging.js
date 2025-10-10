#!/usr/bin/env node
/**
 * Manual script to install native messaging manifests
 * Run this after loading the extension in Chrome/Edge in developer mode
 *
 * Usage: node install-native-messaging.js <extension-id>
 *
 * To find your extension ID:
 * 1. Go to chrome://extensions/
 * 2. Enable "Developer mode"
 * 3. Look for "Productivity Monkey" extension
 * 4. Copy the ID (e.g., "abcdefghijklmnop")
 */

const { writeFileSync, mkdirSync, existsSync, chmodSync } = require('fs');
const { join } = require('path');
const { homedir } = require('os');
const { execSync } = require('child_process');

// Get extension ID from command line
const extensionId = process.argv[2];

if (!extensionId) {
  console.error('Error: Extension ID is required');
  console.error('');
  console.error('Usage: node install-native-messaging.js <extension-id>');
  console.error('');
  console.error('To find your extension ID:');
  console.error('1. Go to chrome://extensions/');
  console.error('2. Enable "Developer mode"');
  console.error('3. Look for "Productivity Monkey - Browser Tracker" extension');
  console.error('4. Copy the ID (long alphanumeric string)');
  console.error('5. Run: node install-native-messaging.js YOUR_EXTENSION_ID');
  process.exit(1);
}

console.log('Installing native messaging host for extension:', extensionId);

const platform = process.platform;
const hostName = 'com.prodmon.app';

// Path to the native host runner script
const scriptPath = join(__dirname, 'native-host-runner.js');

if (!existsSync(scriptPath)) {
  console.error('Error: native-host-runner.js not found at:', scriptPath);
  console.error('Please ensure you are running this from the project root directory');
  process.exit(1);
}

// Find node executable
let nodePath = '/usr/local/bin/node'; // Default
try {
  nodePath = execSync('which node').toString().trim();
  console.log('Found node at:', nodePath);
} catch (error) {
  console.log('Using default node path:', nodePath);
}

// Create wrapper executable script
let wrapperPath;
let wrapperContent;

if (platform === 'darwin' || platform === 'linux') {
  wrapperPath = join(homedir(), '.local', 'bin', 'prodmon-native-host.sh');
  wrapperContent = `#!/bin/bash\n${nodePath} "${scriptPath}"\n`;

  // Create directory and write wrapper
  mkdirSync(join(homedir(), '.local', 'bin'), { recursive: true });
  writeFileSync(wrapperPath, wrapperContent, { mode: 0o755 });
  console.log('Created wrapper script at:', wrapperPath);
} else {
  // Windows
  wrapperPath = join(homedir(), 'AppData', 'Local', 'Productivity Monkey', 'native-host.bat');
  wrapperContent = `@echo off\n"${nodePath}" "${scriptPath}"\n`;

  mkdirSync(join(homedir(), 'AppData', 'Local', 'Productivity Monkey'), { recursive: true });
  writeFileSync(wrapperPath, wrapperContent);
  console.log('Created wrapper script at:', wrapperPath);
}

// Install for Chrome
const manifest = {
  name: hostName,
  description: 'Productivity Monkey Native Messaging Host',
  path: wrapperPath,
  type: 'stdio',
  allowed_origins: [
    `chrome-extension://${extensionId}/`
  ]
};

let chromeManifestPath;

if (platform === 'darwin') {
  // macOS Chrome
  const libraryPath = join(homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
  mkdirSync(libraryPath, { recursive: true });
  chromeManifestPath = join(libraryPath, `${hostName}.json`);
} else if (platform === 'win32') {
  // Windows - requires registry entry
  const manifestDir = join(homedir(), 'AppData', 'Local', 'Productivity Monkey', 'NativeMessagingHost');
  mkdirSync(manifestDir, { recursive: true });
  chromeManifestPath = join(manifestDir, `${hostName}.json`);

  // Write registry key
  const regKey = `HKEY_CURRENT_USER\\Software\\Google\\Chrome\\NativeMessagingHosts\\${hostName}`;
  try {
    execSync(`reg add "${regKey}" /ve /d "${chromeManifestPath}" /f`);
    console.log('Registry key added for Windows Chrome');
  } catch (error) {
    console.error('Error adding registry key:', error);
  }
} else {
  // Linux
  const configPath = join(homedir(), '.config', 'google-chrome', 'NativeMessagingHosts');
  mkdirSync(configPath, { recursive: true });
  chromeManifestPath = join(configPath, `${hostName}.json`);
}

// Write Chrome manifest file
writeFileSync(chromeManifestPath, JSON.stringify(manifest, null, 2));
console.log('✓ Chrome native messaging host installed at:', chromeManifestPath);

// Install for Edge
let edgeManifestPath;

if (platform === 'darwin') {
  const libraryPath = join(homedir(), 'Library', 'Application Support', 'Microsoft Edge', 'NativeMessagingHosts');
  mkdirSync(libraryPath, { recursive: true });
  edgeManifestPath = join(libraryPath, `${hostName}.json`);
} else if (platform === 'win32') {
  const manifestDir = join(homedir(), 'AppData', 'Local', 'Productivity Monkey', 'NativeMessagingHost');
  mkdirSync(manifestDir, { recursive: true });
  edgeManifestPath = join(manifestDir, `${hostName}.json`);

  const regKey = `HKEY_CURRENT_USER\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\${hostName}`;
  try {
    execSync(`reg add "${regKey}" /ve /d "${edgeManifestPath}" /f`);
    console.log('Registry key added for Windows Edge');
  } catch (error) {
    console.error('Error adding Edge registry key:', error);
  }
} else {
  const configPath = join(homedir(), '.config', 'microsoft-edge', 'NativeMessagingHosts');
  mkdirSync(configPath, { recursive: true });
  edgeManifestPath = join(configPath, `${hostName}.json`);
}

// Write Edge manifest file
writeFileSync(edgeManifestPath, JSON.stringify(manifest, null, 2));
console.log('✓ Edge native messaging host installed at:', edgeManifestPath);

console.log('');
console.log('✓ Installation complete!');
console.log('');
console.log('Next steps:');
console.log('1. Reload your browser extension in chrome://extensions/');
console.log('2. Open the extension popup and check the diagnostics');
console.log('3. The "Native App" status should show "✓" if successful');
