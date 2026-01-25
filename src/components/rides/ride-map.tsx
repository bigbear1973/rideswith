'use client';

import { Map } from '@/components/maps';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface RideMapProps {
  location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
}

export function RideMap({ location }: RideMapProps) {
  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <Card className="overflow-hidden">
      {hasApiKey ? (
        <Map
          center={{ lat: location.lat, lng: location.lng }}
          zoom={15}
          className="aspect-video"
        />
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <div className="text-center p-4">
            <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Map requires Google Maps API key
            </p>
          </div>
        </div>
      )}
      <CardContent className="p-3 border-t">
        <p className="text-sm text-muted-foreground">{location.address}</p>
      </CardContent>
    </Card>
  );
}
