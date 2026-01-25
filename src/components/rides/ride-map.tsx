'use client';

import { Map } from '@/components/maps';
import { Card, CardContent } from '@/components/ui/card';

interface RideMapProps {
  location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
}

export function RideMap({ location }: RideMapProps) {
  return (
    <Card className="overflow-hidden">
      <Map
        center={{ lat: location.lat, lng: location.lng }}
        zoom={15}
        className="aspect-video"
      />
      <CardContent className="p-3 border-t">
        <p className="text-sm text-muted-foreground">{location.address}</p>
      </CardContent>
    </Card>
  );
}
