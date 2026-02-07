import { NextRequest, NextResponse } from 'next/server';
import { fetchBrandAssets } from '@/lib/brand-dev';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({ interval: 60000, limit: 10 });

// GET /api/brandfetch?domain=example.com - Fetch brand assets from Brand.dev
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { success } = await limiter.check(ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    const assets = await fetchBrandAssets(domain);

    // Debug logging
    console.log('[brandfetch] Domain:', domain);
    console.log('[brandfetch] Assets:', JSON.stringify(assets, null, 2));

    // If Brand.dev doesn't have assets for this domain, return empty response
    // instead of error - user can still add custom branding manually
    if (!assets) {
      console.log('[brandfetch] No assets found for domain:', domain);
      return NextResponse.json({
        name: null,
        logo: null,
        logoIcon: null,
        backdrop: null,
        primaryColor: null,
        secondaryColor: null,
        description: null,
        slogan: null,
        notFound: true,
      });
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
