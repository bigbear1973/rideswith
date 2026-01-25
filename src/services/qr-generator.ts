import QRCode from 'qrcode';

interface QrOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export async function generateQrCodeDataUrl(
  url: string,
  options: QrOptions = {}
): Promise<string> {
  const { width = 256, margin = 2, color = {} } = options;

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width,
      margin,
      color: {
        dark: color.dark || '#000000',
        light: color.light || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export async function generateQrCodeBuffer(
  url: string,
  options: QrOptions = {}
): Promise<Buffer> {
  const { width = 256, margin = 2, color = {} } = options;

  try {
    const buffer = await QRCode.toBuffer(url, {
      width,
      margin,
      color: {
        dark: color.dark || '#000000',
        light: color.light || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    return buffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function getRideQrUrl(rideId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/rides/${rideId}`;
}
