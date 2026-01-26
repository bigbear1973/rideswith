'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChevronLeft, Loader2, Check, AlertCircle, RefreshCw, Trash2, Instagram, Twitter, Facebook, Youtube, Upload, X, Building2, Users, UsersRound, Trophy, Plus, Megaphone } from 'lucide-react';
import { SponsorForm, SponsorList } from '@/components/communities';

interface Brand {
  id: string;
  name: string;
  slug: string;
  type: 'BRAND' | 'CLUB' | 'TEAM' | 'GROUP';
  domain: string | null;
  description: string | null;
  logo: string | null;
  logoIcon: string | null;
  backdrop: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  createdById: string | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  strava: string | null;
  youtube: string | null;
  sponsorLabel: string | null;
  hidePresentedBy: boolean;
  sponsorsEnabled: boolean;
}

interface Sponsor {
  id: string;
  name: string;
  domain: string | null;
  description: string | null;
  website: string;
  logo: string | null;
  backdrop: string | null;
  primaryColor: string | null;
  displaySize: 'SMALL' | 'MEDIUM' | 'LARGE';
  isActive: boolean;
  displayOrder: number;
}

const COMMUNITY_TYPES = [
  { value: 'BRAND', label: 'Brand', description: 'Commercial cycling brand (Rapha, Straede)', icon: Building2 },
  { value: 'CLUB', label: 'Club', description: 'Cycling club with members', icon: Users },
  { value: 'TEAM', label: 'Team', description: 'Racing or competitive team', icon: Trophy },
  { value: 'GROUP', label: 'Group', description: 'Informal riding group', icon: UsersRound },
] as const;

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [brand, setBrand] = useState<Brand | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorLabel, setSponsorLabel] = useState<'sponsors' | 'partners' | 'ads'>('sponsors');
  const [hidePresentedBy, setHidePresentedBy] = useState(false);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [sponsorsEnabled, setSponsorsEnabled] = useState(false);
  const isPlatformAdmin = session?.user?.role === 'PLATFORM_ADMIN';
  const [formData, setFormData] = useState({
    name: '',
    type: 'BRAND' as 'BRAND' | 'CLUB' | 'TEAM' | 'GROUP',
    domain: '',
    description: '',
    logo: '',
    backdrop: '',
    primaryColor: '',
    instagram: '',
    twitter: '',
    facebook: '',
    strava: '',
    youtube: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/communities/${slug}/edit`);
    }
  }, [status, router, slug]);

  useEffect(() => {
    async function fetchBrand() {
      try {
        const response = await fetch(`/api/communities/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setBrand(data);
          setFormData({
            name: data.name || '',
            type: data.type || 'BRAND',
            domain: data.domain || '',
            description: data.description || '',
            logo: data.logo || '',
            backdrop: data.backdrop || '',
            primaryColor: data.primaryColor || '',
            instagram: data.instagram || '',
            twitter: data.twitter || '',
            facebook: data.facebook || '',
            strava: data.strava || '',
            youtube: data.youtube || '',
          });
          setSponsorLabel((data.sponsorLabel as 'sponsors' | 'partners' | 'ads') || 'sponsors');
          setHidePresentedBy(data.hidePresentedBy || false);
          setSponsorsEnabled(data.sponsorsEnabled || false);

          // Check ownership
          if (data.createdById !== session?.user?.id) {
            setError("You don't have permission to edit this brand");
          }

          // Fetch sponsors
          const sponsorsRes = await fetch(`/api/communities/${slug}/sponsors?all=true`);
          if (sponsorsRes.ok) {
            const sponsorsData = await sponsorsRes.json();
            setSponsors(sponsorsData.sponsors || []);
          }
        } else {
          setError('Brand not found');
        }
      } catch {
        setError('Failed to load brand');
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user && slug) {
      fetchBrand();
    }
  }, [session, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/communities/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, sponsorLabel, hidePresentedBy }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update brand');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/communities/${slug}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update brand');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshBranding = async () => {
    if (!brand?.domain) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/communities/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshBranding: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to refresh branding');
      }

      const updatedBrand = await response.json();
      setBrand(updatedBrand);
      // Update formData with refreshed values
      setFormData(prev => ({
        ...prev,
        logo: updatedBrand.logo || '',
        backdrop: updatedBrand.backdrop || '',
        primaryColor: updatedBrand.primaryColor || '',
      }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh branding');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'backdrop') => {
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingBackdrop(true);
    setError(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', 'brand_assets');
      formDataUpload.append('folder', `brand-${type}s`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formDataUpload }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFormData(prev => ({ ...prev, [type]: data.secure_url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBackdrop(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/communities/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete brand');
      }

      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete brand');
      setIsDeleting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand || brand.createdById !== session?.user?.id) {
    return (
      <div className="min-h-screen pb-8">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "You don't have permission to edit this brand"}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/profile">Back to profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href={`/communities/${slug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to brand
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Edit Community</CardTitle>
            <CardDescription>
              Update your brand information and branding assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Brand Preview */}
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
                {formData.logo || brand.logo ? (
                  <img
                    src={formData.logo || brand.logo || ''}
                    alt={brand.name}
                    className="w-16 h-16 rounded-lg object-contain"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: formData.primaryColor || brand.primaryColor || '#6366f1' }}
                  >
                    {brand.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{brand.name}</p>
                  <p className="text-sm text-muted-foreground">
                    rideswith.com/communities/{brand.slug}
                  </p>
                  {(formData.primaryColor || brand.primaryColor) && (
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: formData.primaryColor || brand.primaryColor || undefined }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {formData.primaryColor || brand.primaryColor}
                      </span>
                    </div>
                  )}
                </div>
                {brand.domain && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshBranding}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Refresh from Brand.dev</span>
                  </Button>
                )}
              </div>

              {/* Community Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Type</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'BRAND' | 'CLUB' | 'TEAM' | 'GROUP' })}
                  className="grid gap-3"
                >
                  {COMMUNITY_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.type === type.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem value={type.value} id={type.value} />
                      <type.icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Brand name"
                  required
                />
              </div>

              {/* Domain */}
              <div className="space-y-2">
                <Label htmlFor="domain">Domain (for Brand.dev)</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="example.com"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the brand&apos;s domain to auto-fetch logo and colors from Brand.dev
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us about this brand..."
                  rows={3}
                />
              </div>

              {/* Branding Assets */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Branding Assets</Label>
                <p className="text-sm text-muted-foreground -mt-2">
                  Upload custom images or enter a domain above to auto-fetch from Brand.dev
                </p>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-start gap-4">
                    {formData.logo ? (
                      <div className="relative">
                        <img
                          src={formData.logo}
                          alt="Logo"
                          className="w-20 h-20 rounded-lg object-contain border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => setFormData({ ...formData, logo: '' })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                        <Building2 className="h-8 w-8" />
                      </div>
                    )}
                    <div className="flex-1">
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
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload Logo
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: Square image, 200x200px or larger
                      </p>
                    </div>
                  </div>
                </div>

                {/* Backdrop Upload */}
                <div className="space-y-2">
                  <Label>Backdrop Image</Label>
                  {formData.backdrop ? (
                    <div className="relative">
                      <img
                        src={formData.backdrop}
                        alt="Backdrop"
                        className="w-full h-32 rounded-lg object-cover border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setFormData({ ...formData, backdrop: '' })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2" />
                        <span className="text-sm">No backdrop image</span>
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
                    disabled={uploadingBackdrop}
                  >
                    {uploadingBackdrop ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Backdrop
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended: Wide image, 1200x400px or larger
                  </p>
                </div>

                {/* Primary Color */}
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primaryColor"
                      value={formData.primaryColor || '#6366f1'}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                    {formData.primaryColor && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, primaryColor: '' })}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Social Links</Label>
                <p className="text-sm text-muted-foreground -mt-2">
                  Add links to your brand&apos;s social profiles
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@handle or URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      X / Twitter
                    </Label>
                    <Input
                      id="twitter"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="@handle or URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="Page URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strava" className="flex items-center gap-2">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                      </svg>
                      Strava Club
                    </Label>
                    <Input
                      id="strava"
                      value={formData.strava}
                      onChange={(e) => setFormData({ ...formData, strava: e.target.value })}
                      placeholder="Club URL"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="youtube" className="flex items-center gap-2">
                      <Youtube className="h-4 w-4" />
                      YouTube
                    </Label>
                    <Input
                      id="youtube"
                      value={formData.youtube}
                      onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                      placeholder="Channel URL"
                    />
                  </div>
                </div>
              </div>

              {/* Ride Page Display Settings */}
              <div className="space-y-4 border-t pt-6">
                <div>
                  <Label className="text-base font-semibold">Ride Page Display</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Control how your community appears on ride detail pages
                  </p>
                </div>

                {/* Hide Presented By toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="hidePresentedBy" className="cursor-pointer">
                      Hide &quot;Presented by&quot; Card
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Remove the sidebar card that links to your external website
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="hidePresentedBy"
                    checked={hidePresentedBy}
                    onChange={(e) => setHidePresentedBy(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* Sponsors/Partners/Ads Section */}
              {(sponsorsEnabled || isPlatformAdmin) ? (
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        {sponsorLabel === 'sponsors' ? 'Sponsors' : sponsorLabel === 'partners' ? 'Partners' : 'Ads'}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add sponsors or partners that appear on ride pages
                      </p>
                    </div>
                  </div>

                  {/* Label Type Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm">What do you call these?</Label>
                    <div className="flex gap-2">
                      {(['sponsors', 'partners', 'ads'] as const).map((label) => (
                        <Button
                          key={label}
                          type="button"
                          variant={sponsorLabel === label ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSponsorLabel(label)}
                          className="capitalize"
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Sponsors List */}
                  <SponsorList
                    sponsors={sponsors}
                    onEdit={(s) => {
                      setEditingSponsor(s);
                      setShowSponsorForm(true);
                    }}
                    onReorder={async (reorderedSponsors) => {
                      setSponsors(reorderedSponsors);
                      // Save the new order to the backend
                      for (const sponsor of reorderedSponsors) {
                        await fetch(`/api/communities/${slug}/sponsors/${sponsor.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ displayOrder: sponsor.displayOrder }),
                        });
                      }
                    }}
                  />

                  {/* Add/Edit Sponsor Form */}
                  {showSponsorForm ? (
                    <Card className="border-primary/50">
                      <CardContent className="pt-4">
                        <SponsorForm
                          brandSlug={slug}
                          sponsor={editingSponsor || undefined}
                          onSave={(sponsor) => {
                            if (editingSponsor) {
                              setSponsors(sponsors.map((s) => s.id === sponsor.id ? sponsor : s));
                            } else {
                              setSponsors([...sponsors, sponsor]);
                            }
                            setShowSponsorForm(false);
                            setEditingSponsor(null);
                          }}
                          onCancel={() => {
                            setShowSponsorForm(false);
                            setEditingSponsor(null);
                          }}
                          onDelete={editingSponsor ? () => {
                            setSponsors(sponsors.filter((s) => s.id !== editingSponsor.id));
                            setShowSponsorForm(false);
                            setEditingSponsor(null);
                          } : undefined}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingSponsor(null);
                        setShowSponsorForm(true);
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add {sponsorLabel.slice(0, -1)}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        Sponsors
                      </Label>
                    </div>
                  </div>
                  <Alert>
                    <Megaphone className="h-4 w-4" />
                    <AlertDescription>
                      Want to add sponsors to your rides? Contact us to enable this feature for your community.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <Check className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Brand updated successfully!
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={isDeleting}>
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete Brand
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Brand</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{brand.name}&quot;? This will also delete all associated chapters. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/communities/${slug}`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
