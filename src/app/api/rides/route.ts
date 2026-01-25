import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Implement ride listing with filters
  return NextResponse.json({ data: [], message: 'Rides endpoint - to be implemented' });
}

export async function POST() {
  // TODO: Implement ride creation
  return NextResponse.json({ message: 'Create ride endpoint - to be implemented' });
}
