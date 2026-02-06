import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Past Rides | RidesWith',
  description: 'Browse past cycling rides on RidesWith. Explore previous group rides by location, pace, and date.',
  openGraph: {
    title: 'Past Rides | RidesWith',
    description: 'Browse past cycling rides on RidesWith. Explore previous group rides by location, pace, and date.',
    type: 'website',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/discover/past`,
    siteName: 'RidesWith',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/og-default.png`,
        width: 1200,
        height: 630,
        alt: 'RidesWith Past Rides',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Past Rides | RidesWith',
    description: 'Browse past cycling rides on RidesWith. Explore previous group rides by location, pace, and date.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/og-default.png`],
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/discover/past`,
  },
};

export default function PastRidesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
