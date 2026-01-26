import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/communities/backdrops - Get all brand backdrop images for hero rotation
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        backdrop: {
          not: null,
        },
      },
      select: {
        name: true,
        slug: true,
        backdrop: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter out empty strings and null values
    const brandsWithBackdrops = brands.filter(
      (brand) => brand.backdrop && brand.backdrop.length > 0
    );

    return NextResponse.json(brandsWithBackdrops);
  } catch (error) {
    console.error('Error fetching brand backdrops:', error);
    return NextResponse.json([], { status: 200 });
  }
}
