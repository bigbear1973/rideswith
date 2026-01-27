'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CopyableUrlProps {
  url: string;
  displayUrl?: string; // Optional shorter display version
  className?: string;
  showExternalLink?: boolean;
}

export function CopyableUrl({
  url,
  displayUrl,
  className = '',
  showExternalLink = false,
}: CopyableUrlProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const displayText = displayUrl || url.replace(/^https?:\/\//, '');

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
      >
        {displayText}
      </a>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">Copy URL</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? 'Copied!' : 'Copy URL'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {showExternalLink && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="sr-only">Open in new tab</span>
        </a>
      )}
    </div>
  );
}
