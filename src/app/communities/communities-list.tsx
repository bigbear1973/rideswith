'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Plus, UsersRound, Trophy } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

const COMMUNITY_TYPE_LABELS: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  BRAND: { label: 'Brand', icon: Building2, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  CLUB: { label: 'Club', icon: Users, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  TEAM: { label: 'Team', icon: Trophy, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  GROUP: { label: 'Group', icon: UsersRound, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

const DISCIPLINE_OPTIONS = [
  { value: '', label: 'All Disciplines' },
  { value: 'Road', label: 'Road' },
  { value: 'Gravel', label: 'Gravel' },
  { value: 'Mountain Bike', label: 'Mountain Bike' },
  { value: 'Mixed (Road & Gravel)', label: 'Mixed' },
];

// Arrow icon component
const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

interface Brand {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  discipline: string | null;
  logo: string | null;
  logoDark: string | null;
  primaryColor: string | null;
  chapters: Array<{
    id: string;
    name: string;
    slug: string;
    city: string;
    memberCount: number;
    rideCount: number;
  }>;
  _count: {
    chapters: number;
  };
}

interface CommunitiesListProps {
  brands: Brand[];
}

export function CommunitiesList({ brands }: CommunitiesListProps) {
  const [disciplineFilter, setDisciplineFilter] = useState('');

  const filteredBrands = brands.filter((brand) => {
    if (!disciplineFilter) return true;
    return brand.discipline === disciplineFilter;
  });

  return (
    <>
      {/* Discipline Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {DISCIPLINE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setDisciplineFilter(option.value)}
            className={`px-4 py-2 text-sm rounded-full border transition-colors ${
              disciplineFilter === option.value
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-border hover:border-foreground/50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Community List */}
      <div className="w-full border-t border-border">
        {filteredBrands.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">
              {disciplineFilter ? `No ${disciplineFilter.toLowerCase()} communities yet` : 'No communities yet'}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {disciplineFilter ? 'Try a different filter or create the first one' : 'Be the first to create a brand, club, or group'}
            </p>
            <Link href="/communities/create" className="cta-link">
              <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                <Plus className="w-2.5 h-2.5" />
              </div>
              Create Your Community
            </Link>
          </div>
        ) : (
          <>
            {filteredBrands.map((brand) => {
              const memberCount = brand.chapters.reduce((sum, c) => sum + c.memberCount, 0);

              return (
                <Link
                  key={brand.id}
                  href={`/communities/${brand.slug}`}
                  className="list-item-editorial group"
                >
                  {/* Logo */}
                  <div className="hidden md:flex items-center justify-center">
                    <BrandLogo
                      logo={brand.logo}
                      logoDark={brand.logoDark}
                      name={brand.name}
                      primaryColor={brand.primaryColor}
                      className="h-10 w-10"
                    />
                  </div>

                  {/* Content */}
                  <div className="pr-6">
                    {/* Mobile: Show type label */}
                    {brand.type && COMMUNITY_TYPE_LABELS[brand.type] && (
                      <div className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        {COMMUNITY_TYPE_LABELS[brand.type].label}
                        {brand.discipline && ` · ${brand.discipline}`}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg md:text-[22px] font-normal uppercase">
                        {brand.name}
                      </span>
                      {brand.type && COMMUNITY_TYPE_LABELS[brand.type] && (
                        <Badge
                          variant="secondary"
                          className={`hidden md:inline-flex text-xs ${COMMUNITY_TYPE_LABELS[brand.type].color}`}
                        >
                          {COMMUNITY_TYPE_LABELS[brand.type].label}
                        </Badge>
                      )}
                      {brand.discipline && (
                        <Badge
                          variant="outline"
                          className="hidden md:inline-flex text-xs"
                        >
                          {brand.discipline}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 items-center">
                      <span className="after:content-['•'] after:ml-3 after:opacity-40">
                        {brand._count.chapters} {brand._count.chapters === 1 ? 'Chapter' : 'Chapters'}
                      </span>
                      <span className="after:content-['•'] after:ml-3 after:opacity-40">
                        {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                      </span>
                      {brand.chapters.length > 0 && (
                        <span>
                          {brand.chapters.slice(0, 3).map(c => c.city).join(', ')}
                          {brand.chapters.length > 3 && ` +${brand.chapters.length - 3}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow button */}
                  <div className="icon-btn-circle transition-all group-hover:bg-foreground">
                    <ArrowIcon className="w-4 h-4 stroke-foreground group-hover:stroke-background transition-all" />
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>

      {/* Create Community CTA - below list */}
      <Link href="/communities/create" className="cta-link mt-8">
        <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
          <Plus className="w-2.5 h-2.5" />
        </div>
        Create Community
      </Link>
    </>
  );
}
