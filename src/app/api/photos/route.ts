import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Implement photo listing
  return NextResponse.json({ data: [], message: 'Photos endpoint - to be implemented' });
}

export async function POST() {
  // TODO: Implement photo upload
  return NextResponse.json({ message: 'Upload photo endpoint - to be implemented' });
}
