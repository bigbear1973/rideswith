import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ seriesId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { seriesId } = await params;
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Get total count of rides in the series
    const total = await prisma.ride.count({
      where: { recurrenceSeriesId: seriesId },
    });

    // Get count of this ride and following (from the given date onwards)
    let following = total;
    if (dateParam) {
      const date = new Date(dateParam);
      following = await prisma.ride.count({
        where: {
          recurrenceSeriesId: seriesId,
          date: { gte: date },
        },
      });
    }

    return NextResponse.json({ total, following });
  } catch (error) {
    console.error('GET /api/rides/series/[seriesId]/count error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series counts' },
      { status: 500 }
    );
  }
}
