#!/usr/bin/env node
/**
 * Creates simple PNG icons for browser extensions
 * Creates a gradient background with monkey emoji
 */

const fs = require('fs');
const path = require('path');

// Simple function to create PNG data URL for icons
function createPNGIcon(size) {
  // Create canvas-like structure using data URL
  // This creates a simple colored square with text
  const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad${size})" rx="${size * 0.15}" />
      <text x="50%" y="55%" font-size="${size * 0.6}" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial, sans-serif">🐒</text>
    </svg>
  `;

  return canvas;
}

// Create icons for both Chrome and Firefox
const sizes = [16, 32, 48, 96, 128];

sizes.forEach(size => {
  const svg = createPNGIcon(size);

  // Save SVG files (will be converted to PNG manually or via online tool)
  const chromePath = path.join(__dirname, 'chrome', 'icons', `icon${size}.svg`);
  const firefoxPath = path.join(__dirname, 'firefox', 'icons', `icon${size}.svg`);

  fs.writeFileSync(chromePath, svg);
  fs.writeFileSync(firefoxPath, svg);

  console.log(`✓ Created icon${size}.svg`);
});

console.log('\n📝 Icons created as SVG files.');
console.log('\nFor store submission, you need PNG files. Options:');
console.log('1. Convert SVG to PNG online: https://cloudconvert.com/svg-to-png');
console.log('2. Use ImageMagick: convert icon.svg icon.png');
console.log('3. Use a design tool (Figma, Photoshop) to export as PNG');
console.log('\nOr create professional icons with a designer for better quality.');
