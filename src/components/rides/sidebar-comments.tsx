'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Trash2, Loader2, Reply, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
  slug: string | null;
}

interface CommentReply {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  user: CommentUser;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  user: CommentUser;
  replies: CommentReply[];
}

interface SidebarCommentsProps {
  rideId: string;
  isOrganizer: boolean;
}

export function SidebarComments({ rideId, isOrganizer }: SidebarCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; userName: string } | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
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

  // Submit top-level comment
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
        setComments([{ ...comment, replies: [] }, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit reply
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !session?.user || !replyTo) return;

    setIsSubmittingReply(true);
    try {
      const res = await fetch(`/api/rides/${rideId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, parentId: replyTo.id }),
      });

      if (res.ok) {
        const reply = await res.json();
        // Add reply to the parent comment
        setComments(comments.map((c) =>
          c.id === replyTo.id
            ? { ...c, replies: [...c.replies, reply] }
            : c
        ));
        setReplyContent('');
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Delete comment or reply
  const handleDeleteComment = async (commentId: string, parentId?: string | null) => {
    try {
      const res = await fetch(`/api/rides/${rideId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (parentId) {
          // Delete reply from parent
          setComments(comments.map((c) =>
            c.id === parentId
              ? { ...c, replies: c.replies.filter((r) => r.id !== commentId) }
              : c
          ));
        } else {
          // Delete top-level comment
          setComments(comments.filter((c) => c.id !== commentId));
        }
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

  // Calculate total comment count (including replies)
  const totalComments = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  // Show limited comments unless expanded
  const visibleComments = showAll ? comments : comments.slice(0, 3);
  const hasMore = comments.length > 3;

  // Render a single comment (used for both top-level and replies)
  const renderComment = (comment: CommentReply, isReply = false, parentId?: string) => (
    <div key={comment.id} className={`flex gap-2 group ${isReply ? 'ml-6 mt-2' : ''}`}>
      <Link href={comment.user.slug ? `/u/${comment.user.slug}` : '#'}>
        <Avatar className={`flex-shrink-0 ${isReply ? 'h-5 w-5' : 'h-6 w-6'}`}>
          <AvatarImage src={comment.user.image || undefined} />
          <AvatarFallback className={isReply ? 'text-[8px]' : 'text-[10px]'}>
            {getInitials(comment.user.name)}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <Link
            href={comment.user.slug ? `/u/${comment.user.slug}` : '#'}
            className="font-medium text-xs hover:underline truncate"
          >
            {comment.user.name}
          </Link>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          {!isReply && session?.user && (
            <button
              onClick={() => setReplyTo({ id: comment.id, userName: comment.user.name })}
              className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary flex-shrink-0"
              title="Reply"
            >
              <Reply className="h-3 w-3" />
            </button>
          )}
          {(session?.user?.id === comment.user.id || isOrganizer) && (
            <button
              onClick={() => handleDeleteComment(comment.id, parentId)}
              className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="text-xs mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4" />
          Discussion ({totalComments})
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

        {/* Reply Form (inline) */}
        {replyTo && (
          <div className="ml-6 p-2 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Replying to <span className="font-medium">{replyTo.userName}</span>
              </span>
              <button
                onClick={() => {
                  setReplyTo(null);
                  setReplyContent('');
                }}
                className="p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              className="resize-none text-sm"
              autoFocus
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || isSubmittingReply}
              >
                {isSubmittingReply ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Reply className="h-4 w-4 mr-1" />
                )}
                Reply
              </Button>
            </div>
          </div>
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
              <div key={comment.id}>
                {renderComment(comment)}
                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="space-y-2">
                    {comment.replies.map((reply) => renderComment(reply, true, comment.id))}
                  </div>
                )}
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
