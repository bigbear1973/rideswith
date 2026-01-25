# GroupRide (RidesWith)

Cycling group ride discovery and management platform.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Auth.js v5 (next-auth@beta) with magic link email via Resend
- **UI**: shadcn/ui + Tailwind CSS v4 + Radix primitives
- **Maps**: Leaflet + OpenStreetMap (free, no API key needed)
- **State**: Zustand for client state, React Context for units (km/mi)
- **Deployment**: Railway (https://rideswith-production.up.railway.app)
- **Repo**: https://github.com/bigbear1973/rideswith

## Key Files

- `src/lib/auth.ts` - Auth.js config with custom Resend email provider
- `src/lib/prisma.ts` - Prisma client singleton
- `src/contexts/UnitsContext.tsx` - km/mi unit preference context
- `prisma/schema.prisma` - Database schema (User, Organizer, Ride, Rsvp models)
- `railway.json` - Railway deployment config

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run typecheck    # TypeScript check
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## Environment Variables (Railway)

- `DATABASE_URL` - PostgreSQL connection (linked from Railway Postgres service)
- `AUTH_SECRET` - Auth.js secret
- `AUTH_URL` - https://rideswith-production.up.railway.app
- `RESEND_API_KEY` - For magic link emails
- `EMAIL_FROM` - Sender address (using resend.dev for now)

## Design Notes

- Meetup-inspired UI with green (#16a34a) primary color
- Mobile-first responsive design
- Supports km/mi unit switching (stored in localStorage)
- Organizers can have custom branding (colors, logos)

## Current State

- Auth with magic links working
- Homepage with ride cards (static data for now)
- Discover page with map view
- Unit switcher in navbar
