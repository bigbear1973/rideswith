'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, Trash2, GripVertical, ExternalLink, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

type SponsorSize = 'SMALL' | 'MEDIUM' | 'LARGE';

interface Sponsor {
  id: string;
  name: string;
  domain: string | null;
  description: string | null;
  website: string;
  logo: string | null;
  backdrop: string | null;
  primaryColor: string | null;
  displaySize: SponsorSize;
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

const SIZE_OPTIONS: { value: SponsorSize; label: string; description: string }[] = [
  { value: 'SMALL', label: 'Small', description: 'Logo and name only' },
  { value: 'MEDIUM', label: 'Medium', description: 'Logo, name, and description' },
  { value: 'LARGE', label: 'Large', description: 'Featured with backdrop image' },
];

export function SponsorForm({ brandSlug, chapterSlug, sponsor, onSave, onCancel, onDelete }: SponsorFormProps) {
  const [name, setName] = useState(sponsor?.name || '');
  const [domain, setDomain] = useState(sponsor?.domain || '');
  const [website, setWebsite] = useState(sponsor?.website || '');
  const [logo, setLogo] = useState(sponsor?.logo || '');
  const [backdrop, setBackdrop] = useState(sponsor?.backdrop || '');
  const [description, setDescription] = useState(sponsor?.description || '');
  const [primaryColor, setPrimaryColor] = useState(sponsor?.primaryColor || '');
  const [displaySize, setDisplaySize] = useState<SponsorSize>(sponsor?.displaySize || 'SMALL');
  const [isActive, setIsActive] = useState(sponsor?.isActive ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBackdrop, setIsUploadingBackdrop] = useState(false);
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
      // For editing, use PUT with refreshBranding flag
      // For creating, we just fetch the assets directly without creating the sponsor
      if (isEditing) {
        const basePath = getBasePath();
        const res = await fetch(`${basePath}/${sponsor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshBranding: true }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.logo) setLogo(data.logo);
          if (data.backdrop) setBackdrop(data.backdrop);
          if (data.primaryColor) setPrimaryColor(data.primaryColor);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to fetch brand assets');
        }
      } else {
        // For new sponsors, fetch assets via a dedicated endpoint that just returns assets
        // Use the brandfetch API endpoint instead
        const res = await fetch(`/api/brandfetch?domain=${encodeURIComponent(domain)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.logo) setLogo(data.logo);
          if (data.backdrop) setBackdrop(data.backdrop);
          if (data.primaryColor) setPrimaryColor(data.primaryColor);
          // Auto-fill name if empty
          if (!name && data.name) setName(data.name);
          // Auto-fill website if empty
          if (!website) setWebsite(`https://${domain}`);
        } else {
          setError('Failed to fetch brand assets');
        }
      }
    } catch {
      setError('Failed to fetch brand assets');
    } finally {
      setIsFetching(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'backdrop') => {
    if (type === 'logo') setIsUploadingLogo(true);
    else setIsUploadingBackdrop(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'brand_assets');
      formData.append('folder', type === 'logo' ? 'sponsor-logos' : 'sponsor-backdrops');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      if (type === 'logo') setLogo(data.secure_url);
      else setBackdrop(data.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to upload ${type}`);
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      else setIsUploadingBackdrop(false);
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
          description: description || null,
          website,
          logo: logo || null,
          backdrop: backdrop || null,
          primaryColor: primaryColor || null,
          displaySize,
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

      {/* Display Size Selector */}
      <div className="space-y-2">
        <Label>Display Size</Label>
        <div className="grid grid-cols-3 gap-2">
          {SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDisplaySize(option.value)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                displaySize === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="font-medium text-sm">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

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

      {/* Description - for Medium and Large */}
      {(displaySize === 'MEDIUM' || displaySize === 'LARGE') && (
        <div className="space-y-2">
          <Label htmlFor="description">Ad Copy / Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 150))}
            placeholder="Short description or tagline (max 150 chars)"
            maxLength={150}
          />
          <p className="text-xs text-muted-foreground text-right">
            {description.length}/150
          </p>
        </div>
      )}

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

      {/* Backdrop Image - for Large only */}
      {displaySize === 'LARGE' && (
        <div className="space-y-2">
          <Label>Backdrop Image</Label>
          {backdrop ? (
            <div className="relative">
              <img
                src={backdrop}
                alt="Backdrop"
                className="w-full h-24 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => setBackdrop('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="w-full h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Upload className="h-6 w-6 mx-auto mb-1" />
                <span className="text-xs">Wide banner image</span>
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            id="backdrop-upload"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, 'backdrop');
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('backdrop-upload')?.click()}
            disabled={isUploadingBackdrop}
          >
            {isUploadingBackdrop ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {backdrop ? 'Change Backdrop' : 'Upload Backdrop'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Recommended: Wide image, 800x200px or larger
          </p>
        </div>
      )}

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
                  if (file) handleImageUpload(file, 'logo');
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
  onEdit: (sponsor: Sponsor) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const SIZE_LABELS: Record<SponsorSize, string> = {
  SMALL: 'S',
  MEDIUM: 'M',
  LARGE: 'L',
};

export function SponsorListItem({ sponsor, onEdit, isDragging, dragHandleProps }: SponsorListItemProps) {
  return (
    <Card
      className={`cursor-pointer hover:border-primary/50 transition-colors ${!sponsor.isActive ? 'opacity-60' : ''} ${isDragging ? 'shadow-lg border-primary' : ''}`}
      onClick={() => onEdit(sponsor)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
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
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium">
            {SIZE_LABELS[sponsor.displaySize] || 'S'}
          </span>
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

// Reorderable Sponsor List with drag-and-drop
interface SponsorListProps {
  sponsors: Sponsor[];
  onEdit: (sponsor: Sponsor) => void;
  onReorder: (sponsors: Sponsor[]) => void;
}

export function SponsorList({ sponsors, onEdit, onReorder }: SponsorListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newSponsors = [...sponsors];
    const [draggedItem] = newSponsors.splice(draggedIndex, 1);
    newSponsors.splice(dropIndex, 0, draggedItem);

    // Update displayOrder for all items
    const reorderedSponsors = newSponsors.map((s, i) => ({
      ...s,
      displayOrder: i,
    }));

    onReorder(reorderedSponsors);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (sponsors.length === 0) return null;

  return (
    <div className="space-y-2">
      {sponsors.map((sponsor, index) => (
        <div
          key={sponsor.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`transition-transform ${
            dragOverIndex === index && draggedIndex !== null
              ? draggedIndex < index
                ? 'translate-y-1'
                : '-translate-y-1'
              : ''
          }`}
        >
          <SponsorListItem
            sponsor={sponsor}
            onEdit={onEdit}
            isDragging={draggedIndex === index}
          />
        </div>
      ))}
    </div>
  );
}
