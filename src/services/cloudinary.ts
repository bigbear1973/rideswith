interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
}

interface UploadOptions {
  folder?: string;
  transformation?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export async function uploadToCloudinary(
  file: File | Uint8Array,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('Cloudinary credentials not configured');
    return null;
  }

  try {
    const formData = new FormData();

    if (file instanceof File) {
      formData.append('file', file);
    } else {
      // Handle Uint8Array/Buffer
      const blob = new Blob([file as BlobPart]);
      formData.append('file', blob);
    }

    formData.append('upload_preset', 'group_rides');
    formData.append('folder', options.folder || 'rides');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${options.resourceType || 'image'}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary upload error: ${response.status}`);
    }

    const data = await response.json();

    return {
      publicId: data.public_id,
      url: data.url,
      secureUrl: data.secure_url,
      width: data.width,
      height: data.height,
      format: data.format,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
}

export function getOptimizedImageUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const { width = 800, height, quality = 80 } = options;

  const transforms = [`q_${quality}`, `w_${width}`];
  if (height) transforms.push(`h_${height}`);
  transforms.push('c_fill');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(',')}/${publicId}`;
}
