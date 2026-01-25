'use client';

import { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      rideId,
      name: formData.get('name'),
      email: formData.get('email'),
      status,
    };

    // TODO: Implement RSVP submission
    console.log('RSVP data:', data);

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
          We'll send you ride updates and reminders
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
            Can't Go
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Confirm RSVP'}
      </Button>
    </form>
  );
}
