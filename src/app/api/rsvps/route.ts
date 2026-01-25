import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Implement RSVP listing
  return NextResponse.json({ data: [], message: 'RSVPs endpoint - to be implemented' });
}

export async function POST() {
  // TODO: Implement RSVP creation
  return NextResponse.json({ message: 'Create RSVP endpoint - to be implemented' });
}
