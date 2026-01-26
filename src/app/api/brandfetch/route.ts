import { NextRequest, NextResponse } from 'next/server';
import { fetchBrandAssets } from '@/lib/brand-dev';

// GET /api/brandfetch?domain=example.com - Fetch brand assets from Brand.dev
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    const assets = await fetchBrandAssets(domain);

    if (!assets) {
      return NextResponse.json(
        { error: 'Could not fetch brand assets for this domain' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: assets.name,
      logo: assets.logo,
      logoIcon: assets.logoIcon,
      backdrop: assets.backdrop,
      primaryColor: assets.primaryColor,
      secondaryColor: assets.secondaryColor,
      description: assets.description,
      slogan: assets.slogan,
    });
  } catch (error) {
    console.error('GET /api/brandfetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand assets' },
      { status: 500 }
    );
  }
}
