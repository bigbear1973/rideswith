import Link from 'next/link';
import { MapPin, Route, Users, Camera, Clock, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 lg:py-32 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance gradient-text">
            Find Your Next Group Ride
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
            Discover cycling group rides near you, join with one click, and get routes on any GPS platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/discover"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium text-lg"
            >
              <MapPin className="w-5 h-5" aria-hidden="true" />
              Discover Rides
            </Link>
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium text-lg"
            >
              <Route className="w-5 h-5" aria-hidden="true" />
              Create a Ride
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-muted/30" aria-labelledby="features-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="features-heading" className="sr-only">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <article className="bg-card rounded-xl p-6 lg:p-8 card-hover border border-border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-card-foreground">Discover</h3>
              <p className="text-muted-foreground">
                Find rides on an interactive map with smart filters for pace, distance, and terrain
              </p>
            </article>

            <article className="bg-card rounded-xl p-6 lg:p-8 card-hover border border-border">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-card-foreground">Join</h3>
              <p className="text-muted-foreground">
                RSVP with one click and get routes for Strava, Garmin, Wahoo, or any GPS device
              </p>
            </article>

            <article className="bg-card rounded-xl p-6 lg:p-8 card-hover border border-border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-card-foreground">Share</h3>
              <p className="text-muted-foreground">
                Upload and share photos after the ride with everyone who joined
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4" aria-labelledby="stats-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="stats-heading" className="sr-only">Platform statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground mt-1">Active Rides</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">2,000+</p>
              <p className="text-sm text-muted-foreground mt-1">Cyclists</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">50+</p>
              <p className="text-sm text-muted-foreground mt-1">Cities</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">100+</p>
              <p className="text-sm text-muted-foreground mt-1">Organizers</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/30" aria-labelledby="how-it-works-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="how-it-works-heading" className="text-2xl md:text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Find a Ride</h3>
              <p className="text-muted-foreground">
                Browse the map or search by location, date, and pace to find your perfect ride
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">RSVP & Download</h3>
              <p className="text-muted-foreground">
                Join with one click and download the route in GPX, FIT, or TCX format
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Ride & Share</h3>
              <p className="text-muted-foreground">
                Meet at the start, enjoy the ride, and share photos with the group
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Organizer CTA */}
      <section className="py-16 px-4" aria-labelledby="organizer-heading">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 md:p-12 text-center border border-border">
            <h2 id="organizer-heading" className="text-2xl md:text-3xl font-bold mb-4">
              Are You a Cycling Club or Organizer?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create a branded profile, manage all your rides in one place, and grow your community with easy invite links and automatic brand theming
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/organizers/create"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                <Zap className="w-5 h-5" aria-hidden="true" />
                Create Organizer Profile
              </Link>
              <Link
                href="/about/organizers"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
              >
                <Clock className="w-5 h-5" aria-hidden="true" />
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pace Legend */}
      <section className="py-12 px-4 border-t border-border" aria-labelledby="pace-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="pace-heading" className="text-lg font-semibold text-center mb-6">
            Ride Pace Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full pace-casual" aria-hidden="true"></span>
              <span className="text-sm">Casual (&lt;20 km/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full pace-moderate" aria-hidden="true"></span>
              <span className="text-sm">Moderate (20-28 km/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full pace-fast" aria-hidden="true"></span>
              <span className="text-sm">Fast (28-35 km/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full pace-race" aria-hidden="true"></span>
              <span className="text-sm">Race (&gt;35 km/h)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
