#!/usr/bin/env node
/**
 * Converts SVG icons to PNG using sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertSVGtoPNG(svgPath, pngPath) {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer)
      .png()
      .toFile(pngPath);
    console.log(`✓ Converted ${path.basename(svgPath)} → ${path.basename(pngPath)}`);
  } catch (error) {
    console.error(`✗ Error converting ${svgPath}:`, error.message);
  }
}

async function convertAllIcons() {
  const sizes = [16, 32, 48, 96, 128];
  const browsers = ['chrome', 'firefox'];

  console.log('Converting SVG icons to PNG...\n');

  for (const browser of browsers) {
    console.log(`Converting ${browser} icons:`);
    const iconsDir = path.join(__dirname, browser, 'icons');

    for (const size of sizes) {
      const svgPath = path.join(iconsDir, `icon${size}.svg`);
      const pngPath = path.join(iconsDir, `icon${size}.png`);

      if (fs.existsSync(svgPath)) {
        await convertSVGtoPNG(svgPath, pngPath);
      }
    }
    console.log('');
  }

  console.log('✅ All icons converted successfully!');
  console.log('\nNext steps:');
  console.log('1. Update manifest.json files to use .png instead of .svg');
  console.log('2. Test the extensions locally');
  console.log('3. Package for store submission');
}

convertAllIcons().catch(console.error);
