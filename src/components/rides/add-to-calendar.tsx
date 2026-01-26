'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarPlus, Check } from 'lucide-react';

interface AddToCalendarProps {
  title: string;
  description?: string | null;
  date: Date;
  endTime?: Date | null;
  locationName: string;
  locationAddress: string;
  rideUrl: string;
}

export function AddToCalendar({
  title,
  description,
  date,
  endTime,
  locationName,
  locationAddress,
  rideUrl,
}: AddToCalendarProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format dates for calendar URLs
  const startDate = new Date(date);
  const end = endTime ? new Date(endTime) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

  // Google Calendar format: YYYYMMDDTHHMMSS
  const formatGoogleDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // ICS format: YYYYMMDDTHHMMSS
  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const eventDescription = [
    description || '',
    '',
    `Join the ride: ${rideUrl}`,
  ].filter(Boolean).join('\n');

  const location = `${locationName}, ${locationAddress}`;

  // Google Calendar URL
  const googleUrl = new URL('https://calendar.google.com/calendar/render');
  googleUrl.searchParams.set('action', 'TEMPLATE');
  googleUrl.searchParams.set('text', title);
  googleUrl.searchParams.set('dates', `${formatGoogleDate(startDate)}/${formatGoogleDate(end)}`);
  googleUrl.searchParams.set('details', eventDescription);
  googleUrl.searchParams.set('location', location);
  googleUrl.searchParams.set('sf', 'true');

  // Outlook Web URL
  const outlookUrl = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  outlookUrl.searchParams.set('subject', title);
  outlookUrl.searchParams.set('startdt', startDate.toISOString());
  outlookUrl.searchParams.set('enddt', end.toISOString());
  outlookUrl.searchParams.set('body', eventDescription);
  outlookUrl.searchParams.set('location', location);
  outlookUrl.searchParams.set('path', '/calendar/action/compose');

  // Generate ICS file content
  const generateICS = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RidesWith//Ride Event//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${eventDescription.replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      `URL:${rideUrl}`,
      `UID:${Date.now()}@rideswith.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return icsContent;
  };

  const downloadICS = () => {
    const icsContent = generateICS();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const handleGoogleClick = () => {
    window.open(googleUrl.toString(), '_blank');
    setOpen(false);
  };

  const handleOutlookClick = () => {
    window.open(outlookUrl.toString(), '_blank');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-primary hover:text-primary/80"
        >
          <CalendarPlus className="h-3.5 w-3.5 mr-1" />
          Add to Calendar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="flex flex-col gap-1">
          <button
            onClick={handleGoogleClick}
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted text-left"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
            </svg>
            Google Calendar
          </button>
          <button
            onClick={handleOutlookClick}
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted text-left"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
            </svg>
            Outlook
          </button>
          <button
            onClick={downloadICS}
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted text-left"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
            </svg>
            Apple Calendar (.ics)
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
