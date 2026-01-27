import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

// Source image path - the new peloton-style icon
const sourceImage = '/Users/rogerbyrne/Downloads/rideswith-icon-peloton-512x512 (2).png';

async function processIcon() {
  // First, get the image metadata to understand its dimensions
  const metadata = await sharp(sourceImage).metadata();
  console.log('Source image:', metadata.width, 'x', metadata.height);
  console.log('Has alpha channel:', metadata.hasAlpha);

  // This icon already has rounded corners and gradient background
  // We just need to resize it to different sizes while preserving transparency
  const sourceBuffer = await sharp(sourceImage)
    .ensureAlpha() // Ensure alpha channel exists
    .toBuffer();

  // Generate different sizes - preserving PNG transparency
  const sizes = [
    { size: 512, name: 'icon-512.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 32, name: 'favicon-32.png' },
    { size: 16, name: 'favicon-16.png' },
  ];

  for (const { size, name } of sizes) {
    const outputPath = join(iconsDir, name);
    await sharp(sourceBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);
    console.log(`Generated: ${name} (${size}x${size})`);
  }

  // Also copy apple-touch-icon to public root
  await sharp(sourceBuffer)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9 })
    .toFile(join(__dirname, '../public/apple-touch-icon.png'));
  console.log('Copied apple-touch-icon.png to public root');

  console.log('\nAll icons generated successfully with transparent backgrounds!');
}

processIcon().catch(console.error);
