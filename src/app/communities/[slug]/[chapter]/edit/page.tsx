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
import { ChevronLeft, Loader2, Check, AlertCircle, Plus, Megaphone, Settings, Users, Search, X, Crown, Shield, UserCheck } from 'lucide-react';
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
  brand: {
    id: string;
    name: string;
    slug: string;
    sponsorLabel: string | null;
    hidePresentedBy: boolean;
    createdById: string | null;
    sponsorsEnabled: boolean;
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
  });

  // Member management state
  const [members, setMembers] = useState<ChapterMember[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isBrandOwner, setIsBrandOwner] = useState(false);
  const [sponsorsEnabled, setSponsorsEnabled] = useState(false);
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
          },
        });
        setSponsorsEnabled(brandData.sponsorsEnabled || false);
        setMembers(fullChapter.members || []);
        setFormData({
          name: fullChapter.name || '',
          city: fullChapter.city || '',
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
          ...formData,
          sponsorLabel: sponsorLabel === 'inherit' ? null : sponsorLabel,
          hidePresentedBy:
            hidePresentedBy === 'inherit'
              ? null
              : hidePresentedBy === 'hide',
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
            {(sponsorsEnabled || isPlatformAdmin) ? (
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
      </div>
    </div>
  );
}
