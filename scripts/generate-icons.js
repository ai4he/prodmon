const fs = require('fs');
const path = require('path');

const buildResourcesDir = path.join(__dirname, '..', 'build-resources');
const iconSource = path.join(__dirname, '..', 'browser-extension', 'chrome', 'icons', 'icon128.png');

// Ensure build-resources directory exists
if (!fs.existsSync(buildResourcesDir)) {
  fs.mkdirSync(buildResourcesDir, { recursive: true });
}

async function generateIcons() {
  console.log('Preparing app icons for electron-builder...');

  try {
    // Check if sharp is available for high-res icon generation
    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      console.log('⚠ sharp not available, using base icon (128x128)');
      console.log('  For production builds, install dependencies with: npm install');

      // Copy the base icon - electron-builder will use it to generate platform-specific icons
      fs.copyFileSync(iconSource, path.join(buildResourcesDir, 'icon.png'));
      console.log('✓ Copied icon.png (128x128)');
      console.log('  electron-builder will automatically generate .icns and .ico files during build.');
      return;
    }

    // If sharp is available, generate high-resolution icons
    console.log('Generating high-resolution icons from source:', iconSource);

    // Generate 512x512 PNG for Linux and as base for other formats
    await sharp(iconSource)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(buildResourcesDir, 'icon.png'));
    console.log('✓ Generated icon.png (512x512)');

    // Generate 1024x1024 for macOS retina displays
    await sharp(iconSource)
      .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(buildResourcesDir, 'icon@2x.png'));
    console.log('✓ Generated icon@2x.png (1024x1024)');

    // Generate 256x256 for Windows
    await sharp(iconSource)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(buildResourcesDir, 'icon-256.png'));
    console.log('✓ Generated icon-256.png (256x256)');

    console.log('\n✓ All icons generated successfully!');
    console.log('  electron-builder will automatically generate .icns and .ico files during build.');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
