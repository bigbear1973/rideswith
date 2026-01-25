'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { Coffee, Camera, Send, Trash2, X, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    slug: string | null;
  };
}

interface Photo {
  id: string;
  publicId: string;
  url: string;
  thumbnailUrl: string;
  width: number | null;
  height: number | null;
  caption: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    slug: string | null;
  };
}

interface CakeAndCoffeeProps {
  rideId: string;
  rideDate: Date;
  isOrganizer: boolean;
}

export function CakeAndCoffee({ rideId, rideDate, isOrganizer }: CakeAndCoffeeProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Check if ride is in the past (allow posting after ride date)
  const isPastRide = new Date(rideDate) < new Date();

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/rides/${rideId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [rideId]);

  // Fetch photos
  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/rides/${rideId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setIsLoadingPhotos(false);
    }
  }, [rideId]);

  useEffect(() => {
    fetchComments();
    fetchPhotos();
  }, [fetchComments, fetchPhotos]);

  // Submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !session?.user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/rides/${rideId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments([comment, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/rides/${rideId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // Upload photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user) return;

    setIsUploading(true);
    try {
      // Get upload signature
      const sigRes = await fetch('/api/upload/signature');
      if (!sigRes.ok) throw new Error('Failed to get upload signature');
      const { timestamp, signature, cloudName, apiKey, folder } = await sigRes.json();

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!uploadRes.ok) throw new Error('Failed to upload to Cloudinary');
      const uploadData = await uploadRes.json();

      // Save to database
      const saveRes = await fetch(`/api/rides/${rideId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId: uploadData.public_id,
          url: uploadData.secure_url,
          width: uploadData.width,
          height: uploadData.height,
        }),
      });

      if (saveRes.ok) {
        const photo = await saveRes.json();
        setPhotos([photo, ...photos]);
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Delete photo
  const handleDeletePhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/rides/${rideId}/photos?photoId=${photoId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPhotos(photos.filter((p) => p.id !== photoId));
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // If ride hasn't happened yet, show a message
  if (!isPastRide) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coffee className="h-5 w-5" />
            Cake & Coffee Stop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This section will unlock after the ride. Share photos and stories from your adventure!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coffee className="h-5 w-5" />
          Cake & Coffee Stop
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Share photos and stories from the ride
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo Gallery */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photos ({photos.length})
            </h3>
            {session?.user && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button variant="outline" size="sm" disabled={isUploading} asChild>
                  <span>
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4 mr-2" />
                    )}
                    Add Photo
                  </span>
                </Button>
              </label>
            )}
          </div>

          {isLoadingPhotos ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No photos yet. Be the first to share!
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.caption || 'Ride photo'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {(session?.user?.id === photo.user.id || isOrganizer) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photo Lightbox */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Ride photo'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 right-4 text-center text-white">
              <p className="text-sm">
                Photo by {selectedPhoto.user.name} &middot;{' '}
                {formatDistanceToNow(new Date(selectedPhoto.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* Comments */}
        <div>
          <h3 className="font-medium mb-3">Comments ({comments.length})</h3>

          {/* Comment Form */}
          {session?.user ? (
            <div className="flex gap-3 mb-4">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(session.user.name || session.user.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Share your thoughts about the ride..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              <Link href="/auth/signin" className="text-primary hover:underline">
                Sign in
              </Link>{' '}
              to leave a comment
            </p>
          )}

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No comments yet. Start the conversation!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <Link href={comment.user.slug ? `/u/${comment.user.slug}` : '#'}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.user.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(comment.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={comment.user.slug ? `/u/${comment.user.slug}` : '#'}
                        className="font-medium text-sm hover:underline"
                      >
                        {comment.user.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  {(session?.user?.id === comment.user.id || isOrganizer) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
