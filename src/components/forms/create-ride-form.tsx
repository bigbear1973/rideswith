'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CreateRideForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement form submission
    setIsLoading(false);
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
        <label htmlFor="location" className="block text-sm font-medium mb-2">
          Meeting Location *
        </label>
        <Input
          id="location"
          name="location"
          placeholder="Coffee shop, park, etc."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="distance" className="block text-sm font-medium mb-2">
            Distance (km) *
          </label>
          <Input
            id="distance"
            name="distance"
            type="number"
            min="1"
            max="500"
            placeholder="50"
            required
          />
        </div>
        <div>
          <label htmlFor="pace" className="block text-sm font-medium mb-2">
            Avg Pace (kph) *
          </label>
          <Input
            id="pace"
            name="pace"
            type="number"
            min="10"
            max="60"
            placeholder="25"
            required
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
          Upload a GPX file for the route
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Ride'}
      </Button>
    </form>
  );
}
