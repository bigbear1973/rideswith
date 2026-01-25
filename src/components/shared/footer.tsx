import Link from 'next/link';
import { MapPin, PlusCircle, Users, Shield, FileText, Info } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-auto" role="contentinfo">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold"
                aria-hidden="true"
              >
                GR
              </div>
              <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                GroupRide
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find and organize cycling group rides in your area. Built for riders, by riders.
            </p>
          </div>

          {/* Riders */}
          <nav aria-labelledby="footer-riders-heading">
            <h3 id="footer-riders-heading" className="font-semibold mb-4 text-foreground">
              For Riders
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/discover"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  Find Rides
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Info className="w-4 h-4" aria-hidden="true" />
                  How It Works
                </Link>
              </li>
            </ul>
          </nav>

          {/* Organizers */}
          <nav aria-labelledby="footer-organizers-heading">
            <h3 id="footer-organizers-heading" className="font-semibold mb-4 text-foreground">
              For Organizers
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/create"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <PlusCircle className="w-4 h-4" aria-hidden="true" />
                  Create a Ride
                </Link>
              </li>
              <li>
                <Link
                  href="/for-clubs"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Users className="w-4 h-4" aria-hidden="true" />
                  For Clubs
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-labelledby="footer-legal-heading">
            <h3 id="footer-legal-heading" className="font-semibold mb-4 text-foreground">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Info className="w-4 h-4" aria-hidden="true" />
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Shield className="w-4 h-4" aria-hidden="true" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  Terms of Service
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} GroupRide. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with sustainability in mind
          </p>
        </div>
      </div>
    </footer>
  );
}
