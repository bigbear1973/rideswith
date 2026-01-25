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

interface BrandDevApiResponse {
  status: string;
  code: number;
  brand: {
    domain: string;
    title?: string;
    description?: string;
    slogan?: string;
    colors?: Array<{ hex: string; name: string }>;
    logos?: Array<{
      url: string;
      mode: string;
      type: "icon" | "logo";
      resolution?: { width: number; height: number };
    }>;
    backdrops?: Array<{
      url: string;
      colors: Array<{ hex: string; name: string }>;
    }>;
  };
}

/**
 * Fetch brand assets from Brand.dev API
 *
 * @param domain - The domain to look up (e.g., "rapha.cc")
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
    const response = await fetch(
      `${BRAND_DEV_API_URL}/brand/retrieve?domain=${encodeURIComponent(cleanDomain)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        // Cache for 24 hours - brand assets don't change often
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Brand not found for domain: ${cleanDomain}`);
        return null;
      }
      throw new Error(`Brand.dev API error: ${response.status}`);
    }

    const data: BrandDevApiResponse = await response.json();

    if (data.status !== "ok" || !data.brand) {
      console.log(`Brand.dev returned non-ok status for: ${cleanDomain}`);
      return null;
    }

    const brand = data.brand;

    // Find the best logo (prefer SVG or wide logo, then icon)
    const logoImage = brand.logos?.find((l) => l.type === "logo") ||
      brand.logos?.find((l) => l.type === "icon");
    const iconImage = brand.logos?.find((l) => l.type === "icon");

    // Get primary and secondary colors from the color array
    const primaryColor = brand.colors?.[0]?.hex;
    const secondaryColor = brand.colors?.[1]?.hex;

    // Transform to our internal format
    return {
      name: brand.title,
      logo: logoImage?.url,
      logoIcon: iconImage?.url,
      primaryColor,
      secondaryColor,
      description: brand.description,
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
