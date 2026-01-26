'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
}

export function DateTimePicker({
  date,
  setDate,
  placeholder = 'Pick a date and time',
  className,
  disabled = false,
  minDate,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = ['00', '15', '30', '45'];

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (date) {
        newDate.setHours(date.getHours(), date.getMinutes());
      } else {
        newDate.setHours(8, 0); // Default to 8:00 AM
      }
      setDate(newDate);
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
    if (!date) {
      const newDate = new Date();
      newDate.setHours(type === 'hour' ? parseInt(value) : 8);
      newDate.setMinutes(type === 'minute' ? parseInt(value) : 0);
      setDate(newDate);
    } else {
      const newDate = new Date(date);
      if (type === 'hour') {
        newDate.setHours(parseInt(value));
      } else {
        newDate.setMinutes(parseInt(value));
      }
      setDate(newDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP p') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[1200]" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          disabled={(d) => minDate ? d < new Date(minDate.setHours(0, 0, 0, 0)) : false}
        />
        <div className="border-t p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Time</span>
          </div>
          <div className="flex gap-2">
            <Select
              value={date ? date.getHours().toString() : ''}
              onValueChange={(value) => handleTimeChange('hour', value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent className="z-[1300]">
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hour.toString().padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={date ? date.getMinutes().toString() : ''}
              onValueChange={(value) => handleTimeChange('minute', value)}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent className="z-[1300]">
                {minutes.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    :{minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="border-t p-3">
          <Button
            size="sm"
            className="w-full"
            onClick={() => setIsOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
}

export function DatePicker({
  date,
  setDate,
  placeholder = 'Pick a date',
  className,
  disabled = false,
  minDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[1200]" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          disabled={(d) => minDate ? d < new Date(minDate.setHours(0, 0, 0, 0)) : false}
        />
      </PopoverContent>
    </Popover>
  );
}

interface TimePickerProps {
  time: string; // HH:mm format
  setTime: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({
  time,
  setTime,
  placeholder = 'Pick a time',
  className,
  disabled = false,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = ['00', '15', '30', '45'];

  const [hour, minute] = time ? time.split(':').map(Number) : [null, null];

  const handleHourChange = (newHour: string) => {
    const m = minute ?? 0;
    const newTime = `${newHour.padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    setTime(newTime);
    // Close if minute is already set
    if (minute !== null) {
      setIsOpen(false);
    }
  };

  const handleMinuteChange = (newMinute: string) => {
    const h = hour ?? 8;
    const newTime = `${h.toString().padStart(2, '0')}:${newMinute}`;
    setTime(newTime);
    // Close after selecting minute (hour will be set)
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !time && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {time || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 z-[1200]" align="start">
        <div className="flex gap-2">
          <Select
            value={hour?.toString() ?? ''}
            onValueChange={handleHourChange}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent className="z-[1300]">
              {hours.map((h) => (
                <SelectItem key={h} value={h.toString()}>
                  {h.toString().padStart(2, '0')}:00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={minute?.toString().padStart(2, '0') ?? ''}
            onValueChange={handleMinuteChange}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent className="z-[1300]">
              {minutes.map((m) => (
                <SelectItem key={m} value={m}>
                  :{m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
