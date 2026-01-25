'use client';

import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface RouteEmbedProps {
  routeUrl: string;
}

/**
 * Parses a route URL and returns embed information
 * Supports: Komoot (with share_token), RideWithGPS
 *
 * Komoot requires a share_token for embeds to work. Users should paste the
 * embed URL from Komoot's share dialog, e.g.:
 * https://www.komoot.com/tour/123456789/embed?share_token=abc123&profile=1
 */
function parseRouteUrl(url: string): { platform: string; embedUrl: string; originalUrl: string; canEmbed: boolean } | null {
  try {
    const urlObj = new URL(url);

    // Komoot: Check if it's an embed URL with share_token (required for embedding)
    if (urlObj.hostname.includes('komoot.com')) {
      const isEmbedUrl = url.includes('/embed');
      const hasShareToken = url.includes('share_token=') && !url.includes('share_token=&');
      const tourMatch = url.match(/\/tour\/(\d+)/);
      const collectionMatch = url.match(/\/collection\/(\d+)/);

      if (tourMatch || collectionMatch) {
        const tourId = tourMatch?.[1] || collectionMatch?.[1];
        const baseUrl = `https://www.komoot.com/tour/${tourId}`;

        // If user pasted an embed URL with share_token, use it directly
        if (isEmbedUrl && hasShareToken) {
          return {
            platform: 'Komoot',
            embedUrl: url,
            originalUrl: baseUrl,
            canEmbed: true,
          };
        }

        // Otherwise, we can't embed - just link to it
        return {
          platform: 'Komoot',
          embedUrl: '',
          originalUrl: url,
          canEmbed: false,
        };
      }
    }

    // RideWithGPS: https://ridewithgps.com/routes/123456789
    // RideWithGPS doesn't require special tokens for public routes
    if (urlObj.hostname.includes('ridewithgps.com')) {
      const routeMatch = url.match(/\/routes\/(\d+)/);

      if (routeMatch) {
        return {
          platform: 'RideWithGPS',
          embedUrl: `https://ridewithgps.com/embeds?type=route&id=${routeMatch[1]}&sampleGraph=true`,
          originalUrl: url,
          canEmbed: true,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function RouteEmbed({ routeUrl }: RouteEmbedProps) {
  const parsed = parseRouteUrl(routeUrl);

  // Fallback: just show a link to the route
  if (!parsed || !parsed.canEmbed) {
    const platform = parsed?.platform || 'route';
    const linkUrl = parsed?.originalUrl || routeUrl;

    return (
      <Card className="p-4">
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          View route on {platform}
        </a>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] w-full">
        <iframe
          src={parsed.embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          allowFullScreen
          loading="lazy"
          title={`${parsed.platform} route`}
          className="w-full h-full"
        />
      </div>
      <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Route via {parsed.platform}</span>
        <a
          href={parsed.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Open in {parsed.platform}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </Card>
  );
}
