# RidesWith

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
- `src/lib/brand-dev.ts` - Brand.dev API integration for auto-fetching brand assets
- `src/components/providers/units-provider.tsx` - km/mi unit preference context
- `prisma/schema.prisma` - Database schema (User, Organizer, Ride, Rsvp, Brand, Chapter models)
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
- `BRAND_DEV_API_KEY` - For auto-fetching brand logos/colors from Brand.dev

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

## Brand & Chapter System

Brands (like Straede, Rapha) can have multiple city-based chapters. Each chapter has ambassadors who organize rides with the brand's styling applied.

### Hierarchy
```
Brand (e.g., Straede)
├── Brand Profile (logo, colors from Brand.dev)
└── Chapters (city-level)
    ├── Straede Leipzig
    ├── Straede Berlin
    └── Each has: Lead + Ambassadors (verified badges)
```

### URL Structure
- `/brands` - Browse all brands
- `/brands/[slug]` - Brand profile (e.g., /brands/straede)
- `/brands/[slug]/[chapter]` - Chapter page (e.g., /brands/straede/leipzig)
- `/brands/create` - Register a new brand
- `/brands/[slug]/create-chapter` - Start a chapter

### Database Models
- **Brand** - name, slug, domain, logo, logoDark, colors, backdrop, slogan (from Brand.dev)
- **Chapter** - brand reference, city, slug, member counts
- **ChapterMember** - user, chapter, role (LEAD or AMBASSADOR)
- **Ride** - optional `chapterId` for brand-affiliated rides

### API Endpoints
- `GET/POST /api/brands` - List and create brands
- `GET/PUT /api/brands/[slug]` - Brand details, refresh from Brand.dev
- `GET/POST /api/chapters` - List and create chapters
- `GET/PUT/POST /api/chapters/[id]` - Chapter details, update, add members

### Verified Badges
Chapter members (Leads and Ambassadors) display a blue verified checkmark:
- On their profile pages
- On ride cards they organize
- In attendee lists

### Brand.dev Integration (IMPLEMENTED)
`src/lib/brand-dev.ts` provides:
- `fetchBrandAssets(domain)` - Fetches logo, colors, fonts, backdrop, slogan from domain
- Auto-populates brand profile when domain is entered
- Can refresh brand assets via PUT `/api/brands/[slug]` with `refreshBranding: true`

### Chapter-Linked Rides (IMPLEMENTED)
When creating a ride from a chapter page:
- `/create?chapterId=xxx` - Links the ride to a chapter
- Ride detail page shows brand backdrop image and slogan in header
- Promotional banner at bottom links back to the brand/chapter
- Chapter ride counts are automatically incremented

---

## Planned Integrations

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
| `/discover` | `src/app/discover/page.tsx` | Fully working (fetches from DB) |
| `/discover/past` | `src/app/discover/past/page.tsx` | Past rides archive |
| `/create` | `src/app/create/page.tsx` | Fully working (requires auth) |
| `/settings` | `src/app/settings/page.tsx` | Fully working |
| `/profile` | `src/app/profile/page.tsx` | User profile with ride history |
| `/profile/edit` | `src/app/profile/edit/page.tsx` | Edit profile with custom URL |
| `/u/[slug]` | `src/app/u/[slug]/page.tsx` | Public profile by custom URL |
| `/auth/signin` | `src/app/auth/signin/page.tsx` | Working |
| `/auth/verify` | `src/app/auth/verify/page.tsx` | Working |
| `/auth/error` | `src/app/auth/error/page.tsx` | Working |
| `/rides/[id]` | `src/app/rides/[id]/page.tsx` | Working (fetches from DB) |
| `/rides/[id]/edit` | `src/app/rides/[id]/edit/page.tsx` | Edit/delete rides |
| `/organizers/[id]` | `src/app/organizers/[id]/page.tsx` | Placeholder only |
| `/brands` | `src/app/brands/page.tsx` | Brand communities listing |
| `/brands/create` | `src/app/brands/create/page.tsx` | Register new brand |
| `/brands/[slug]` | `src/app/brands/[slug]/page.tsx` | Brand profile with chapters |
| `/brands/[slug]/[chapter]` | `src/app/brands/[slug]/[chapter]/page.tsx` | Chapter page with rides |
| `/brands/[slug]/create-chapter` | `src/app/brands/[slug]/create-chapter/page.tsx` | Start a chapter |

### Broken Links (404s)
| Link | Referenced In | Priority |
|------|---------------|----------|
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
| `/profile` | ✅ DONE | User profile with ride history and stats |
| `/profile/edit` | ✅ DONE | Edit profile including custom URL slug |
| `/u/[slug]` | ✅ DONE | Public profile pages |
| `/rides/[id]/edit` | ✅ DONE | Edit and delete rides |
| `/discover/past` | ✅ DONE | Past rides archive with filters |
| `/organizers/create` | Does not exist | Create organizer signup flow |
| `/organizers/[id]` | Shows ID only | Full organizer profile with rides |
| `/rides/[id]` | ✅ DONE | Fetches from database |

---

## Immediate TODO (Fix Basics First)

### 1. Fix Critical 404s
- [x] Create `/profile` page (user profile)
- [ ] Create `/organizers/create` page (organizer signup)
- [ ] Create `/privacy` page (privacy policy)
- [ ] Create `/terms` page (terms of service)

### 2. Complete Placeholder Pages
- [x] `/create` - Full form with location search, API endpoint
- [x] `/profile` - User profile with ride history and stats
- [x] `/profile/edit` - Edit profile with custom slug
- [x] `/u/[slug]` - Public profile pages
- [x] `/rides/[id]/edit` - Edit and delete rides
- [x] `/discover/past` - Past rides archive
- [ ] `/organizers/[id]` - Fetch real organizer data, show rides

### 3. Wire Up Database
- [x] `/discover` - Fetch rides from DB instead of mock data
- [x] `/rides/[id]` - Fetch ride details from DB
- [x] Homepage - Fetch latest rides from DB (via /api/rides/latest)

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

### Phase 3: Fix Basics (MOSTLY COMPLETE)
- [x] Create profile pages (/profile, /profile/edit, /u/[slug])
- [ ] Create missing pages (organizers/create, privacy, terms)
- [x] Enable create ride form
- [ ] Build organizer profile page
- [x] Wire pages to database (discover, rides)
- [x] Wire homepage to database (latest rides from /api/rides/latest)

### Phase 4: Backend APIs
- [x] GET/POST /api/rides - List and create rides
- [x] GET/PUT/DELETE /api/rides/[id] - Individual ride operations
- [x] GET /api/rides/past - Past rides for archive
- [x] GET /api/rides/latest - Latest 3 rides for homepage
- [x] GET/PUT /api/profile - User profile management
- [x] GET /api/profile/check-slug - Slug availability check
- [ ] GET/POST /api/rsvps - Manage attendance
- [ ] GET/POST /api/organizers - Organizer profiles

### Phase 5: Ride Management
- [x] Create ride form (full implementation)
- [x] Edit/delete rides
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
- [x] Ride history (on profile page)
- [x] User ride stats (on profile page)
- [ ] Social sharing
- [x] Past rides archive (/discover/past)

---

## Current Status Summary

**Working:**
- Authentication (magic link emails)
- All UI pages rendered (responsive)
- Settings persistence (localStorage)
- Map with location search
- Filter UI on discover page (with working distance + pace filters)
- Discover page fetches from database
- User profile pages with ride history and stats
- Public profile URLs (/u/username)
- Edit/delete rides for organizers
- Past rides archive

**Recently Wired to DB:**
- Homepage "Latest rides" section (fetches from /api/rides/latest)

**Broken (404s):**
- /organizers/create
- /privacy, /terms
- /about, /how-it-works, /about/organizers

**Placeholder/Disabled:**
- Organizer detail page (shows ID only)
- RSVP buttons
- Some API endpoints (rsvps, organizers)

**Recently Completed:**
- Brand & Chapter system with hierarchical organization
- Brand.dev integration for auto-fetching brand assets (logo, logoDark, backdrop, slogan)
- Verified badge component for brand ambassadors
- Brand pages (/brands, /brands/[slug], /brands/[slug]/[chapter])
- Brand/chapter creation flows
- Chapter-linked ride creation (/create?chapterId=xxx)
- Ride detail pages show brand backdrop/slogan for chapter rides
- Mobile menu auto-closes when link is clicked
- Mobile menu includes user account options (profile, settings, sign out)
- Discover page wired to database (was mock data)
- Fixed distance dropdown filter (was not applying filter)
- Fixed z-index issues (nav menu, filters appearing behind Leaflet map)
- User profile system (/profile, /profile/edit, /u/[slug])
- Profile includes ride history, stats, custom URL slugs
- Edit ride functionality with delete confirmation
- Modern date/time pickers (shadcn calendar + popover)
- Past rides archive (/discover/past) with time range and pace filters
- Rebrand from GroupRide to RidesWith
- Homepage "Latest rides" section now fetches from database
- Fixed dark mode text visibility on feature cards
- Consolidated ride details/attendees into sidebar info card

**Next Priority:** Add RSVP functionality, show verified badges on ride cards.

---

## Active TODO List

### Completed Recently
- [x] Fix discover page: distance dropdown doesn't filter rides
- [x] Fix discover page: Pace/Distance filter buttons hidden behind map on mobile (z-index)
- [x] Fix nav menu dropdown appearing behind map (Leaflet z-index issue)
- [x] Fix: newly created rides not showing on discover page/map (wired to DB)
- [x] Wire discover page to fetch rides from database
- [x] Add edit ride functionality after creation
- [x] Modernize date/time picker on create ride page
- [x] Add ride history to user profile page
- [x] Hide rides older than 14 days from discover, add past rides archive view
- [x] Build /profile page with user details
- [x] Each user should have a unique URL (/u/username)
- [x] Allow users to edit their personalized URL/slug
- [x] Rebrand from GroupRide to RidesWith (all files, emails, UI)
- [x] Wire homepage "Latest rides" to database (/api/rides/latest)
- [x] Fix dark mode text visibility on homepage feature cards
- [x] Consolidate ride details/attendees into sidebar info card
- [x] Brand & Chapter system (Brand, Chapter, ChapterMember models)
- [x] Brand.dev integration for auto-fetching brand assets (logo, logoDark, backdrop, slogan)
- [x] Brand pages (/brands, /brands/[slug], /brands/[slug]/[chapter])
- [x] Verified badge component for brand ambassadors
- [x] Brand/chapter creation flows
- [x] Chapter-linked ride creation (/create?chapterId=xxx)
- [x] Ride detail pages show brand backdrop/slogan for chapter rides
- [x] Mobile menu auto-closes on link click
- [x] Mobile menu includes user account options

### High Priority (Next Up)
- [x] Wire ride creation to optionally associate with a chapter
- [x] Mobile menu auto-close on link click
- [x] Mobile menu user account options (profile, settings, sign out)
- [ ] Show verified badges on ride cards for chapter members
- [ ] Add RSVP functionality (going/maybe/not going)

### Medium Priority
- [ ] Build organizer profile page (/organizers/[id])
- [ ] Create /privacy page (privacy policy)
- [ ] Create /terms page (terms of service)

### Leaflet Z-Index (RESOLVED)
Fixed by adding higher z-index values to UI elements:
- Navbar: z-[1000]
- Dropdown menus: z-[1100]
- Mobile sheet: z-[1200]
