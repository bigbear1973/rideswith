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
import { ChevronLeft, Loader2, Check, AlertCircle, Plus, Megaphone, Settings, Users, Search, X, Crown, Shield, UserCheck, MessageCircle, Trash2, Link2, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { SponsorForm, SponsorList } from '@/components/communities';

interface ChapterMember {
  id: string;
  role: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email?: string;
    image: string | null;
    slug: string | null;
  };
}

interface Chapter {
  id: string;
  name: string;
  slug: string;
  city: string;
  sponsorLabel: string | null;
  hidePresentedBy: boolean | null;
  sponsorsEnabled: boolean | null;
  telegram: string | null;
  whatsapp: string | null;
  discord: string | null;
  signal: string | null;
  // Social links
  inheritSocialLinks: boolean;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  strava: string | null;
  youtube: string | null;
  brand: {
    id: string;
    name: string;
    slug: string;
    sponsorLabel: string | null;
    hidePresentedBy: boolean;
    createdById: string | null;
    sponsorsEnabled: boolean;
    // Brand social links (for inheritance display)
    instagram: string | null;
    twitter: string | null;
    facebook: string | null;
    strava: string | null;
    youtube: string | null;
  };
  members: ChapterMember[];
}

interface SearchUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  slug: string | null;
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
  const [hidePresentedBy, setHidePresentedBy] = useState<'inherit' | 'show' | 'hide'>('inherit');
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    telegram: '',
    whatsapp: '',
    discord: '',
    signal: '',
    // Social links
    inheritSocialLinks: true,
    instagram: '',
    twitter: '',
    facebook: '',
    strava: '',
    youtube: '',
  });

  // Member management state
  const [members, setMembers] = useState<ChapterMember[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isBrandOwner, setIsBrandOwner] = useState(false);
  const [brandSponsorsEnabled, setBrandSponsorsEnabled] = useState(false);
  const [chapterSponsorsEnabled, setChapterSponsorsEnabled] = useState<'inherit' | 'enabled' | 'disabled'>('inherit');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const isPlatformAdmin = session?.user?.role === 'PLATFORM_ADMIN';

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
            hidePresentedBy: brandData.hidePresentedBy || false,
            createdById: brandData.createdById,
            sponsorsEnabled: brandData.sponsorsEnabled || false,
            instagram: brandData.instagram || null,
            twitter: brandData.twitter || null,
            facebook: brandData.facebook || null,
            strava: brandData.strava || null,
            youtube: brandData.youtube || null,
          },
        });
        setBrandSponsorsEnabled(brandData.sponsorsEnabled || false);
        setMembers(fullChapter.members || []);
        setFormData({
          name: fullChapter.name || '',
          city: fullChapter.city || '',
          telegram: fullChapter.telegram || '',
          whatsapp: fullChapter.whatsapp || '',
          discord: fullChapter.discord || '',
          signal: fullChapter.signal || '',
          inheritSocialLinks: fullChapter.inheritSocialLinks !== false, // Default to true
          instagram: fullChapter.instagram || '',
          twitter: fullChapter.twitter || '',
          facebook: fullChapter.facebook || '',
          strava: fullChapter.strava || '',
          youtube: fullChapter.youtube || '',
        });
        // Set sponsor label - 'inherit' if null
        setSponsorLabel(fullChapter.sponsorLabel || 'inherit');
        // Set hidePresentedBy - 'inherit' if null
        setHidePresentedBy(
          fullChapter.hidePresentedBy === true
            ? 'hide'
            : fullChapter.hidePresentedBy === false
            ? 'show'
            : 'inherit'
        );
        // Set chapter-level sponsors enabled
        setChapterSponsorsEnabled(
          fullChapter.sponsorsEnabled === true
            ? 'enabled'
            : fullChapter.sponsorsEnabled === false
            ? 'disabled'
            : 'inherit'
        );

        // Check permission
        const userMembership = fullChapter.members?.find(
          (m: { userId: string; role: string }) => m.userId === session?.user?.id
        );
        const userRole = userMembership?.role || null;
        setCurrentUserRole(userRole);

        const isAdminUser = userRole && ['OWNER', 'ADMIN', 'LEAD'].includes(userRole);
        const isBrandOwnerUser = brandData.createdById === session?.user?.id;
        setIsBrandOwner(isBrandOwnerUser);

        if (!isAdminUser && !isBrandOwnerUser) {
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
          name: formData.name,
          city: formData.city,
          telegram: formData.telegram || null,
          whatsapp: formData.whatsapp || null,
          discord: formData.discord || null,
          signal: formData.signal || null,
          sponsorLabel: sponsorLabel === 'inherit' ? null : sponsorLabel,
          hidePresentedBy:
            hidePresentedBy === 'inherit'
              ? null
              : hidePresentedBy === 'hide',
          sponsorsEnabled:
            chapterSponsorsEnabled === 'inherit'
              ? null
              : chapterSponsorsEnabled === 'enabled',
          // Social links
          inheritSocialLinks: formData.inheritSocialLinks,
          instagram: formData.instagram || null,
          twitter: formData.twitter || null,
          facebook: formData.facebook || null,
          strava: formData.strava || null,
          youtube: formData.youtube || null,
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

  // Search for users to add as members
  const handleUserSearch = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out users who are already members
        const memberIds = members.map((m) => m.userId);
        setSearchResults(data.users.filter((u: SearchUser) => !memberIds.includes(u.id)));
      }
    } catch {
      console.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  // Add a new member
  const handleAddMember = async (user: SearchUser, role: 'ADMIN' | 'MODERATOR') => {
    if (!chapter) return;
    setMemberError(null);

    try {
      const res = await fetch(`/api/chapters/${chapter.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role }),
      });

      if (res.ok) {
        const newMember = await res.json();
        setMembers([...members, newMember]);
        setUserSearch('');
        setSearchResults([]);
      } else {
        const data = await res.json();
        setMemberError(data.error || 'Failed to add member');
      }
    } catch {
      setMemberError('Failed to add member');
    }
  };

  // Update a member's role
  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!chapter) return;
    setMemberError(null);

    try {
      const res = await fetch(`/api/chapters/${chapter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        const updatedMember = await res.json();
        setMembers(members.map((m) => (m.userId === userId ? updatedMember : m)));
      } else {
        const data = await res.json();
        setMemberError(data.error || 'Failed to update role');
      }
    } catch {
      setMemberError('Failed to update role');
    }
  };

  // Remove a member
  const handleRemoveMember = async (userId: string) => {
    if (!chapter) return;
    if (!confirm('Are you sure you want to remove this member?')) return;
    setMemberError(null);

    try {
      const res = await fetch(`/api/chapters/${chapter.id}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMembers(members.filter((m) => m.userId !== userId));
      } else {
        const data = await res.json();
        setMemberError(data.error || 'Failed to remove member');
      }
    } catch {
      setMemberError('Failed to remove member');
    }
  };

  // Check if current user can modify a specific member
  const canModifyMember = (memberRole: string) => {
    // Brand owner can do anything
    if (isBrandOwner) return true;
    // Owners can modify anyone
    if (currentUserRole === 'OWNER' || currentUserRole === 'LEAD') return true;
    // Admins can only modify moderators
    if (currentUserRole === 'ADMIN' && memberRole === 'MODERATOR') return true;
    return false;
  };

  // Check if current user can promote to a specific role
  const canPromoteTo = (targetRole: string) => {
    if (isBrandOwner) return true;
    if (currentUserRole === 'OWNER' || currentUserRole === 'LEAD') return true;
    // Admins can only add moderators
    if (currentUserRole === 'ADMIN' && targetRole === 'MODERATOR') return true;
    return false;
  };

  // Get role display info
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'OWNER':
      case 'LEAD':
        return { label: 'Owner', icon: Crown, color: 'text-yellow-600' };
      case 'ADMIN':
        return { label: 'Admin', icon: Shield, color: 'text-blue-600' };
      case 'MODERATOR':
      case 'AMBASSADOR':
        return { label: 'Moderator', icon: UserCheck, color: 'text-green-600' };
      default:
        return { label: role, icon: UserCheck, color: 'text-muted-foreground' };
    }
  };

  // Delete chapter handler
  const handleDeleteChapter = async () => {
    if (!chapter) return;
    if (deleteConfirmText !== chapter.name) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/chapters/${chapter.id}?deleteChapter=true`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push(`/communities/${brandSlug}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete chapter');
        setShowDeleteConfirm(false);
      }
    } catch {
      setError('Failed to delete chapter');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if user can delete the chapter (Owner or Brand Owner)
  const canDeleteChapter = isBrandOwner || currentUserRole === 'OWNER' || currentUserRole === 'LEAD';

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

            {/* Community Chat Links */}
            <div className="space-y-4 border-t pt-6">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Community Chat Links
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Add links to your group chats so members can connect
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telegram" className="flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </Label>
                  <Input
                    id="telegram"
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    placeholder="t.me/groupname or @groupname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="chat.whatsapp.com/... invite link"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discord" className="flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                    </svg>
                    Discord
                  </Label>
                  <Input
                    id="discord"
                    value={formData.discord}
                    onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                    placeholder="discord.gg/... invite link"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signal" className="flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4a9.6 9.6 0 110 19.2 9.6 9.6 0 010-19.2zm0 3.6a6 6 0 100 12 6 6 0 000-12zm0 2.4a3.6 3.6 0 110 7.2 3.6 3.6 0 010-7.2z"/>
                    </svg>
                    Signal
                  </Label>
                  <Input
                    id="signal"
                    value={formData.signal}
                    onChange={(e) => setFormData({ ...formData, signal: e.target.value })}
                    placeholder="signal.group/... invite link"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4 border-t pt-6">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Social Links
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Add links to your chapter&apos;s social profiles, or inherit from the community
                </p>
              </div>

              {/* Inherit toggle */}
              <div className="space-y-2">
                <Label className="text-sm">Social Links Source</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={formData.inheritSocialLinks ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, inheritSocialLinks: true })}
                  >
                    Inherit from community
                  </Button>
                  <Button
                    type="button"
                    variant={!formData.inheritSocialLinks ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, inheritSocialLinks: false })}
                  >
                    Custom links
                  </Button>
                </div>
              </div>

              {formData.inheritSocialLinks ? (
                // Show inherited links preview
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm font-medium mb-2">Inherited from {chapter.brand.name}:</p>
                  {(chapter.brand.instagram || chapter.brand.twitter || chapter.brand.facebook || chapter.brand.strava || chapter.brand.youtube) ? (
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {chapter.brand.instagram && (
                        <span className="flex items-center gap-1">
                          <Instagram className="h-4 w-4" />
                          Instagram
                        </span>
                      )}
                      {chapter.brand.twitter && (
                        <span className="flex items-center gap-1">
                          <Twitter className="h-4 w-4" />
                          X/Twitter
                        </span>
                      )}
                      {chapter.brand.facebook && (
                        <span className="flex items-center gap-1">
                          <Facebook className="h-4 w-4" />
                          Facebook
                        </span>
                      )}
                      {chapter.brand.strava && (
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                          </svg>
                          Strava
                        </span>
                      )}
                      {chapter.brand.youtube && (
                        <span className="flex items-center gap-1">
                          <Youtube className="h-4 w-4" />
                          YouTube
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No social links set on community</p>
                  )}
                </div>
              ) : (
                // Show custom social link inputs
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
                      placeholder="Strava club URL"
                    />
                  </div>

                  <div className="space-y-2">
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
              )}
            </div>

            {/* Ride Page Display Settings */}
            <div className="space-y-4 border-t pt-6">
              <div>
                <Label className="text-base font-semibold">Ride Page Display</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Control how your chapter appears on ride detail pages
                </p>
              </div>

              {/* Hide Presented By setting */}
              <div className="space-y-2">
                <Label className="text-sm">&quot;Presented by&quot; Card</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={hidePresentedBy === 'inherit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHidePresentedBy('inherit')}
                  >
                    Inherit from community
                    <span className="ml-1 opacity-70">
                      ({chapter.brand.hidePresentedBy ? 'hidden' : 'visible'})
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant={hidePresentedBy === 'show' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHidePresentedBy('show')}
                  >
                    Show
                  </Button>
                  <Button
                    type="button"
                    variant={hidePresentedBy === 'hide' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHidePresentedBy('hide')}
                  >
                    Hide
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The sidebar card that links to your community&apos;s external website
                </p>
              </div>
            </div>

            {/* Team Members Section */}
            <div className="space-y-4 border-t pt-6">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Members
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage who can create rides and edit chapter settings
                </p>
              </div>

              {memberError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{memberError}</AlertDescription>
                </Alert>
              )}

              {/* Current Members List */}
              <div className="space-y-2">
                {members.map((member) => {
                  const roleInfo = getRoleInfo(member.role);
                  const RoleIcon = roleInfo.icon;
                  const isCurrentUser = member.userId === session?.user?.id;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name || ''}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {(member.user.name || member.user.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member.user.name || member.user.email}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <RoleIcon className={`h-3 w-3 ${roleInfo.color}`} />
                          <span className={roleInfo.color}>{roleInfo.label}</span>
                        </div>
                      </div>

                      {/* Role change dropdown - only if can modify */}
                      {canModifyMember(member.role) && !isCurrentUser && (
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role === 'LEAD' ? 'OWNER' : member.role === 'AMBASSADOR' ? 'MODERATOR' : member.role}
                            onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                            className="text-xs border rounded px-2 py-1 bg-background"
                          >
                            {canPromoteTo('OWNER') && <option value="OWNER">Owner</option>}
                            {canPromoteTo('ADMIN') && <option value="ADMIN">Admin</option>}
                            {canPromoteTo('MODERATOR') && <option value="MODERATOR">Moderator</option>}
                          </select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Member Search */}
              <div className="space-y-2">
                <Label className="text-sm">Add Team Member</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-9"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y">
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || ''}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.name || user.email}</p>
                          {user.name && (
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {canPromoteTo('ADMIN') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddMember(user, 'ADMIN')}
                            >
                              Add as Admin
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleAddMember(user, 'MODERATOR')}
                          >
                            Add as Moderator
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {userSearch.length >= 2 && searchResults.length === 0 && !isSearching && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No users found. They need to sign in first to be added as a team member.
                  </p>
                )}
              </div>
            </div>

            {/* Sponsors/Partners/Ads Section */}
            {(brandSponsorsEnabled || isPlatformAdmin) ? (
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
                      Add sponsors or partners that appear on your chapter&apos;s ride pages
                    </p>
                  </div>
                </div>

                {/* Chapter Sponsors Toggle */}
                <div className="space-y-2">
                  <Label className="text-sm">Enable sponsors for this chapter?</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={chapterSponsorsEnabled === 'inherit' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChapterSponsorsEnabled('inherit')}
                    >
                      Inherit from community
                      <span className="ml-1 opacity-70">
                        ({brandSponsorsEnabled ? 'enabled' : 'disabled'})
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant={chapterSponsorsEnabled === 'enabled' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChapterSponsorsEnabled('enabled')}
                    >
                      Enabled
                    </Button>
                    <Button
                      type="button"
                      variant={chapterSponsorsEnabled === 'disabled' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChapterSponsorsEnabled('disabled')}
                    >
                      Disabled
                    </Button>
                  </div>
                  {chapterSponsorsEnabled === 'disabled' && (
                    <p className="text-sm text-muted-foreground">
                      Sponsors are disabled for this chapter. Existing sponsors will be hidden.
                    </p>
                  )}
                </div>

                {/* Only show rest of sponsor UI if effectively enabled */}
                {(chapterSponsorsEnabled !== 'disabled' || isPlatformAdmin) && (
                  <>
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
                      await fetch(`/api/communities/${brandSlug}/${chapterSlug}/sponsors/${sponsor.id}`, {
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
                  </>
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

        {/* Danger Zone - Delete Chapter */}
        {canDeleteChapter && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that affect this chapter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete this chapter</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this chapter and all its data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Chapter
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This action cannot be undone. This will permanently delete the
                      <strong> {chapter.brand.name} {chapter.name}</strong> chapter,
                      all team members, and sponsors.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="confirm">
                      Type <strong>{chapter.name}</strong> to confirm
                    </Label>
                    <Input
                      id="confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={chapter.name}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteChapter}
                      disabled={deleteConfirmText !== chapter.name || isDeleting}
                    >
                      {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Delete Chapter
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
