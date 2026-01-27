'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, Loader2, Check, AlertCircle, Camera, Mail } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { SocialLinksPicker, SocialPlatformKey } from '@/components/profile/social-links-picker';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  slug: string | null;
  bio: string | null;
  location: string | null;
  instagram: string | null;
  strava: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
  patreon: string | null;
  kofi: string | null;
  website: string | null;
  showEmail: boolean;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    bio: '',
    location: '',
    instagram: '',
    strava: '',
    twitter: '',
    youtube: '',
    tiktok: '',
    patreon: '',
    kofi: '',
    website: '',
    image: '',
    showEmail: false,
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile/edit');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setFormData({
            name: data.name || '',
            slug: data.slug || '',
            bio: data.bio || '',
            location: data.location || '',
            instagram: data.instagram || '',
            strava: data.strava || '',
            twitter: data.twitter || '',
            youtube: data.youtube || '',
            tiktok: data.tiktok || '',
            patreon: data.patreon || '',
            kofi: data.kofi || '',
            website: data.website || '',
            image: data.image || '',
            showEmail: data.showEmail || false,
          });
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  // Debounced slug check
  useEffect(() => {
    if (!formData.slug || formData.slug === profile?.slug) {
      setSlugError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const response = await fetch(`/api/profile/check-slug?slug=${encodeURIComponent(formData.slug)}`);
        const data = await response.json();
        if (!data.available) {
          setSlugError('This username is already taken');
        } else if (!data.valid) {
          setSlugError('Username can only contain letters, numbers, and hyphens');
        } else {
          setSlugError(null);
        }
      } catch {
        // Ignore errors
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug, profile?.slug]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error('Image upload not configured');
      }

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('upload_preset', 'profile_photos');
      uploadData.append('folder', 'profile-photos');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: uploadData }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setFormData({ ...formData, image: data.secure_url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugError) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const initials = profile.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || profile.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen pb-8">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/profile"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to profile
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your profile information and customize your public URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20">
                    {(formData.image || profile.image) && (
                      <AvatarImage src={formData.image || profile.image || ''} alt={profile.name || ''} />
                    )}
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                    {isUploadingImage ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </label>
                </div>
                <div>
                  <p className="font-medium">{profile.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Click the avatar to upload a new photo
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              {/* Custom URL */}
              <div className="space-y-2">
                <Label htmlFor="slug">Custom Profile URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">rideswith.com/u/</span>
                  <div className="relative flex-1">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="username"
                      className={slugError ? 'border-destructive' : ''}
                    />
                    {isCheckingSlug && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!isCheckingSlug && formData.slug && !slugError && formData.slug !== profile.slug && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
                {slugError && (
                  <p className="text-sm text-destructive">{slugError}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Choose a unique username for your public profile URL
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Privacy</Label>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="showEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Show email on profile
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Display your email address on your public profile
                    </p>
                  </div>
                  <Switch
                    id="showEmail"
                    checked={formData.showEmail}
                    onCheckedChange={(checked) => setFormData({ ...formData, showEmail: checked })}
                  />
                </div>
              </div>

              {/* Social Links */}
              <SocialLinksPicker
                values={{
                  instagram: formData.instagram,
                  strava: formData.strava,
                  twitter: formData.twitter,
                  youtube: formData.youtube,
                  tiktok: formData.tiktok,
                  patreon: formData.patreon,
                  kofi: formData.kofi,
                  website: formData.website,
                }}
                onChange={(key: SocialPlatformKey, value: string) => {
                  setFormData({ ...formData, [key]: value });
                }}
              />

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
                    Profile updated successfully! Redirecting...
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button type="submit" disabled={isSaving || !!slugError}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/profile')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
