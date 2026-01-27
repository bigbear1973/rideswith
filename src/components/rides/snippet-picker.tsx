'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Loader2, Plus } from 'lucide-react';
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

  // Load snippets when dialog opens
  useEffect(() => {
    if (open && !hasLoaded) {
      loadSnippets();
    }
  }, [open, hasLoaded]);

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

  const handleSelect = (snippet: Snippet) => {
    onInsert(snippet.content);
    setOpen(false);
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
        <DialogHeader>
          <DialogTitle>Insert Snippet</DialogTitle>
          <DialogDescription>
            Select a snippet to insert into the description.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : snippets.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              No snippets yet. Create reusable text blocks in settings.
            </p>
            <Button asChild size="sm">
              <Link href="/settings/snippets" onClick={() => setOpen(false)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Snippets
              </Link>
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
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
        )}

        {snippets.length > 0 && (
          <div className="flex justify-end pt-2 border-t">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings/snippets" onClick={() => setOpen(false)}>
                Manage Snippets
              </Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
