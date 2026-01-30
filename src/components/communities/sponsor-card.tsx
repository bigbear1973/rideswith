'use client';

import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type SponsorSize = 'SMALL' | 'MEDIUM' | 'LARGE';

interface Sponsor {
  id: string;
  name: string;
  website: string;
  logo: string | null;
  backdrop: string | null;
  primaryColor: string | null;
  description: string | null;
  displaySize: SponsorSize;
}

interface SponsorCardProps {
  sponsor: Sponsor;
}

export function SponsorCard({ sponsor }: SponsorCardProps) {
  const size = sponsor.displaySize || 'SMALL';

  // Large: Featured with backdrop image
  if (size === 'LARGE') {
    return (
      <Card className="overflow-hidden">
        <a
          href={sponsor.website}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          {/* Backdrop image */}
          {sponsor.backdrop ? (
            <div className="relative h-24 w-full">
              <img
                src={sponsor.backdrop}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div
              className="h-24 w-full"
              style={{ backgroundColor: sponsor.primaryColor || '#1f2937' }}
            />
          )}
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {sponsor.logo ? (
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="h-12 w-12 object-contain rounded-lg bg-white dark:bg-neutral-800 border border-border p-1.5 -mt-8 relative z-10 shadow-md"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-lg font-bold text-white -mt-8 relative z-10 shadow-md border"
                  style={{ backgroundColor: sponsor.primaryColor || '#6b7280' }}
                >
                  {sponsor.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-base">{sponsor.name}</p>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </div>
                {sponsor.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {sponsor.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </a>
      </Card>
    );
  }

  // Medium: Logo + name + description
  if (size === 'MEDIUM') {
    return (
      <Card className="overflow-hidden">
        <a
          href={sponsor.website}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {sponsor.logo ? (
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="h-12 w-12 object-contain rounded-lg bg-white dark:bg-neutral-800 border border-border p-1.5"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: sponsor.primaryColor || '#6b7280' }}
                >
                  {sponsor.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{sponsor.name}</p>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </div>
                {sponsor.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {sponsor.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </a>
      </Card>
    );
  }

  // Small: Compact logo + name only (default)
  return (
    <Card className="overflow-hidden">
      <a
        href={sponsor.website}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {sponsor.logo ? (
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-10 w-10 object-contain rounded-lg bg-white dark:bg-neutral-800 border border-border p-1.5"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: sponsor.primaryColor || '#6b7280' }}
              >
                {sponsor.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{sponsor.name}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </div>
        </CardContent>
      </a>
    </Card>
  );
}
