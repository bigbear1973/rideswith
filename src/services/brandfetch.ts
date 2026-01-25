interface BrandfetchResponse {
  name: string;
  domain: string;
  logos: Array<{
    type: string;
    theme: string;
    formats: Array<{
      src: string;
      format: string;
    }>;
  }>;
  colors: Array<{
    hex: string;
    type: string;
    brightness: number;
  }>;
}

interface BrandInfo {
  name: string;
  domain: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export async function fetchBrandInfo(domain: string): Promise<BrandInfo | null> {
  const apiKey = process.env.BRANDFETCH_API_KEY;

  if (!apiKey) {
    console.warn('BRANDFETCH_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Brand not found
      }
      throw new Error(`Brandfetch API error: ${response.status}`);
    }

    const data: BrandfetchResponse = await response.json();

    // Find the best logo (prefer SVG, then PNG)
    let logoUrl: string | null = null;
    for (const logo of data.logos) {
      if (logo.type === 'logo' || logo.type === 'icon') {
        const svgFormat = logo.formats.find((f) => f.format === 'svg');
        const pngFormat = logo.formats.find((f) => f.format === 'png');
        logoUrl = svgFormat?.src || pngFormat?.src || null;
        if (logoUrl) break;
      }
    }

    // Get colors
    const primaryColor = data.colors.find((c) => c.type === 'brand')?.hex || null;
    const secondaryColor =
      data.colors.find((c) => c.type === 'accent')?.hex ||
      data.colors.find((c) => c.type !== 'brand')?.hex ||
      null;

    return {
      name: data.name,
      domain: data.domain,
      logoUrl,
      primaryColor,
      secondaryColor,
    };
  } catch (error) {
    console.error('Error fetching brand info:', error);
    return null;
  }
}
