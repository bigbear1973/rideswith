export default function DiscoverPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Discover Rides</h1>
      <p className="text-gray-600 mb-8">
        Find group rides near you with smart filters for pace, distance, and difficulty.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="font-semibold mb-4">Filters</h2>
            <p className="text-sm text-gray-500">Filters will be implemented here.</p>
          </div>
        </div>

        {/* Map and ride list */}
        <div className="lg:col-span-2">
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center mb-6">
            <p className="text-gray-500">Map will be displayed here</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold">Upcoming Rides</h2>
            <p className="text-sm text-gray-500">Ride listings will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
