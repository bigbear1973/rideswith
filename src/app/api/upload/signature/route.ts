import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateUploadSignature } from '@/lib/cloudinary';

// GET /api/upload/signature - Get signed upload credentials for Cloudinary
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentials = generateUploadSignature('ride-photos');

    return NextResponse.json(credentials);
  } catch (error) {
    console.error('GET /api/upload/signature error:', error);
    return NextResponse.json({ error: 'Failed to generate upload signature' }, { status: 500 });
  }
}
