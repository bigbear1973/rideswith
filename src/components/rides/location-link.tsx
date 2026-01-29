'use client';

import { ReactNode } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Clean SVG icons matching Lucide style
const AppleMapsIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const GoogleMapsIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84.95 1.54 2.2 2.86 3.16 4.4.47.75.81 1.45 1.17 2.26L12 24l1.26-3.5c.36-.81.7-1.51 1.17-2.26.96-1.54 2.21-2.86 3.16-4.4A6.98 6.98 0 0 0 19 9c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="3" />
  </svg>
);

const WazeIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="8.5" cy="10" r="1" fill="currentColor" />
    <circle cx="15.5" cy="10" r="1" fill="currentColor" />
    <path d="M8 15c1.5 1.5 6.5 1.5 8 0" />
  </svg>
);

interface LocationLinkProps {
  locationName: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  compact?: boolean;
}

interface MapLink {
  name: string;
  icon: ReactNode;
  url: string;
}

export function LocationLink({
  locationName,
  locationAddress,
  latitude,
  longitude,
  compact = false,
}: LocationLinkProps) {
  const coords = `${latitude},${longitude}`;

  // Map app URLs with clean icons
  const mapLinks: MapLink[] = [
    {
      name: 'Apple Maps',
      icon: <AppleMapsIcon />,
      url: `https://maps.apple.com/?daddr=${coords}&dirflg=d`,
    },
    {
      name: 'Google Maps',
      icon: <GoogleMapsIcon />,
      url: `https://www.google.com/maps/dir/?api=1&destination=${coords}`,
    },
    {
      name: 'Waze',
      icon: <WazeIcon />,
      url: `https://waze.com/ul?ll=${coords}&navigate=yes`,
    },
  ];

  const handleSelect = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Truncate address for display
  const displayAddress = locationAddress.split(',').slice(0, 3).join(',');

  // Compact layout for editorial stat rows
  if (compact) {
    return (
      <div className="text-right">
        <p className="font-medium">{locationName}</p>
        <p className="text-sm text-muted-foreground truncate">{displayAddress}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <Navigation className="h-3 w-3 mr-1" />
              Directions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Open in...
            </div>
            {mapLinks.map((link) => (
              <DropdownMenuItem
                key={link.name}
                onClick={() => handleSelect(link.url)}
                className="cursor-pointer"
              >
                <span className="mr-2 text-muted-foreground">{link.icon}</span>
                {link.name}
                <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <MapPin className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{locationName}</p>
        <p className="text-sm text-muted-foreground truncate">{displayAddress}</p>
        {/* Directions button - explicit tap target */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-primary hover:text-primary/80"
            >
              <Navigation className="h-3.5 w-3.5 mr-1" />
              Get directions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Open in...
            </div>
            {mapLinks.map((link) => (
              <DropdownMenuItem
                key={link.name}
                onClick={() => handleSelect(link.url)}
                className="cursor-pointer"
              >
                <span className="mr-2 text-muted-foreground">{link.icon}</span>
                {link.name}
                <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
