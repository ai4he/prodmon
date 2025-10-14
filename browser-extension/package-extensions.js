#!/usr/bin/env node
/**
 * Packages browser extensions for store submission
 * Creates ZIP files for Chrome, Edge, and Firefox
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, 'dist');

// Files to include in Chrome/Edge package
const CHROME_FILES = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'icons/'
];

// Files to include in Firefox package
const FIREFOX_FILES = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'icons/'
];

// Files to exclude (native messaging manifest not needed in extension package)
const EXCLUDE_FILES = [
  'com.prodmon.app.json'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function packageExtension(browser, files) {
  const sourceDir = path.join(__dirname, browser);
  const zipName = `productivity-monkey-${browser}.zip`;
  const zipPath = path.join(DIST_DIR, zipName);

  console.log(`\n📦 Packaging ${browser} extension...`);

  // Remove old zip if exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // Create file list for zip
  const fileList = files.join(' ');

  try {
    // Change to source directory and create zip
    process.chdir(sourceDir);
    execSync(`zip -r "${zipPath}" ${fileList} -x "*.DS_Store" "*/\.*"`, {
      stdio: 'inherit'
    });

    const stats = fs.statSync(zipPath);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ Created ${zipName} (${fileSizeInKB} KB)`);
  } catch (error) {
    console.error(`❌ Error packaging ${browser}:`, error.message);
  }
}

function main() {
  console.log('🚀 Packaging Productivity Monkey Browser Extensions\n');

  // Ensure dist directory exists
  ensureDir(DIST_DIR);

  // Package Chrome extension (also works for Edge)
  packageExtension('chrome', CHROME_FILES);

  // Package Firefox extension
  packageExtension('firefox', FIREFOX_FILES);

  console.log('\n✨ Packaging complete!');
  console.log(`\nPackages created in: ${DIST_DIR}`);
  console.log('\nNext steps:');
  console.log('1. Review the packages to ensure all files are included');
  console.log('2. Submit to Chrome Web Store: https://chrome.google.com/webstore/devconsole');
  console.log('3. Submit to Edge Add-ons: https://partner.microsoft.com/dashboard');
  console.log('4. Submit to Firefox Add-ons: https://addons.mozilla.org/developers/');
}

main();
