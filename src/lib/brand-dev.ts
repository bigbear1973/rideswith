/**
 * Brand.dev API Integration
 *
 * Fetches brand assets (logo, colors, fonts) from a domain using Brand.dev API.
 * https://www.brand.dev/
 *
 * Environment variable: BRAND_DEV_API_KEY
 */

export interface BrandDevResponse {
  name?: string;
  domain: string;
  logo?: {
    url?: string;
    icon?: string;
  };
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
  description?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
}

export interface BrandAssets {
  name?: string;
  logo?: string;
  logoIcon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fonts?: {
    heading?: string;
    body?: string;
  };
  description?: string;
}

const BRAND_DEV_API_URL = "https://api.brand.dev/v1";

/**
 * Fetch brand assets from Brand.dev API
 *
 * @param domain - The domain to look up (e.g., "straede.cc")
 * @returns Brand assets or null if not found/error
 */
export async function fetchBrandAssets(
  domain: string
): Promise<BrandAssets | null> {
  const apiKey = process.env.BRAND_DEV_API_KEY;

  if (!apiKey) {
    console.warn("BRAND_DEV_API_KEY not configured, skipping brand lookup");
    return null;
  }

  // Clean the domain (remove protocol, www, trailing slashes)
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .toLowerCase();

  try {
    const response = await fetch(`${BRAND_DEV_API_URL}/brand/${cleanDomain}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // Cache for 24 hours - brand assets don't change often
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Brand not found for domain: ${cleanDomain}`);
        return null;
      }
      throw new Error(`Brand.dev API error: ${response.status}`);
    }

    const data: BrandDevResponse = await response.json();

    // Transform to our internal format
    return {
      name: data.name,
      logo: data.logo?.url,
      logoIcon: data.logo?.icon,
      primaryColor: data.colors?.primary,
      secondaryColor: data.colors?.secondary,
      fonts: data.fonts,
      description: data.description,
    };
  } catch (error) {
    console.error("Error fetching brand assets:", error);
    return null;
  }
}

/**
 * Validate a domain format
 */
export function isValidDomain(domain: string): boolean {
  // Basic domain validation regex
  const domainRegex =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
  return domainRegex.test(cleanDomain);
}

/**
 * Generate a slug from a brand name
 */
export function generateBrandSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}
