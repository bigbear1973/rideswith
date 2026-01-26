'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, Loader2, Check, AlertCircle, Plus, Megaphone, Settings } from 'lucide-react';
import { SponsorForm, SponsorListItem } from '@/components/communities';

interface Chapter {
  id: string;
  name: string;
  slug: string;
  city: string;
  sponsorLabel: string | null;
  brand: {
    id: string;
    name: string;
    slug: string;
    sponsorLabel: string | null;
  };
  members: Array<{
    id: string;
    role: string;
    userId: string;
  }>;
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

export default function EditChapterPage() {
  const router = useRouter();
  const params = useParams();
  const brandSlug = params.slug as string;
  const chapterSlug = params.chapter as string;
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorLabel, setSponsorLabel] = useState<'sponsors' | 'partners' | 'ads' | 'inherit'>('inherit');
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    loadChapter();
  }, [session, status, brandSlug, chapterSlug]);

  const loadChapter = async () => {
    try {
      // Fetch brand first to get chapter ID
      const brandRes = await fetch(`/api/communities/${brandSlug}`);
      if (!brandRes.ok) {
        setError('Community not found');
        setIsLoading(false);
        return;
      }
      const brandData = await brandRes.json();

      // Find chapter in brand
      const chapterData = brandData.chapters?.find(
        (c: { slug: string }) => c.slug === chapterSlug
      );
      if (!chapterData) {
        setError('Chapter not found');
        setIsLoading(false);
        return;
      }

      // Fetch full chapter data
      const chapterRes = await fetch(`/api/chapters/${chapterData.id}`);
      if (chapterRes.ok) {
        const fullChapter = await chapterRes.json();
        setChapter({
          ...fullChapter,
          brand: {
            id: brandData.id,
            name: brandData.name,
            slug: brandData.slug,
            sponsorLabel: brandData.sponsorLabel,
          },
        });
        setFormData({
          name: fullChapter.name || '',
          city: fullChapter.city || '',
        });
        // Set sponsor label - 'inherit' if null
        setSponsorLabel(fullChapter.sponsorLabel || 'inherit');

        // Check permission
        const isAdmin = fullChapter.members?.some(
          (m: { userId: string; role: string }) =>
            m.userId === session?.user?.id &&
            ['OWNER', 'ADMIN', 'LEAD'].includes(m.role)
        );
        const isBrandOwner = brandData.createdById === session?.user?.id;

        if (!isAdmin && !isBrandOwner) {
          setError("You don't have permission to edit this chapter");
        }

        // Fetch sponsors
        const sponsorsRes = await fetch(
          `/api/communities/${brandSlug}/${chapterSlug}/sponsors?all=true`
        );
        if (sponsorsRes.ok) {
          const sponsorsData = await sponsorsRes.json();
          setSponsors(sponsorsData.sponsors || []);
        }
      } else {
        setError('Chapter not found');
      }
    } catch {
      setError('Failed to load chapter');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!chapter) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/chapters/${chapter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sponsorLabel: sponsorLabel === 'inherit' ? null : sponsorLabel,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update chapter');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Get effective label (chapter's own or inherited from brand)
  const effectiveLabel =
    sponsorLabel !== 'inherit'
      ? sponsorLabel
      : chapter?.brand.sponsorLabel || 'sponsors';

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Chapter not found</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button asChild>
            <Link href={`/communities/${brandSlug}`}>Back to community</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="mx-auto max-w-2xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/communities/${brandSlug}/${chapterSlug}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to {chapter.name}
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Chapter Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            {chapter.brand.name} · {chapter.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your chapter details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Chapter Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Leipzig"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Leipzig, Germany"
                />
              </div>
            </div>

            {/* Sponsors/Partners/Ads Section */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    {effectiveLabel === 'sponsors'
                      ? 'Sponsors'
                      : effectiveLabel === 'partners'
                      ? 'Partners'
                      : 'Ads'}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add sponsors or partners that appear on your chapter's ride pages
                  </p>
                </div>
              </div>

              {/* Label Type Selector */}
              <div className="space-y-2">
                <Label className="text-sm">What do you call these?</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={sponsorLabel === 'inherit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSponsorLabel('inherit')}
                  >
                    Inherit from community
                    {chapter.brand.sponsorLabel && (
                      <span className="ml-1 opacity-70">
                        ({chapter.brand.sponsorLabel})
                      </span>
                    )}
                  </Button>
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
              {sponsors.length > 0 && (
                <div className="space-y-2">
                  {sponsors.map((sponsor) => (
                    <SponsorListItem
                      key={sponsor.id}
                      sponsor={sponsor}
                      onEdit={(s) => {
                        setEditingSponsor(s);
                        setShowSponsorForm(true);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Add/Edit Sponsor Form */}
              {showSponsorForm ? (
                <Card className="border-primary/50">
                  <CardContent className="pt-4">
                    <SponsorForm
                      brandSlug={brandSlug}
                      chapterSlug={chapterSlug}
                      sponsor={editingSponsor || undefined}
                      onSave={(sponsor) => {
                        if (editingSponsor) {
                          setSponsors(
                            sponsors.map((s) => (s.id === sponsor.id ? sponsor : s))
                          );
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
                      onDelete={
                        editingSponsor
                          ? () => {
                              setSponsors(
                                sponsors.filter((s) => s.id !== editingSponsor.id)
                              );
                              setShowSponsorForm(false);
                              setEditingSponsor(null);
                            }
                          : undefined
                      }
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
                  Add {effectiveLabel.slice(0, -1)}
                </Button>
              )}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Settings saved successfully!
                </AlertDescription>
              </Alert>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
