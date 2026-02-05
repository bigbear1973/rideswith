import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const footerLinks = {
  riders: [
    { href: '/discover', label: 'Find Rides' },
    { href: '/communities', label: 'Communities' },
    { href: '/blog', label: 'Blog' },
  ],
  organizers: [
    { href: '/create', label: 'Create a Ride' },
    { href: '/communities/create', label: 'Start a Community' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-auto" role="contentinfo">
      <div className="mx-auto max-w-[1400px] px-6 md:px-[60px] py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                RW
              </div>
              <span className="font-bold">RidesWith</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Find your next group ride.
            </p>
          </div>

          {/* For Riders */}
          <nav aria-labelledby="footer-riders">
            <h3 id="footer-riders" className="font-semibold text-sm mb-3">
              For Riders
            </h3>
            <ul className="space-y-2">
              {footerLinks.riders.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* For Organizers */}
          <nav aria-labelledby="footer-organizers">
            <h3 id="footer-organizers" className="font-semibold text-sm mb-3">
              For Organizers
            </h3>
            <ul className="space-y-2">
              {footerLinks.organizers.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-labelledby="footer-company">
            <h3 id="footer-company" className="font-semibold text-sm mb-3">
              Company
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} RidesWith. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made for cyclists, by cyclists
          </p>
        </div>
      </div>
    </footer>
  );
}
