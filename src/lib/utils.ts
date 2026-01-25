import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Unit conversion utilities
export const milesToKm = (miles: number): number => miles * 1.60934;
export const kmToMiles = (km: number): number => km * 0.621371;
export const mphToKph = (mph: number): number => mph * 1.60934;
export const kphToMph = (kph: number): number => kph * 0.621371;

export function formatDistance(km: number, unit: 'imperial' | 'metric'): string {
  if (unit === 'imperial') {
    return `${kmToMiles(km).toFixed(1)} mi`;
  }
  return `${km.toFixed(1)} km`;
}

export function formatPace(kph: number, unit: 'imperial' | 'metric'): string {
  if (unit === 'imperial') {
    return `${kphToMph(kph).toFixed(1)} mph`;
  }
  return `${kph.toFixed(1)} kph`;
}

export function getPaceCategory(kph: number): 'casual' | 'moderate' | 'fast' | 'race' {
  if (kph < 20) return 'casual';
  if (kph < 26) return 'moderate';
  if (kph < 32) return 'fast';
  return 'race';
}

export function formatDateTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (days > 7) {
    return formatDateTime(date, Intl.DateTimeFormat().resolvedOptions().timeZone);
  }
  if (days > 1) {
    return `in ${days} days`;
  }
  if (days === 1) {
    return 'tomorrow';
  }
  if (hours > 1) {
    return `in ${hours} hours`;
  }
  if (hours === 1) {
    return 'in 1 hour';
  }
  if (diff > 0) {
    return 'starting soon';
  }
  return 'past';
}
