'use client';

import { ExternalLink, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LiveLocationBannerProps {
  liveLocationUrl?: string | null;
  rideName: string;
}

export function LiveLocationBanner({ liveLocationUrl, rideName }: LiveLocationBannerProps) {
  // Extract coordinates from Google Maps URL if possible for map app links
  const getMapAppUrl = (platform: 'google' | 'apple' | 'waze') => {
    if (liveLocationUrl) {
      // For live share links, just use the Google link directly
      if (platform === 'google') {
        return liveLocationUrl;
      }
      // For other platforms, open the Google link (they can't interpret live share URLs)
      return liveLocationUrl;
    }
    return null;
  };

  return (
    <Card className="border-red-500 bg-red-50 dark:bg-red-950/30 overflow-hidden">
      <CardContent className="p-0">
        {/* Live Banner Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-red-500 text-white">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="font-semibold tracking-wide">LIVE</span>
            <span className="text-red-100">This ride is in progress</span>
          </div>
        </div>

        {/* Map Embed or Message */}
        <div className="p-4">
          {liveLocationUrl ? (
            <div className="space-y-3">
              {/* Google Maps Embed */}
              <div className="relative w-full h-[250px] md:h-[300px] rounded-lg overflow-hidden bg-muted">
                <iframe
                  src={convertToEmbedUrl(liveLocationUrl)}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Live location for ${rideName}`}
                />
              </div>

              {/* Open in Maps Button */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1 sm:flex-none"
                >
                  <a
                    href={liveLocationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Radio className="h-5 w-5 text-red-500" />
              <p>The ride leader is tracking their location. Check back for live updates.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Converts various Google Maps URL formats to embeddable format
 * Note: Live share links (maps.app.goo.gl) may not be directly embeddable
 * In those cases, we'll show a link instead
 */
function convertToEmbedUrl(url: string): string {
  // If it's already an embed URL, return as-is
  if (url.includes('/embed')) {
    return url;
  }

  // Try to extract place/coordinates from different URL formats
  // Format: https://www.google.com/maps/place/.../@lat,lng,zoom
  const placeMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (placeMatch) {
    const [, lat, lng] = placeMatch;
    return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1`;
  }

  // Format: https://www.google.com/maps?q=lat,lng
  const queryMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch) {
    const [, lat, lng] = queryMatch;
    return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1`;
  }

  // For short links (maps.app.goo.gl) or unrecognized formats,
  // use the maps embed API with the URL as a query
  // This may not work for all live share links
  return `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(url)}`;
}
