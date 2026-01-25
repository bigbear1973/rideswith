import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Generate a signature for client-side uploads
export function generateUploadSignature(folder: string = 'ride-photos') {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const paramsToSign = {
    timestamp,
    folder,
    upload_preset: 'ride_photos', // Create this preset in Cloudinary dashboard
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
}

// Delete an image from Cloudinary
export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}

// Generate optimized image URLs
export function getOptimizedUrl(publicId: string, options: {
  width?: number;
  height?: number;
  quality?: string | number;
  format?: string;
} = {}) {
  const { width, height, quality = 'auto', format = 'auto' } = options;

  const transformations: string[] = [`q_${quality}`, `f_${format}`];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push('c_fill');

  return cloudinary.url(publicId, {
    transformation: transformations.join(','),
    secure: true,
  });
}

// Get thumbnail URL (400x300)
export function getThumbnailUrl(publicId: string) {
  return getOptimizedUrl(publicId, { width: 400, height: 300 });
}

// Get full-size optimized URL (max 1600px wide)
export function getFullSizeUrl(publicId: string) {
  return getOptimizedUrl(publicId, { width: 1600 });
}
