import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-4xl text-center">
        <h1 className="text-6xl font-bold mb-6">
          Find Your Next Group Ride
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover cycling group rides near you, join with one click, and get routes on any GPS platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/discover"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Discover Rides
          </Link>
          <Link
            href="/create"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Create a Ride
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <div className="text-center p-6 rounded-lg bg-gray-50">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="font-semibold mb-2 text-lg">Discover</h3>
          <p className="text-sm text-gray-600">Find rides on an interactive map with smart filters for pace, distance, and difficulty</p>
        </div>
        <div className="text-center p-6 rounded-lg bg-gray-50">
          <div className="text-4xl mb-4">🚴</div>
          <h3 className="font-semibold mb-2 text-lg">Join</h3>
          <p className="text-sm text-gray-600">RSVP with one click and get routes for Strava, Garmin, Wahoo, or any GPS device</p>
        </div>
        <div className="text-center p-6 rounded-lg bg-gray-50">
          <div className="text-4xl mb-4">📸</div>
          <h3 className="font-semibold mb-2 text-lg">Share</h3>
          <p className="text-sm text-gray-600">Upload and share photos after the ride with everyone who joined</p>
        </div>
      </div>

      <div className="mt-16 text-center text-sm text-gray-500">
        <p>For cycling clubs and organizers: Create a branded profile and manage all your rides in one place</p>
      </div>
    </div>
  );
}
