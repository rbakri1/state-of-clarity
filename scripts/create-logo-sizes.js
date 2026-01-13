const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createLogoSizes() {
  const inputPath = path.join(__dirname, '../public/brand/logo-512.svg');
  const sizes = [128, 256];

  for (const size of sizes) {
    const outputPath = path.join(__dirname, `../public/brand/logo-${size}.png`);

    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    const fileSizeKB = stats.size / 1024;
    console.log(`✓ Created logo-${size}.png (${fileSizeKB.toFixed(2)}KB)`);
  }
}

createLogoSizes().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
