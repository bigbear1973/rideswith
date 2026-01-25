export default function CreateRidePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create a Ride</h1>
      <p className="text-gray-600 mb-8">
        Organize a group ride and share it with the cycling community.
      </p>

      <div className="bg-white border rounded-lg p-6">
        <p className="text-gray-500">Ride creation form will be implemented here.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ride Title</label>
            <input
              type="text"
              placeholder="Saturday Morning Coffee Ride"
              className="w-full px-3 py-2 border rounded-md"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date & Time</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border rounded-md"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Meeting Location</label>
            <input
              type="text"
              placeholder="Start location address"
              className="w-full px-3 py-2 border rounded-md"
              disabled
            />
          </div>

          <button
            disabled
            className="w-full bg-blue-600 text-white py-2 rounded-md opacity-50 cursor-not-allowed"
          >
            Create Ride (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}
