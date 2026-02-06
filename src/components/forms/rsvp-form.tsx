'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RsvpStatus } from '@/types';

interface RsvpFormProps {
  rideId: string;
  onSuccess?: () => void;
}

export function RsvpForm({ rideId, onSuccess }: RsvpFormProps) {
  const [status, setStatus] = useState<RsvpStatus>('going');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const mapStatus = (value: RsvpStatus) => {
    switch (value) {
      case 'going':
        return 'GOING';
      case 'maybe':
        return 'MAYBE';
      case 'cant_go':
        return 'NOT_GOING';
      default:
        return 'GOING';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!session?.user?.id) {
      setIsLoading(false);
      setError('Please sign in to RSVP.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    try {
      const response = await fetch('/api/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId,
          status: mapStatus(status),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to submit RSVP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit RSVP');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Your Name *
        </label>
        <Input id="name" name="name" placeholder="John Doe" required />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email *
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="john@example.com"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          We&apos;ll send you ride updates and reminders
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Are you joining?</label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={status === 'going' ? 'default' : 'outline'}
            onClick={() => setStatus('going')}
            className="flex-1"
          >
            Going
          </Button>
          <Button
            type="button"
            variant={status === 'maybe' ? 'default' : 'outline'}
            onClick={() => setStatus('maybe')}
            className="flex-1"
          >
            Maybe
          </Button>
          <Button
            type="button"
            variant={status === 'cant_go' ? 'default' : 'outline'}
            onClick={() => setStatus('cant_go')}
            className="flex-1"
          >
            Can&apos;t Go
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Confirm RSVP'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
