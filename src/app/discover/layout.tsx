import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Group Rides | RidesWith",
  description: "Find and join cycling group rides near you. Browse upcoming rides by location, distance, pace, and date. Connect with local cycling communities and discover new routes.",
  openGraph: {
    title: "Discover Group Rides | RidesWith",
    description: "Find and join cycling group rides near you. Browse upcoming rides by location, distance, pace, and date.",
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/discover`,
    siteName: "RidesWith",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover Group Rides | RidesWith",
    description: "Find and join cycling group rides near you. Browse upcoming rides by location, distance, pace, and date.",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/discover`,
  },
};

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
