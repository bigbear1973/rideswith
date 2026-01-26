'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface SidebarCommentsProps {
  rideId: string;
  isOrganizer: boolean;
}

export function SidebarComments({ rideId, isOrganizer }: SidebarCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

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
      setIsLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

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

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Show limited comments unless expanded
  const visibleComments = showAll ? comments : comments.slice(0, 3);
  const hasMore = comments.length > 3;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4" />
          Discussion ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        {session?.user ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Ask a question or share a link..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Post
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>{' '}
            to join the discussion
          </p>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No comments yet
          </p>
        ) : (
          <div className="space-y-3">
            {visibleComments.map((comment) => (
              <div key={comment.id} className="flex gap-2 group">
                <Link href={comment.user.slug ? `/u/${comment.user.slug}` : '#'}>
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={comment.user.image || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(comment.user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Link
                      href={comment.user.slug ? `/u/${comment.user.slug}` : '#'}
                      className="font-medium text-xs hover:underline truncate"
                    >
                      {comment.user.name}
                    </Link>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {(session?.user?.id === comment.user.id || isOrganizer) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
              </div>
            ))}

            {hasMore && !showAll && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowAll(true)}
              >
                Show {comments.length - 3} more comments
              </Button>
            )}

            {showAll && hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowAll(false)}
              >
                Show less
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
