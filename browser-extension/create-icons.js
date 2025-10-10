#!/usr/bin/env node
/**
 * Simple script to create placeholder PNG icons
 * Run with: node browser-extension/create-icons.js
 */

const fs = require('fs');
const path = require('path');

// Create simple SVG icons that can be used
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}" />
  <text x="50%" y="50%" font-size="${size * 0.7}" text-anchor="middle" dominant-baseline="central" fill="white">🐒</text>
</svg>`;

  // Save as SVG (Chrome supports SVG icons)
  const chromePath = path.join(__dirname, 'chrome', 'icons', `icon${size}.svg`);
  const firefoxPath = path.join(__dirname, 'firefox', 'icons', `icon${size}.svg`);

  fs.writeFileSync(chromePath, svg);
  fs.writeFileSync(firefoxPath, svg);

  console.log(`Created icon${size}.svg`);
});

console.log('\nNote: SVG icons created. Chrome supports SVG icons directly.');
console.log('If you need PNG, you can convert SVG to PNG using an online tool or ImageMagick.');
console.log('\nAlternatively, update manifest.json to use .svg instead of .png');
