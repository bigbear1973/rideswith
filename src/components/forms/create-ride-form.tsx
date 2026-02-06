'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CreateRideForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const title = String(formData.get('title') || '').trim();
    const date = String(formData.get('date') || '');
    const time = String(formData.get('time') || '');
    const locationName = String(formData.get('locationName') || '').trim();
    const locationAddress = String(formData.get('locationAddress') || '').trim();
    const latitude = String(formData.get('latitude') || '').trim();
    const longitude = String(formData.get('longitude') || '').trim();
    const distance = String(formData.get('distance') || '').trim();
    const pace = String(formData.get('pace') || '').trim();
    const description = String(formData.get('description') || '').trim();

    if (!title || !date || !time || !locationName || !locationAddress || !latitude || !longitude) {
      setIsLoading(false);
      setError('Please fill out all required fields, including coordinates.');
      return;
    }

    const dateTime = new Date(`${date}T${time}`);

    try {
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date: dateTime.toISOString(),
          locationName,
          locationAddress,
          latitude,
          longitude,
          distance: distance || null,
          paceMin: pace || null,
          paceMax: pace || null,
          description: description || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to create ride');
      }

      setSuccess('Ride created successfully.');
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ride');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Ride Title *
        </label>
        <Input
          id="title"
          name="title"
          placeholder="Saturday Morning Coffee Ride"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-2">
            Date *
          </label>
          <Input id="date" name="date" type="date" required />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium mb-2">
            Start Time *
          </label>
          <Input id="time" name="time" type="time" required />
        </div>
      </div>

      <div>
        <label htmlFor="locationName" className="block text-sm font-medium mb-2">
          Location Name *
        </label>
        <Input
          id="locationName"
          name="locationName"
          placeholder="Coffee shop, park, etc."
          required
        />
      </div>

      <div>
        <label htmlFor="locationAddress" className="block text-sm font-medium mb-2">
          Address *
        </label>
        <Input
          id="locationAddress"
          name="locationAddress"
          placeholder="Full address"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="latitude" className="block text-sm font-medium mb-2">
            Latitude *
          </label>
          <Input id="latitude" name="latitude" type="number" step="0.000001" required />
        </div>
        <div>
          <label htmlFor="longitude" className="block text-sm font-medium mb-2">
            Longitude *
          </label>
          <Input id="longitude" name="longitude" type="number" step="0.000001" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="distance" className="block text-sm font-medium mb-2">
            Distance (km)
          </label>
          <Input
            id="distance"
            name="distance"
            type="number"
            min="1"
            max="500"
            placeholder="50"
          />
        </div>
        <div>
          <label htmlFor="pace" className="block text-sm font-medium mb-2">
            Avg Pace (kph)
          </label>
          <Input
            id="pace"
            name="pace"
            type="number"
            min="10"
            max="60"
            placeholder="25"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full px-3 py-2 border rounded-md resize-none"
          placeholder="Tell riders what to expect..."
        />
      </div>

      <div>
        <label htmlFor="gpxFile" className="block text-sm font-medium mb-2">
          GPX File (optional)
        </label>
        <Input id="gpxFile" name="gpxFile" type="file" accept=".gpx" />
        <p className="text-xs text-gray-500 mt-1">
          GPX upload isn&apos;t wired up yet.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Ride'}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </form>
  );
}
