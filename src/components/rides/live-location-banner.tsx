'use client';

import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LiveLocationBannerProps {
  liveLocationUrl?: string | null;
  rideName: string;
}

export function LiveLocationBanner({ liveLocationUrl }: LiveLocationBannerProps) {
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
            <span className="text-red-100 hidden sm:inline">This ride is in progress</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {liveLocationUrl ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                  <Navigation className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Track the ride leader</p>
                  <p className="text-sm text-muted-foreground">
                    View their live location on Google Maps
                  </p>
                </div>
              </div>
              <Button
                asChild
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                <a
                  href={liveLocationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Open Live Location
                  <ExternalLink className="h-3 w-3 ml-2 opacity-70" />
                </a>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                <Navigation className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium">Ride in progress</p>
                <p className="text-sm text-muted-foreground">
                  The ride leader hasn&apos;t shared their live location yet
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
