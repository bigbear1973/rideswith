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
- `src/components/providers/units-provider.tsx` - km/mi unit preference context
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

- Mobile-first responsive design
- Supports km/mi unit switching (stored in localStorage)
- Organizers can have custom branding (colors, logos)

### Design Inspiration: C40.org
Key elements to adopt from https://www.c40.org/:

**Color Palette:**
- Primary: Vibrant green (#00D26A or similar) - used for stats banners, CTAs
- Secondary: Cyan/teal (#00B8D4) - used for feature sections
- Accent: Black (#000) for contrast sections
- Background: Clean white with generous whitespace

**Typography:**
- Bold, impactful headlines (large font sizes, strong weight)
- Clear hierarchy with size and weight variations
- Sans-serif throughout for modern feel

**Layout Patterns:**
- Split hero sections: image left, content right (or vice versa)
- Full-width colored bands for visual breaks
- Card grids on colored backgrounds (like the 4-column feature cards on cyan)
- Generous padding and whitespace between sections
- Stats displayed prominently with large numbers

**Components Implemented:**
- [x] Stats banner (green background, big numbers) - `src/components/ui/stats-banner.tsx`
- [x] Split hero sections with illustration/photo + text - `src/components/ui/split-hero.tsx`
- [x] Feature cards on colored background - `src/components/ui/feature-card.tsx`
- [x] Colored section bands (green/cyan/black) - `src/components/ui/colored-section.tsx`
- [x] C40 button variants (outlined, uppercase, hover fills) - `src/components/ui/button.tsx`
- [ ] Scrolling marquee of organizer/city names (future)

**Button Styles:**
- Outlined/bordered buttons (not filled)
- Black border on white, white border on dark backgrounds
- Uppercase text for CTAs
- Hover: fill with contrasting color

---

## Planned Integrations

### Brand.dev (https://www.brand.dev/)
Use Brand.dev API to auto-fetch organizer branding:
- Logo, colors, fonts from company domain
- Auto-populate organizer profile when creating
- Apply brand colors to organizer's ride pages
- Environment variable: `BRAND_DEV_API_KEY`

### AI-Assisted Ride Creation
Natural language / voice input to auto-fill ride details:
- User describes ride: "Saturday morning coffee ride, 45km, starting at Phoenix Park at 8am, moderate pace, mostly flat roads"
- AI extracts: title, distance, location, time, pace, terrain
- Could use Claude API or OpenAI for parsing
- Optional voice input via Web Speech API
- Environment variable: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`

---

## Site Structure & 404 Analysis

### Existing Pages (Working)
| Route | File | Status |
|-------|------|--------|
| `/` | `src/app/page.tsx` | Working (mock data) |
| `/discover` | `src/app/discover/page.tsx` | Working (mock data) |
| `/create` | `src/app/create/page.tsx` | Fully working (requires auth) |
| `/settings` | `src/app/settings/page.tsx` | Fully working |
| `/auth/signin` | `src/app/auth/signin/page.tsx` | Working |
| `/auth/verify` | `src/app/auth/verify/page.tsx` | Working |
| `/auth/error` | `src/app/auth/error/page.tsx` | Working |
| `/rides/[id]` | `src/app/rides/[id]/page.tsx` | Working (fetches from DB) |
| `/organizers/[id]` | `src/app/organizers/[id]/page.tsx` | Placeholder only |

### Broken Links (404s)
| Link | Referenced In | Priority |
|------|---------------|----------|
| `/profile` | User menu dropdown | HIGH - visible to logged-in users |
| `/organizers/create` | Homepage CTA + Footer | HIGH - main conversion path |
| `/privacy` | Footer + Sign-in page | MEDIUM - legal requirement |
| `/terms` | Footer + Sign-in page | MEDIUM - legal requirement |
| `/about` | Footer | LOW |
| `/how-it-works` | Footer | LOW |
| `/about/organizers` | Homepage "Learn more" | LOW |

### Pages Needing Work
| Page | Current State | What's Needed |
|------|---------------|---------------|
| `/create` | ✅ DONE | Full form with location search, wired to API |
| `/profile` | Does not exist | Create user profile page |
| `/organizers/create` | Does not exist | Create organizer signup flow |
| `/organizers/[id]` | Shows ID only | Full organizer profile with rides |
| `/rides/[id]` | ✅ DONE | Fetches from database |

---

## Immediate TODO (Fix Basics First)

### 1. Fix Critical 404s
- [ ] Create `/profile` page (user profile)
- [ ] Create `/organizers/create` page (organizer signup)
- [ ] Create `/privacy` page (privacy policy)
- [ ] Create `/terms` page (terms of service)

### 2. Complete Placeholder Pages
- [x] `/create` - Full form with location search, API endpoint
- [ ] `/organizers/[id]` - Fetch real organizer data, show rides

### 3. Wire Up Database
- [ ] `/discover` - Fetch rides from DB instead of mock data
- [x] `/rides/[id]` - Fetch ride details from DB
- [ ] Homepage - Fetch featured rides from DB

---

## Development Roadmap

### Phase 1: Foundation (COMPLETE)
- [x] Next.js 16 + TypeScript setup
- [x] PostgreSQL + Prisma ORM
- [x] Auth.js magic link authentication via Resend
- [x] shadcn/ui component library
- [x] Dark/light theme support
- [x] Railway deployment pipeline
- [x] Database schema (User, Organizer, Ride, RSVP models)

### Phase 2: Core UI (COMPLETE)
- [x] Responsive navbar with user menu
- [x] Homepage with hero, featured rides, pace categories
- [x] Discover page with Leaflet map + filters
- [x] Ride detail page layout
- [x] Settings page (units, language, timezone)
- [x] Auth pages (signin, verify, error)
- [x] Unit switcher (km/mi) with context
- [x] C40.org-inspired redesign (green/cyan/black, bold typography, outlined buttons)

### Phase 3: Fix Basics (IN PROGRESS)
- [ ] Create missing pages (profile, organizers/create, privacy, terms)
- [x] Enable create ride form
- [ ] Build organizer profile page
- [ ] Wire pages to database (discover, rides, homepage)

### Phase 4: Backend APIs
- [x] GET/POST /api/rides - List and create rides
- [ ] GET/POST /api/rsvps - Manage attendance
- [ ] GET/POST /api/organizers - Organizer profiles

### Phase 5: Ride Management
- [x] Create ride form (full implementation)
- [ ] Edit/delete rides
- [ ] RSVP functionality (going/maybe/not going)
- [ ] Attendee list on ride detail
- [ ] Organizer dashboard

### Phase 6: Organizer Features
- [ ] Member management (invite, roles)
- [ ] Organizer branding (logo, colors)
- [ ] Organizer ride calendar

### Phase 7: Enhanced Features
- [ ] GPX route upload + map visualization
- [ ] Photo upload for rides
- [ ] Recurring rides
- [ ] Ride series/events
- [ ] Email notifications (ride reminders, updates)

### Phase 8: Discovery & Social
- [ ] Advanced search (location, date, pace)
- [ ] Follow organizers
- [ ] Ride history
- [ ] User ride stats
- [ ] Social sharing

---

## Current Status Summary

**Working:**
- Authentication (magic link emails)
- All UI pages rendered (responsive)
- Settings persistence (localStorage)
- Map with location search
- Filter UI on discover page

**Mock Data (not wired to DB):**
- Homepage rides (5 hardcoded)
- Discover page rides (5 Irish locations)

**Broken (404s):**
- /profile
- /organizers/create
- /privacy, /terms
- /about, /how-it-works, /about/organizers

**Placeholder/Disabled:**
- Organizer detail page (shows ID only)
- RSVP buttons
- Some API endpoints (rsvps, organizers)

**Recently Completed:**
- Create ride form (full implementation with location search)
- GET/POST /api/rides endpoints
- Auto-creates organizer for first-time ride creators
- C40.org-inspired site redesign (green/cyan/black color scheme, bold typography)
- New UI components: StatsBanner, ColoredSection, FeatureCard, SplitHero
- C40 button variants (outlined, uppercase, hover fills)
- Homepage redesign with stats banners, colored sections, feature grids
- Discover page styling updates
- Ride detail page now fetches from database (was mock data)

**Next Priority:** Wire discover page to database, fix UI/UX bugs, build profile pages.

---

## Active TODO List

### High Priority (Bugs)
- [ ] Fix discover page: distance dropdown doesn't filter rides
- [ ] Fix discover page: Pace/Distance filter buttons hidden behind map on mobile (z-index)
- [ ] Fix nav menu dropdown appearing behind map (Leaflet z-index issue)
- [ ] Fix: newly created rides not showing on discover page/map (still using mock data)
- [ ] Wire discover page to fetch rides from database

### Medium Priority (Features)
- [ ] Add edit ride functionality after creation
- [ ] Modernize date/time picker on create ride page
- [ ] Add ride history to user profile page
- [ ] Hide rides older than 14 days from discover, add past rides archive view

### Profile System
- [ ] Build /profile page with user details
- [ ] Each user should have a unique URL (e.g., /u/username)
- [ ] Allow users to edit their personalized URL/slug

### Known Leaflet Z-Index Issues
The Leaflet map uses high z-index values that cause UI elements to appear behind it:
- Navigation dropdown menu
- Filter dropdowns (pace, distance)
- Mobile filter buttons
Solution: Add higher z-index values to these elements or use Leaflet's `zIndexOffset`.
