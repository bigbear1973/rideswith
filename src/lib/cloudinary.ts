import { v2 as cloudinary } from 'cloudinary';

// Get cloud name from env (supports both server and client-side naming)
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Configure Cloudinary (only if credentials are available)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export { cloudinary };

// Delete an image from Cloudinary (requires full API credentials)
export async function deleteImage(publicId: string) {
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary API credentials not configured, skipping delete');
    return { result: 'skipped' };
  }
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}

// Generate thumbnail URL manually (doesn't require cloudinary SDK config)
export function getThumbnailUrl(publicId: string) {
  if (!CLOUD_NAME) {
    console.error('No Cloudinary cloud name configured');
    return '';
  }
  // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,w_400,h_300,q_auto,f_auto/${publicId}`;
}

// Get full-size optimized URL (max 1600px wide)
export function getFullSizeUrl(publicId: string) {
  if (!CLOUD_NAME) {
    console.error('No Cloudinary cloud name configured');
    return '';
  }
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_limit,w_1600,q_auto,f_auto/${publicId}`;
}
