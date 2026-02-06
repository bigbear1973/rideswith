'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, X, Instagram, Globe, ExternalLink } from 'lucide-react';

// Define all available social platforms
export const SOCIAL_PLATFORMS = {
  instagram: {
    name: 'Instagram',
    placeholder: '@username or profile URL',
    icon: (props: React.SVGProps<SVGSVGElement>) => <Instagram {...props} />,
    color: '#E4405F',
    urlPrefix: 'https://instagram.com/',
  },
  strava: {
    name: 'Strava',
    placeholder: 'Profile URL or athlete ID',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
    ),
    color: '#FC4C02',
    urlPrefix: 'https://strava.com/athletes/',
  },
  twitter: {
    name: 'X (Twitter)',
    placeholder: '@username or profile URL',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: '#000000',
    urlPrefix: 'https://x.com/',
  },
  youtube: {
    name: 'YouTube',
    placeholder: 'Channel URL',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    color: '#FF0000',
    urlPrefix: 'https://youtube.com/',
  },
  tiktok: {
    name: 'TikTok',
    placeholder: '@username or profile URL',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
    color: '#000000',
    urlPrefix: 'https://tiktok.com/@',
  },
  patreon: {
    name: 'Patreon',
    placeholder: 'Page URL',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
      </svg>
    ),
    color: '#FF424D',
    urlPrefix: 'https://patreon.com/',
  },
  kofi: {
    name: 'Ko-fi',
    placeholder: 'Page URL',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" />
      </svg>
    ),
    color: '#FF5E5B',
    urlPrefix: 'https://ko-fi.com/',
  },
  website: {
    name: 'Website',
    placeholder: 'https://your-website.com',
    icon: (props: React.SVGProps<SVGSVGElement>) => <Globe {...props} />,
    color: '#6B7280',
    urlPrefix: '',
  },
} as const;

export type SocialPlatformKey = keyof typeof SOCIAL_PLATFORMS;

interface SocialLinksPickerProps {
  values: Record<SocialPlatformKey, string>;
  onChange: (key: SocialPlatformKey, value: string) => void;
}

export function SocialLinksPicker({ values, onChange }: SocialLinksPickerProps) {
  const [activeLinks, setActiveLinks] = useState<SocialPlatformKey[]>(() => {
    // Initialize with platforms that already have values
    return (Object.keys(SOCIAL_PLATFORMS) as SocialPlatformKey[]).filter(
      (key) => values[key] && values[key].trim() !== ''
    );
  });

  const availablePlatforms = (Object.keys(SOCIAL_PLATFORMS) as SocialPlatformKey[]).filter(
    (key) => !activeLinks.includes(key)
  );

  const addLink = (platform: SocialPlatformKey) => {
    setActiveLinks([...activeLinks, platform]);
  };

  const removeLink = (platform: SocialPlatformKey) => {
    setActiveLinks(activeLinks.filter((p) => p !== platform));
    onChange(platform, '');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Social Links</Label>
        {availablePlatforms.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Link
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {availablePlatforms.map((platform) => {
                const config = SOCIAL_PLATFORMS[platform];
                const Icon = config.icon;
                return (
                  <DropdownMenuItem
                    key={platform}
                    onClick={() => addLink(platform)}
                    className="gap-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                    {config.name}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <p className="text-sm text-muted-foreground -mt-2">
        Connect your social profiles and creator platforms
      </p>

      {activeLinks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          No social links added yet. Click &quot;Add Link&quot; to add your profiles.
        </div>
      ) : (
        <div className="space-y-3">
          {activeLinks.map((platform) => {
            const config = SOCIAL_PLATFORMS[platform];
            const Icon = config.icon;
            return (
              <div key={platform} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={platform} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                    {config.name}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(platform)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove {config.name}</span>
                  </Button>
                </div>
                <Input
                  id={platform}
                  value={values[platform] || ''}
                  onChange={(e) => onChange(platform, e.target.value)}
                  placeholder={config.placeholder}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper to render social icons on profile pages
interface SocialIconsDisplayProps {
  links: Partial<Record<SocialPlatformKey, string | null>>;
  className?: string;
}

export function SocialIconsDisplay({ links, className = '' }: SocialIconsDisplayProps) {
  const activeLinks = (Object.entries(links) as [SocialPlatformKey, string | null][]).filter(
    ([, value]) => value && value.trim() !== ''
  );

  if (activeLinks.length === 0) return null;

  const getHref = (platform: SocialPlatformKey, value: string) => {
    if (value.startsWith('http')) return value;
    const config = SOCIAL_PLATFORMS[platform];
    if (platform === 'instagram') {
      return `https://instagram.com/${value.replace('@', '')}`;
    }
    if (platform === 'twitter') {
      return `https://x.com/${value.replace('@', '')}`;
    }
    if (platform === 'tiktok') {
      return `https://tiktok.com/@${value.replace('@', '')}`;
    }
    if (platform === 'strava') {
      return `https://strava.com/athletes/${value}`;
    }
    if (platform === 'website') {
      return value.startsWith('http') ? value : `https://${value}`;
    }
    return config.urlPrefix + value;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {activeLinks.map(([platform, value]) => {
        const config = SOCIAL_PLATFORMS[platform];
        const Icon = config.icon;
        return (
          <a
            key={platform}
            href={getHref(platform, value!)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={config.name}
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </div>
  );
}
