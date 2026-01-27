import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

// Source image path - the Gemini generated icon
const sourceImage = '/Users/rogerbyrne/Downloads/Gemini_Generated_Image_v3icprv3icprv3ic.png';

async function processIcon() {
  // First, get the image metadata to understand its dimensions
  const metadata = await sharp(sourceImage).metadata();
  console.log('Source image:', metadata.width, 'x', metadata.height);

  // The icon appears to be centered with black padding around it
  // We need to extract just the app icon (the rounded square with gradient)
  // Based on the image, the icon is roughly centered with some padding

  // Load the image and extract the center portion (the actual app icon)
  // The icon in the image appears to be about 70-80% of the total image size
  const iconSize = Math.min(metadata.width, metadata.height);
  const padding = Math.floor(iconSize * 0.08); // ~8% padding on each side
  const extractSize = iconSize - (padding * 2);

  // Extract the center portion (the app icon without black background)
  const extracted = sharp(sourceImage)
    .extract({
      left: padding,
      top: padding,
      width: extractSize,
      height: extractSize
    });

  // Generate different sizes
  const sizes = [
    { size: 512, name: 'icon-512.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 32, name: 'favicon-32.png' },
    { size: 16, name: 'favicon-16.png' },
  ];

  for (const { size, name } of sizes) {
    const outputPath = join(iconsDir, name);
    await extracted
      .clone()
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${name} (${size}x${size})`);
  }

  // Also copy apple-touch-icon to public root
  await extracted
    .clone()
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(join(__dirname, '../public/apple-touch-icon.png'));
  console.log('Copied apple-touch-icon.png to public root');

  console.log('\nAll icons generated successfully!');
}

processIcon().catch(console.error);
