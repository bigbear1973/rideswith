'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Loader2, Plus, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Snippet {
  id: string;
  title: string;
  content: string;
  category: string | null;
}

interface SnippetPickerProps {
  onInsert: (content: string) => void;
  disabled?: boolean;
}

export function SnippetPicker({ onInsert, disabled }: SnippetPickerProps) {
  const [open, setOpen] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Create form state
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [createError, setCreateError] = useState('');

  // Load snippets when dialog opens
  useEffect(() => {
    if (open && !hasLoaded) {
      loadSnippets();
    }
  }, [open, hasLoaded]);

  // Reset create form when dialog closes
  useEffect(() => {
    if (!open) {
      setIsCreating(false);
      resetCreateForm();
    }
  }, [open]);

  const loadSnippets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/snippets');
      if (res.ok) {
        const data = await res.json();
        setSnippets(data.snippets || []);
      }
    } catch (err) {
      console.error('Failed to load snippets:', err);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  };

  const resetCreateForm = () => {
    setCreateTitle('');
    setCreateContent('');
    setCreateCategory('');
    setCreateError('');
  };

  const handleSelect = (snippet: Snippet) => {
    onInsert(snippet.content);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!createTitle.trim() || !createContent.trim()) {
      setCreateError('Title and content are required');
      return;
    }

    setIsSaving(true);
    setCreateError('');

    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle,
          content: createContent,
          category: createCategory || null,
        }),
      });

      if (res.ok) {
        const newSnippet = await res.json();
        setSnippets([...snippets, newSnippet]);
        // Insert the new snippet immediately
        onInsert(newSnippet.content);
        setOpen(false);
      } else {
        const data = await res.json();
        setCreateError(data.error || 'Failed to create snippet');
      }
    } catch {
      setCreateError('Failed to create snippet');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToList = () => {
    setIsCreating(false);
    resetCreateForm();
  };

  // Group snippets by category
  const groupedSnippets = snippets.reduce((acc, snippet) => {
    const cat = snippet.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(snippet);
    return acc;
  }, {} as Record<string, Snippet[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Insert Snippet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {isCreating ? (
          // Create snippet form
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleBackToList}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>Create Snippet</DialogTitle>
              </div>
              <DialogDescription>
                Create a reusable text block. It will be saved and inserted into your description.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="snippet-title">Title *</Label>
                <Input
                  id="snippet-title"
                  placeholder="e.g., Group Ride Etiquette"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="snippet-category">Category (optional)</Label>
                <Input
                  id="snippet-category"
                  placeholder="e.g., Safety, Etiquette, Gear"
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="snippet-content">Content *</Label>
                <textarea
                  id="snippet-content"
                  placeholder="Enter your snippet content..."
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToList}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Insert'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Snippet list view
          <>
            <DialogHeader>
              <DialogTitle>Insert Snippet</DialogTitle>
              <DialogDescription>
                Select a snippet to insert, or create a new one.
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : snippets.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-1">No snippets yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create reusable text blocks for ride etiquette, safety guidelines, what to bring, and more.
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Snippet
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="max-h-[350px] pr-4">
                  <div className="space-y-4">
                    {Object.entries(groupedSnippets).map(([category, categorySnippets]) => (
                      <div key={category}>
                        <h3 className="text-xs font-medium text-muted-foreground mb-2">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {categorySnippets.map((snippet) => (
                            <button
                              key={snippet.id}
                              type="button"
                              onClick={() => handleSelect(snippet)}
                              className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <p className="font-medium text-sm mb-1">{snippet.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {snippet.content}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex justify-between pt-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Snippet
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/settings/snippets" onClick={() => setOpen(false)}>
                      Manage All
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
