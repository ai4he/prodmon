/**
 * Script to install native messaging host manifest for browser communication
 * Must be run after installing the browser extension
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { app } from 'electron';

export function installNativeMessagingHost(extensionId: string) {
  const platform = process.platform;
  const hostName = 'com.prodmon.app';
  const { execSync } = require('child_process');

  // Path to the native host runner script
  const scriptPath = app.isPackaged
    ? join(process.resourcesPath, 'app', 'native-host-runner.js')
    : join(app.getAppPath(), 'native-host-runner.js');

  // Find node executable
  let nodePath: string;
  try {
    if (platform === 'win32') {
      // Windows: use 'where' command
      nodePath = execSync('where node').toString().trim().split('\n')[0];
    } else {
      // Unix/macOS: use 'which' command
      nodePath = execSync('which node').toString().trim();
    }
  } catch (error) {
    // Fallback to defaults
    if (platform === 'win32') {
      nodePath = 'node'; // Will use PATH
    } else {
      nodePath = '/usr/local/bin/node';
    }
  }

  // Create wrapper executable script
  let wrapperPath: string;
  let wrapperContent: string;

  if (platform === 'darwin' || platform === 'linux') {
    wrapperPath = join(homedir(), '.local', 'bin', 'prodmon-native-host.sh');
    wrapperContent = `#!/bin/bash\n${nodePath} "${scriptPath}"\n`;

    // Create directory and write wrapper
    mkdirSync(join(homedir(), '.local', 'bin'), { recursive: true });
    writeFileSync(wrapperPath, wrapperContent, { mode: 0o755 });
  } else {
    // Windows
    wrapperPath = join(homedir(), 'AppData', 'Local', 'Productivity Monkey', 'native-host.bat');
    wrapperContent = `@echo off\n"${nodePath}" "${scriptPath}"\n`;

    mkdirSync(join(homedir(), 'AppData', 'Local', 'Productivity Monkey'), { recursive: true });
    writeFileSync(wrapperPath, wrapperContent);
  }

  const manifest = {
    name: hostName,
    description: 'Productivity Monkey Native Messaging Host',
    path: wrapperPath,
    type: 'stdio',
    allowed_origins: [
      `chrome-extension://${extensionId}/`
    ]
  };

  let manifestPath: string;

  if (platform === 'darwin') {
    // macOS
    const libraryPath = join(homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
    mkdirSync(libraryPath, { recursive: true });
    manifestPath = join(libraryPath, `${hostName}.json`);
  } else if (platform === 'win32') {
    // Windows - requires registry entry
    const { execSync } = require('child_process');
    const manifestDir = join(homedir(), 'AppData', 'Local', 'Productivity Monkey', 'NativeMessagingHost');
    mkdirSync(manifestDir, { recursive: true });
    manifestPath = join(manifestDir, `${hostName}.json`);

    // Write registry key
    const regKey = `HKEY_CURRENT_USER\\Software\\Google\\Chrome\\NativeMessagingHosts\\${hostName}`;
    try {
      execSync(`reg add "${regKey}" /ve /d "${manifestPath}" /f`);
      console.log('Registry key added for Windows');
    } catch (error) {
      console.error('Error adding registry key:', error);
    }
  } else {
    // Linux
    const configPath = join(homedir(), '.config', 'google-chrome', 'NativeMessagingHosts');
    mkdirSync(configPath, { recursive: true });
    manifestPath = join(configPath, `${hostName}.json`);
  }

  // Write manifest file
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Native messaging host installed at: ${manifestPath}`);

  return manifestPath;
}

// Also support Edge browser
export function installNativeMessagingHostForEdge(extensionId: string) {
  const platform = process.platform;
  const hostName = 'com.prodmon.app';
  const { execSync } = require('child_process');

  const scriptPath = app.isPackaged
    ? join(process.resourcesPath, 'app', 'native-host-runner.js')
    : join(app.getAppPath(), 'native-host-runner.js');

  // Find node executable
  let nodePath: string;
  try {
    if (platform === 'win32') {
      // Windows: use 'where' command
      nodePath = execSync('where node').toString().trim().split('\n')[0];
    } else {
      // Unix/macOS: use 'which' command
      nodePath = execSync('which node').toString().trim();
    }
  } catch (error) {
    // Fallback to defaults
    if (platform === 'win32') {
      nodePath = 'node'; // Will use PATH
    } else {
      nodePath = '/usr/local/bin/node';
    }
  }

  // Use same wrapper as Chrome
  let wrapperPath: string;
  if (platform === 'darwin' || platform === 'linux') {
    wrapperPath = join(homedir(), '.local', 'bin', 'prodmon-native-host.sh');
  } else {
    wrapperPath = join(homedir(), 'AppData', 'Local', 'Productivity Monkey', 'native-host.bat');
  }

  const manifest = {
    name: hostName,
    description: 'Productivity Monkey Native Messaging Host',
    path: wrapperPath,
    type: 'stdio',
    allowed_origins: [
      `chrome-extension://${extensionId}/` // Edge uses same format as Chrome
    ]
  };

  let manifestPath: string;

  if (platform === 'darwin') {
    const libraryPath = join(homedir(), 'Library', 'Application Support', 'Microsoft Edge', 'NativeMessagingHosts');
    mkdirSync(libraryPath, { recursive: true });
    manifestPath = join(libraryPath, `${hostName}.json`);
  } else if (platform === 'win32') {
    const { execSync } = require('child_process');
    const manifestDir = join(homedir(), 'AppData', 'Local', 'Productivity Monkey', 'NativeMessagingHost');
    mkdirSync(manifestDir, { recursive: true });
    manifestPath = join(manifestDir, `${hostName}.json`);

    const regKey = `HKEY_CURRENT_USER\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\${hostName}`;
    try {
      execSync(`reg add "${regKey}" /ve /d "${manifestPath}" /f`);
    } catch (error) {
      console.error('Error adding Edge registry key:', error);
    }
  } else {
    const configPath = join(homedir(), '.config', 'microsoft-edge', 'NativeMessagingHosts');
    mkdirSync(configPath, { recursive: true });
    manifestPath = join(configPath, `${hostName}.json`);
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Edge native messaging host installed at: ${manifestPath}`);

  return manifestPath;
}
