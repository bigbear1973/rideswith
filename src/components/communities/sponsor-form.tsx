'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, Trash2, GripVertical, ExternalLink, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface Sponsor {
  id: string;
  name: string;
  domain: string | null;
  description: string | null;
  website: string;
  logo: string | null;
  primaryColor: string | null;
  isActive: boolean;
  displayOrder: number;
}

interface SponsorFormProps {
  brandSlug: string;
  chapterSlug?: string; // Optional - if provided, creates chapter-level sponsor
  sponsor?: Sponsor;
  onSave: (sponsor: Sponsor) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function SponsorForm({ brandSlug, chapterSlug, sponsor, onSave, onCancel, onDelete }: SponsorFormProps) {
  const [name, setName] = useState(sponsor?.name || '');
  const [domain, setDomain] = useState(sponsor?.domain || '');
  const [website, setWebsite] = useState(sponsor?.website || '');
  const [logo, setLogo] = useState(sponsor?.logo || '');
  const [primaryColor, setPrimaryColor] = useState(sponsor?.primaryColor || '');
  const [isActive, setIsActive] = useState(sponsor?.isActive ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!sponsor;

  // Build base API path - either brand-level or chapter-level
  const getBasePath = () => {
    if (chapterSlug) {
      return `/api/communities/${brandSlug}/${chapterSlug}/sponsors`;
    }
    return `/api/communities/${brandSlug}/sponsors`;
  };

  const handleFetchFromBrandDev = async () => {
    if (!domain) return;
    setIsFetching(true);
    setError('');

    try {
      const basePath = getBasePath();
      const endpoint = isEditing ? `${basePath}/${sponsor.id}` : basePath;

      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing
        ? { refreshBranding: true }
        : { name: name || domain, domain, website: website || `https://${domain}` };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.logo) setLogo(data.logo);
        if (data.primaryColor) setPrimaryColor(data.primaryColor);
        if (!isEditing) {
          onSave(data);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch brand assets');
      }
    } catch {
      setError('Failed to fetch brand assets');
    } finally {
      setIsFetching(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'brand_assets');
      formData.append('folder', 'sponsor-logos');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setLogo(data.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const basePath = getBasePath();
      const endpoint = isEditing ? `${basePath}/${sponsor.id}` : basePath;

      const res = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          domain: domain || null,
          website,
          logo: logo || null,
          primaryColor: primaryColor || null,
          isActive,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSave(data);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !onDelete) return;
    if (!confirm('Are you sure you want to delete this sponsor?')) return;

    setIsLoading(true);
    try {
      const basePath = getBasePath();
      const res = await fetch(`${basePath}/${sponsor.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete');
      }
    } catch {
      setError('Failed to delete');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sponsor name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website URL *</Label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain">Domain (for Brand.dev lookup)</Label>
        <div className="flex gap-2">
          <Input
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleFetchFromBrandDev}
            disabled={!domain || isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Fetch Assets</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter a domain to auto-fetch logo and colors from Brand.dev
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-start gap-3">
            {logo ? (
              <div className="relative">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-12 w-12 object-contain rounded-lg bg-muted p-1"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-5 w-5"
                  onClick={() => setLogo('')}
                >
                  <span className="text-xs">×</span>
                </Button>
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                <Upload className="h-5 w-5" />
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                id="logo-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={isUploadingLogo}
              >
                {isUploadingLogo ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {logo ? 'Change' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryColor">Brand Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              id="primaryColor"
              value={primaryColor || '#6b7280'}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="isActive" className="cursor-pointer text-sm">
          Active (visible on ride pages)
        </Label>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {isEditing && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !name || !website}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add'}
          </Button>
        </div>
      </div>
    </form>
  );
}

interface SponsorListItemProps {
  sponsor: Sponsor;
  label: string;
  onEdit: (sponsor: Sponsor) => void;
}

export function SponsorListItem({ sponsor, label, onEdit }: SponsorListItemProps) {
  return (
    <Card
      className={`cursor-pointer hover:border-primary/50 transition-colors ${!sponsor.isActive ? 'opacity-60' : ''}`}
      onClick={() => onEdit(sponsor)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
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
            <p className="font-medium text-sm truncate">{sponsor.name}</p>
            <p className="text-xs text-muted-foreground truncate">{sponsor.website}</p>
          </div>
          {!sponsor.isActive && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Hidden
            </span>
          )}
          <a
            href={sponsor.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
