import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🚴</span>
              <span className="font-bold text-lg">GroupRide</span>
            </div>
            <p className="text-sm text-gray-600">
              Find and organize cycling group rides in your area.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Riders</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/discover" className="hover:text-blue-600">
                  Find Rides
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-blue-600">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Organizers</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/create" className="hover:text-blue-600">
                  Create a Ride
                </Link>
              </li>
              <li>
                <Link href="/for-clubs" className="hover:text-blue-600">
                  For Clubs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-blue-600">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-600">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} GroupRide. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
