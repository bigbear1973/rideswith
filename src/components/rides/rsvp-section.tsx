'use client';

import { RsvpButton } from './rsvp-button';
import { AttendeeList } from './attendee-list';
import { Separator } from '@/components/ui/separator';

type RsvpStatus = 'GOING' | 'MAYBE' | 'NOT_GOING';

interface Attendee {
  id: string;
  name: string;
  image?: string | null;
  slug?: string | null;
  status: RsvpStatus;
}

interface RsvpSectionProps {
  rideId: string;
  currentUserRsvpStatus: RsvpStatus | null;
  attendees: Attendee[];
  totalGoing: number;
  totalMaybe: number;
  maxAttendees?: number | null;
  isPastRide?: boolean;
}

export function RsvpSection({
  rideId,
  currentUserRsvpStatus,
  attendees,
  totalGoing,
  totalMaybe,
  maxAttendees,
  isPastRide = false,
}: RsvpSectionProps) {
  const isAtCapacity = maxAttendees ? totalGoing >= maxAttendees : false;

  return (
    <div className="space-y-4">
      {/* RSVP Button */}
      <RsvpButton
        rideId={rideId}
        initialStatus={currentUserRsvpStatus}
        isPastRide={isPastRide}
        isAtCapacity={isAtCapacity && currentUserRsvpStatus !== 'GOING'}
      />

      {/* Attendees */}
      <Separator />
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">
          Attendees ({totalGoing}{totalMaybe > 0 ? ` + ${totalMaybe} maybe` : ''})
        </span>
        <AttendeeList
          attendees={attendees}
          totalGoing={totalGoing}
          totalMaybe={totalMaybe}
          maxAttendees={maxAttendees}
        />
      </div>
    </div>
  );
}
