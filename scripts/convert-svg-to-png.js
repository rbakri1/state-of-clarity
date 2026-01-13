const fs = require('fs');
const path = require('path');

// Using node-canvas to render SVG to PNG
async function convertSvgToPng() {
  try {
    const sharp = require('sharp');
    const inputPath = path.join(__dirname, '../public/brand/logo-512.svg');
    const outputPath = path.join(__dirname, '../public/brand/logo-512.png');

    await sharp(inputPath)
      .resize(512, 512)
      .png()
      .toFile(outputPath);

    console.log('✓ Successfully created logo-512.png');

    // Check file size
    const stats = fs.statSync(outputPath);
    const fileSizeKB = stats.size / 1024;
    console.log(`✓ File size: ${fileSizeKB.toFixed(2)}KB (must be < 512KB)`);

    if (fileSizeKB > 512) {
      console.warn('⚠ Warning: File size exceeds 512KB');
    }
  } catch (error) {
    console.error('Error converting SVG to PNG:', error.message);
    process.exit(1);
  }
}

convertSvgToPng();
