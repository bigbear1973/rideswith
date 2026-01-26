'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, HelpCircle, Users } from 'lucide-react';

interface Attendee {
  id: string;
  name: string;
  image?: string | null;
  slug?: string | null;
  status: 'GOING' | 'MAYBE' | 'NOT_GOING';
}

interface AttendeeListProps {
  attendees: Attendee[];
  totalGoing: number;
  totalMaybe?: number;
  maxAttendees?: number | null;
  showAllButton?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getProfileUrl(attendee: Attendee): string {
  if (attendee.slug) {
    return `/u/${attendee.slug}`;
  }
  return '#'; // No profile link if no slug
}

export function AttendeeList({
  attendees,
  totalGoing,
  totalMaybe = 0,
  maxAttendees,
  showAllButton = true,
}: AttendeeListProps) {
  const [isOpen, setIsOpen] = useState(false);

  const goingAttendees = attendees.filter((a) => a.status === 'GOING');
  const maybeAttendees = attendees.filter((a) => a.status === 'MAYBE');
  const displayAttendees = goingAttendees.slice(0, 5);
  const hasMore = totalGoing > 5 || totalMaybe > 0;

  if (attendees.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No attendees yet. Be the first!</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {displayAttendees.map((attendee) => {
            const profileUrl = getProfileUrl(attendee);
            const AvatarComponent = (
              <Avatar key={attendee.id} className="h-8 w-8 border-2 border-background hover:z-10 transition-transform hover:scale-110">
                {attendee.image && <AvatarImage src={attendee.image} alt={attendee.name} />}
                <AvatarFallback className="text-xs">{getInitials(attendee.name)}</AvatarFallback>
              </Avatar>
            );

            if (attendee.slug) {
              return (
                <Link key={attendee.id} href={profileUrl} className="relative">
                  {AvatarComponent}
                </Link>
              );
            }
            return AvatarComponent;
          })}
          {totalGoing > 5 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
              +{totalGoing - 5}
            </div>
          )}
        </div>
        {maxAttendees && (
          <span className="text-xs text-muted-foreground">
            {maxAttendees - totalGoing > 0
              ? `${maxAttendees - totalGoing} spots left`
              : 'Full'}
          </span>
        )}
      </div>

      {hasMore && showAllButton && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
              See all attendees
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Attendees
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Going section */}
              {goingAttendees.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <Check className="h-4 w-4" />
                    Going ({totalGoing})
                  </div>
                  <div className="space-y-1">
                    {goingAttendees.map((attendee) => (
                      <AttendeeRow key={attendee.id} attendee={attendee} />
                    ))}
                    {totalGoing > goingAttendees.length && (
                      <p className="text-xs text-muted-foreground pl-10">
                        +{totalGoing - goingAttendees.length} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Maybe section */}
              {maybeAttendees.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                    <HelpCircle className="h-4 w-4" />
                    Maybe ({totalMaybe})
                  </div>
                  <div className="space-y-1">
                    {maybeAttendees.map((attendee) => (
                      <AttendeeRow key={attendee.id} attendee={attendee} />
                    ))}
                    {totalMaybe > maybeAttendees.length && (
                      <p className="text-xs text-muted-foreground pl-10">
                        +{totalMaybe - maybeAttendees.length} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AttendeeRow({ attendee }: { attendee: Attendee }) {
  const profileUrl = getProfileUrl(attendee);
  const hasProfile = !!attendee.slug;

  const content = (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${hasProfile ? 'hover:bg-muted/50 cursor-pointer' : ''}`}>
      <Avatar className="h-8 w-8">
        {attendee.image && <AvatarImage src={attendee.image} alt={attendee.name} />}
        <AvatarFallback className="text-xs">{getInitials(attendee.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attendee.name}</p>
        {attendee.slug && (
          <p className="text-xs text-muted-foreground">@{attendee.slug}</p>
        )}
      </div>
      {attendee.status === 'GOING' && (
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          Going
        </Badge>
      )}
      {attendee.status === 'MAYBE' && (
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
          Maybe
        </Badge>
      )}
    </div>
  );

  if (hasProfile) {
    return <Link href={profileUrl}>{content}</Link>;
  }

  return content;
}
