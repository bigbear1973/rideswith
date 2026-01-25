import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  let dbStatus = 'unknown';

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  // Always return 200 so Railway health check passes
  // The app is healthy even if DB is temporarily unavailable
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV,
  });
}
