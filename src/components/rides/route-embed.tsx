'use client';

import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface RouteEmbedProps {
  routeUrl: string;
}

/**
 * Parses a route URL and returns embed information
 * Supports: Komoot, RideWithGPS
 */
function parseRouteUrl(url: string): { platform: string; embedUrl: string; tourId: string } | null {
  try {
    const urlObj = new URL(url);

    // Komoot: https://www.komoot.com/tour/123456789 or https://www.komoot.com/collection/123456789
    if (urlObj.hostname.includes('komoot.com')) {
      const tourMatch = url.match(/\/tour\/(\d+)/);
      const collectionMatch = url.match(/\/collection\/(\d+)/);

      if (tourMatch) {
        return {
          platform: 'Komoot',
          tourId: tourMatch[1],
          embedUrl: `https://www.komoot.com/tour/${tourMatch[1]}/embed?share_token=&profile=1&gallery=1`,
        };
      }
      if (collectionMatch) {
        return {
          platform: 'Komoot',
          tourId: collectionMatch[1],
          embedUrl: `https://www.komoot.com/collection/${collectionMatch[1]}/embed`,
        };
      }
    }

    // RideWithGPS: https://ridewithgps.com/routes/123456789
    if (urlObj.hostname.includes('ridewithgps.com')) {
      const routeMatch = url.match(/\/routes\/(\d+)/);

      if (routeMatch) {
        return {
          platform: 'RideWithGPS',
          tourId: routeMatch[1],
          embedUrl: `https://ridewithgps.com/embeds?type=route&id=${routeMatch[1]}&sampleGraph=true`,
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

  if (!parsed) {
    // Fallback: just show a link to the route
    return (
      <Card className="p-4">
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          View Route
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
          href={routeUrl}
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
