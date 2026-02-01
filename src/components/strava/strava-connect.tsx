'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface StravaConnectProps {
  chapterId: string;
  disabled?: boolean;
}

// Strava orange brand color
const STRAVA_COLOR = '#FC4C02';

export function StravaConnectButton({ chapterId, disabled }: StravaConnectProps) {
  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = `/api/strava/authorize?chapterId=${chapterId}`;
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={disabled}
      className="gap-2"
      style={{ backgroundColor: STRAVA_COLOR }}
    >
      {disabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <StravaIcon className="h-4 w-4" />
      )}
      Connect Strava
    </Button>
  );
}

export function StravaIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}
