'use client';

import { cn } from '@/lib/utils';
import type { PaceCategory } from '@/types';

interface MapPinProps {
  paceCategory?: PaceCategory;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

const PACE_COLORS: Record<PaceCategory, string> = {
  casual: '#10b981',
  moderate: '#3b82f6',
  fast: '#f59e0b',
  race: '#ef4444',
};

export function MapPin({
  paceCategory = 'moderate',
  isSelected = false,
  onClick,
  className,
}: MapPinProps) {
  const color = PACE_COLORS[paceCategory];

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center transition-transform',
        isSelected && 'scale-125 z-10',
        className
      )}
      aria-label={`Ride marker - ${paceCategory} pace`}
    >
      <svg
        width="24"
        height="32"
        viewBox="0 0 24 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"
          fill={color}
        />
        <circle cx="12" cy="12" r="4" fill="white" />
      </svg>
      {isSelected && (
        <span
          className="absolute -bottom-1 w-2 h-2 rounded-full animate-ping"
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
}
