import Link from 'next/link';
import { Metadata } from 'next';
import { MessageCircle, Search, MapPin, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Telegram Bot | RidesWith',
  description: 'Find cycling group rides near you using our Telegram bot. Search with natural language like "gravel rides this weekend" or "rides near Leipzig".',
  openGraph: {
    title: 'Telegram Bot | RidesWith',
    description: 'Find cycling group rides near you using our Telegram bot. Search with natural language like "gravel rides this weekend" or "rides near Leipzig".',
    type: 'website',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/telegram`,
    siteName: 'RidesWith',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/og-default.png`,
        width: 1200,
        height: 630,
        alt: 'RidesWith Telegram Bot',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Telegram Bot | RidesWith',
    description: 'Find cycling group rides near you using our Telegram bot. Search with natural language like "gravel rides this weekend" or "rides near Leipzig".',
    images: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/og-default.png`],
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/telegram`,
  },
};

export default function TelegramPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 md:px-[60px] py-12 md:py-[60px]">
        {/* Header */}
        <span className="label-editorial block mb-6">Telegram Bot</span>
        <h1 className="heading-display mb-6">
          Find rides<br />on Telegram.
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl">
          Search for group rides using natural language, right from Telegram. No app needed.
        </p>

        {/* CTA Button */}
        <div className="mb-16">
          <Button asChild size="lg" className="gap-2">
            <a href="https://t.me/rideswith_bot" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" />
              Open @rideswith_bot
            </a>
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-full bg-foreground/5 flex items-center justify-center">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Natural Language Search</h3>
            <p className="text-sm text-muted-foreground">
              Just type what you&apos;re looking for: &quot;gravel rides this weekend&quot; or &quot;fast rides tomorrow&quot;
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-10 w-10 rounded-full bg-foreground/5 flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Location Aware</h3>
            <p className="text-sm text-muted-foreground">
              Share your location once and get rides near you, or search any city worldwide
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-10 w-10 rounded-full bg-foreground/5 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Instant Results</h3>
            <p className="text-sm text-muted-foreground">
              Get ride details with direct links to view more info and RSVP on RidesWith
            </p>
          </div>
        </div>

        {/* How to Use */}
        <div className="border-t border-border pt-12">
          <h2 className="text-xl font-semibold mb-8">How to use</h2>

          <div className="space-y-6 max-w-xl">
            <div className="flex gap-4">
              <span className="flex-shrink-0 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">1</span>
              <div>
                <p className="font-medium">Open the bot</p>
                <p className="text-sm text-muted-foreground">
                  Search for <a href="https://t.me/rideswith_bot" target="_blank" rel="noopener noreferrer" className="underline">@rideswith_bot</a> in Telegram or click the button above
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex-shrink-0 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">2</span>
              <div>
                <p className="font-medium">Start chatting</p>
                <p className="text-sm text-muted-foreground">
                  Send /start to begin, or just type your search like &quot;rides near Leipzig&quot;
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex-shrink-0 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">3</span>
              <div>
                <p className="font-medium">Share your location (optional)</p>
                <p className="text-sm text-muted-foreground">
                  Use the attachment button to share your location for faster &quot;nearby&quot; searches
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex-shrink-0 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">4</span>
              <div>
                <p className="font-medium">Click to view rides</p>
                <p className="text-sm text-muted-foreground">
                  Each ride has a link that opens the full details on RidesWith where you can RSVP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Example Queries */}
        <div className="border-t border-border pt-12 mt-12">
          <h2 className="text-xl font-semibold mb-6">Example searches</h2>
          <div className="flex flex-wrap gap-2">
            {[
              'rides near Leipzig',
              'gravel rides this weekend',
              'fast rides tomorrow',
              'rides near me',
              'road rides next week',
              'casual rides Leipzig',
            ].map((query) => (
              <span
                key={query}
                className="px-3 py-1.5 bg-muted rounded-full text-sm"
              >
                {query}
              </span>
            ))}
          </div>
        </div>

        {/* Back to Discover */}
        <div className="border-t border-border pt-12 mt-12">
          <p className="text-muted-foreground mb-4">
            Prefer to browse on the web?
          </p>
          <Link href="/discover" className="cta-link">
            Discover rides on RidesWith.com
          </Link>
        </div>
      </div>
    </div>
  );
}
