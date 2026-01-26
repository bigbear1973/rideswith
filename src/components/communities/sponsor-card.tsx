'use client';

import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Sponsor {
  id: string;
  name: string;
  website: string;
  logo: string | null;
  primaryColor: string | null;
  description: string | null;
}

interface SponsorCardProps {
  sponsor: Sponsor;
  label?: string;
}

export function SponsorCard({ sponsor, label = 'Sponsor' }: SponsorCardProps) {
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
                className="h-10 w-10 object-contain rounded-lg bg-muted p-1"
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
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="font-medium text-sm truncate">{sponsor.name}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </div>
        </CardContent>
      </a>
    </Card>
  );
}
