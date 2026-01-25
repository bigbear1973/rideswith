# Group Ride Organizer Platform

A modern platform for discovering and organizing cycling group rides with AI-powered branding and universal route distribution.

## Features

- **Ride Discovery** - Find rides on interactive map with filters
- **AI Branding** - Auto-fetch club logos and colors via Brandfetch
- **Universal Routes** - Download routes for Strava, Garmin, RideWithGPS, Komoot
- **International** - Support for miles/km, mph/kph, timezones
- **Smart Notifications** - Push and email reminders
- **Photo Sharing** - Post-ride photo galleries
- **Analytics** - Track engagement and growth

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, PostgreSQL, Prisma
- **Maps:** Mapbox GL JS
- **Deployment:** Railway
- **CI/CD:** GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or use Railway database)
- Git

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd group-ride-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Set up database
npm run db:push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API routes
│   └── (pages)/      # Page components
├── components/       # React components
│   ├── ui/           # Base UI components
│   ├── map/          # Map-related components
│   └── forms/        # Form components
├── lib/              # Utilities and config
├── hooks/            # Custom React hooks
├── store/            # Zustand state management
├── types/            # TypeScript types
└── services/         # External API services
```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox API token for maps
- `BRANDFETCH_API_KEY` - Brandfetch API for club branding
- `CLOUDINARY_*` - Cloudinary for image storage
- `WEATHER_API_KEY` - OpenWeatherMap for forecasts

## Deployment

### Railway

1. Push to GitHub
2. Connect repository to Railway
3. Add PostgreSQL database
4. Set environment variables
5. Deploy automatically on push

## Development Workflow

1. Create feature branch
2. Make changes
3. Test locally
4. Commit and push
5. Create pull request
6. Merge to main
7. Auto-deploy to Railway

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/rides` - List rides with filters
- `POST /api/rides` - Create new ride
- `GET /api/rsvps` - List RSVPs
- `POST /api/rsvps` - Create RSVP
- `GET /api/organizers` - List organizers
- `POST /api/organizers` - Create organizer profile
- `GET /api/photos` - List photos
- `POST /api/photos` - Upload photo

## License

Private - All Rights Reserved
