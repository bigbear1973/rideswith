import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, MapPin, Calendar, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About | RidesWith',
  description: 'Learn about RidesWith - the platform connecting cyclists with group rides in their area.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary/10 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            About RidesWith
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We believe cycling is better together. RidesWith connects riders with
            group rides, cycling communities, and fellow enthusiasts in their area.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                Finding a group ride shouldn&apos;t be hard. Whether you&apos;re new to cycling
                and looking for a welcoming community, or a seasoned rider seeking fast-paced
                training partners, RidesWith helps you find your people.
              </p>
              <p className="text-muted-foreground mb-4">
                We built RidesWith because we experienced firsthand how difficult it can be
                to discover local rides. Information is scattered across social media, club
                websites, and word of mouth. We wanted to create a single place where anyone
                can find a ride that suits them.
              </p>
              <p className="text-muted-foreground">
                Our goal is simple: get more people riding together.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-semibold">Community First</p>
                  <p className="text-sm text-muted-foreground">Built for riders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-semibold">Local Focus</p>
                  <p className="text-sm text-muted-foreground">Rides near you</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-semibold">Always Updated</p>
                  <p className="text-sm text-muted-foreground">Fresh ride listings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Heart className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-semibold">Free to Use</p>
                  <p className="text-sm text-muted-foreground">For everyone</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Discover Rides</h3>
              <p className="text-sm text-muted-foreground">
                Browse rides in your area, filter by pace, distance, and date to find
                what works for you.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Join the Ride</h3>
              <p className="text-sm text-muted-foreground">
                RSVP to let the organizer know you&apos;re coming. Get all the details
                you need: start location, route, and what to bring.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Ride Together</h3>
              <p className="text-sm text-muted-foreground">
                Show up, meet new people, and enjoy the ride. Share photos and memories
                afterward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Ride?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Whether you want to join a ride or start organizing your own,
            RidesWith makes it easy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/discover">Find Rides</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/communities/create">Start a Community</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
