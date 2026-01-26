'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, HelpCircle, X, ChevronDown, Loader2 } from 'lucide-react';

type RsvpStatus = 'GOING' | 'MAYBE' | 'NOT_GOING' | null;

interface RsvpButtonProps {
  rideId: string;
  initialStatus: RsvpStatus;
  isPastRide?: boolean;
  isAtCapacity?: boolean;
  onStatusChange?: (status: RsvpStatus) => void;
}

const STATUS_CONFIG = {
  GOING: {
    label: 'Going',
    icon: Check,
    variant: 'default' as const,
    className: 'bg-green-600 hover:bg-green-700',
  },
  MAYBE: {
    label: 'Maybe',
    icon: HelpCircle,
    variant: 'outline' as const,
    className: 'border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950',
  },
  NOT_GOING: {
    label: 'Not Going',
    icon: X,
    variant: 'outline' as const,
    className: 'border-muted-foreground/30 text-muted-foreground',
  },
};

export function RsvpButton({
  rideId,
  initialStatus,
  isPastRide = false,
  isAtCapacity = false,
  onStatusChange,
}: RsvpButtonProps) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<RsvpStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRsvp = async (newStatus: RsvpStatus) => {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=/rides/${rideId}`);
      return;
    }

    if (newStatus === currentStatus) return;

    setIsLoading(true);
    setError(null);

    try {
      if (newStatus === null) {
        // Remove RSVP
        const res = await fetch(`/api/rsvps?rideId=${rideId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to remove RSVP');
        }
      } else {
        // Create/update RSVP
        const res = await fetch('/api/rsvps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rideId, status: newStatus }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update RSVP');
        }
      }

      setCurrentStatus(newStatus);
      onStatusChange?.(newStatus);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Show sign in button if not authenticated
  if (sessionStatus === 'unauthenticated') {
    return (
      <Button
        onClick={() => router.push(`/auth/signin?callbackUrl=/rides/${rideId}`)}
        className="w-full"
      >
        Sign in to RSVP
      </Button>
    );
  }

  // Show loading state while session loads
  if (sessionStatus === 'loading') {
    return (
      <Button disabled className="w-full">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Past rides - show disabled state
  if (isPastRide) {
    return (
      <Button disabled variant="outline" className="w-full">
        Ride has ended
      </Button>
    );
  }

  // Not RSVP'd yet - show primary action button
  if (!currentStatus) {
    return (
      <div className="space-y-2">
        <Button
          onClick={() => handleRsvp('GOING')}
          disabled={isLoading || isAtCapacity}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          {isAtCapacity ? 'Ride Full' : "I'm Going"}
        </Button>
        {!isAtCapacity && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleRsvp('MAYBE')}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Maybe
            </Button>
            <Button
              onClick={() => handleRsvp('NOT_GOING')}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              Can't Go
            </Button>
          </div>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  // Already RSVP'd - show current status with dropdown to change
  const config = STATUS_CONFIG[currentStatus];
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={config.variant}
            className={`w-full ${config.className}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Icon className="h-4 w-4 mr-2" />
            )}
            {config.label}
            <ChevronDown className="h-4 w-4 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          {Object.entries(STATUS_CONFIG).map(([status, statusConfig]) => {
            const StatusIcon = statusConfig.icon;
            const isActive = status === currentStatus;
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleRsvp(status as RsvpStatus)}
                className={isActive ? 'bg-muted' : ''}
              >
                <StatusIcon className="h-4 w-4 mr-2" />
                {statusConfig.label}
                {isActive && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuItem
            onClick={() => handleRsvp(null)}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Remove RSVP
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
