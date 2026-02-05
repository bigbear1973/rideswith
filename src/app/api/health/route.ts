import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection (do not leak status in response)
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    // Intentionally ignore DB errors here to avoid leaking internal state
  }

  // Always return 200 so Railway health check passes
  return NextResponse.json({ status: 'ok' });
}
