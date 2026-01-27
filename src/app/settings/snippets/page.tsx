'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Plus,
  FileText,
  Pencil,
  Trash2,
  ChevronLeft,
  Copy,
} from 'lucide-react';

interface Snippet {
  id: string;
  title: string;
  content: string;
  category: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function SnippetsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [deletingSnippet, setDeletingSnippet] = useState<Snippet | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/settings/snippets');
    }
  }, [status, router]);

  // Load snippets
  useEffect(() => {
    async function loadSnippets() {
      try {
        const res = await fetch('/api/snippets');
        if (res.ok) {
          const data = await res.json();
          setSnippets(data.snippets || []);
        } else {
          setError('Failed to load snippets');
        }
      } catch {
        setError('Failed to load snippets');
      } finally {
        setIsLoading(false);
      }
    }

    if (status === 'authenticated') {
      loadSnippets();
    }
  }, [status]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('');
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category: category || null }),
      });

      if (res.ok) {
        const snippet = await res.json();
        setSnippets([...snippets, snippet]);
        setShowCreateDialog(false);
        resetForm();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create snippet');
      }
    } catch {
      setError('Failed to create snippet');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingSnippet || !title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/snippets/${editingSnippet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category: category || null }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSnippets(snippets.map(s => s.id === updated.id ? updated : s));
        setEditingSnippet(null);
        resetForm();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update snippet');
      }
    } catch {
      setError('Failed to update snippet');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSnippet) return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/snippets/${deletingSnippet.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSnippets(snippets.filter(s => s.id !== deletingSnippet.id));
        setDeletingSnippet(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete snippet');
      }
    } catch {
      setError('Failed to delete snippet');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (snippet: Snippet) => {
    setTitle(snippet.title);
    setContent(snippet.content);
    setCategory(snippet.category || '');
    setEditingSnippet(snippet);
  };

  const closeEditDialog = () => {
    setEditingSnippet(null);
    resetForm();
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  // Group snippets by category
  const groupedSnippets = snippets.reduce((acc, snippet) => {
    const cat = snippet.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(snippet);
    return acc;
  }, {} as Record<string, Snippet[]>);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/settings">
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-lg font-semibold">Ride Snippets</h1>
            </div>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Snippet
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ride Description Snippets</CardTitle>
            <CardDescription>
              Create reusable text blocks that you can insert into ride descriptions.
              Great for ride etiquette, safety guidelines, what to bring, etc.
            </CardDescription>
          </CardHeader>
        </Card>

        {snippets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No snippets yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first snippet to reuse in ride descriptions.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Snippet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSnippets).map(([category, categorySnippets]) => (
              <div key={category}>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  {category}
                </h2>
                <div className="space-y-3">
                  {categorySnippets.map((snippet) => (
                    <Card key={snippet.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium mb-1">{snippet.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {snippet.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(snippet.content);
                              }}
                              title="Copy content"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(snippet)}
                              title="Edit snippet"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingSnippet(snippet)}
                              title="Delete snippet"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Snippet</DialogTitle>
            <DialogDescription>
              Create a reusable text block for ride descriptions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Title *</Label>
              <Input
                id="create-title"
                placeholder="e.g., Group Ride Etiquette"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-category">Category (optional)</Label>
              <Input
                id="create-category"
                placeholder="e.g., Safety, Etiquette, Gear"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-content">Content *</Label>
              <textarea
                id="create-content"
                placeholder="Enter your snippet content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Snippet'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSnippet} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Snippet</DialogTitle>
            <DialogDescription>
              Update your snippet content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Group Ride Etiquette"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category (optional)</Label>
              <Input
                id="edit-category"
                placeholder="e.g., Safety, Etiquette, Gear"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Content *</Label>
              <textarea
                id="edit-content"
                placeholder="Enter your snippet content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEditDialog}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSnippet} onOpenChange={(open) => !open && setDeletingSnippet(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snippet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingSnippet?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
