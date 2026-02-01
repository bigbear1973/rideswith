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
- `src/lib/roles.ts` - Chapter role helpers (normalizeRole, isOwner, isAdmin, isModerator)
- `src/lib/platform-admin.ts` - Platform admin helpers (isPlatformAdmin, canManageSponsors)
- `src/lib/strava.ts` - Strava OAuth and API client
- `src/lib/strava-sync.ts` - Strava club event sync logic
- `src/components/providers/units-provider.tsx` - km/mi unit preference context
- `src/components/rides/location-link.tsx` - Map app picker (Apple Maps, Google Maps, Waze)
- `src/components/rides/cake-and-coffee.tsx` - Post-ride comments and media gallery
- `prisma/schema.prisma` - Database schema (User, Organizer, Ride, Rsvp, Brand, Chapter models)
- `prisma/seed.ts` - Database seed script (sets platform admin on deployment)
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
- `AUTH_URL` - https://rideswith.com
- `RESEND_API_KEY` - For magic link emails
- `EMAIL_FROM` - Sender address (using resend.dev for now)
- `BRAND_DEV_API_KEY` - For auto-fetching brand logos/colors from Brand.dev
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (server-side)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (client-side)
- `CLOUDINARY_API_KEY` - Cloudinary API key (for deletions)
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (for deletions)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Web Push VAPID public key (for push notifications)
- `VAPID_PRIVATE_KEY` - Web Push VAPID private key (for push notifications)
- `VAPID_EMAIL` - Contact email for push service (optional, defaults to support@rideswith.com)
- `STRAVA_CLIENT_ID` - Strava OAuth app client ID
- `STRAVA_CLIENT_SECRET` - Strava OAuth app client secret
- `STRAVA_REDIRECT_URI` - OAuth callback URL (defaults to AUTH_URL/api/strava/callback)

## Design Notes

- Mobile-first responsive design
- Supports km/mi unit switching (stored in localStorage)
- Organizers can have custom branding (colors, logos)

### Editorial Design System (January 2026)

Minimalist editorial design inspired by high-end print magazines and editorial websites.

**Color Palette:**
- Background: Warm off-white (#F9F8F6 light / #0A0A0A dark)
- Text: Rich black (#1A1A1A light / #F5F5F5 dark)
- Borders: Warm gray (#E6E4E0 light / #2A2A2A dark)
- Muted text: #737373

**Typography:**
- Font: Inter (clean, modern sans-serif)
- Uppercase labels with tight letter-spacing (-0.05em)
- Large display headings (text-4xl to text-6xl)
- Body text: 15-16px with relaxed line-height

**Layout Patterns:**
- Two-column grid: `grid-cols-[1.2fr_0.8fr]` with 120px gap
- Max width container: `max-w-[1400px]` with `px-6 md:px-[60px]` padding
- Thin borders instead of card backgrounds
- Generous whitespace (60px vertical padding)
- Sticky sidebars for info sections

**CSS Utility Classes** (defined in `globals.css`):
```css
.label-editorial      /* Uppercase section labels */
.heading-display      /* Large display headings */
.list-item-editorial  /* List items with hover effects */
.stat-row             /* Statistics display rows */
.cta-link             /* Call-to-action links */
.icon-btn-circle      /* Circular arrow buttons */
```

**Key Design Elements:**
- Circle arrow buttons that fill on hover
- List items with bottom borders, not cards
- Stats displayed as value + label rows
- Date columns in ride lists (month abbrev + day number)
- Member avatars stacked with overlap (-space-x-2)

**Pages Using Editorial Design:**
- Homepage (`src/app/page.tsx`)
- Discover (`src/app/discover/page.tsx`)
- Ride Detail (`src/app/rides/[id]/page.tsx`)
- Communities Listing (`src/app/communities/page.tsx`)
- Community Detail (`src/app/communities/[slug]/page.tsx`)
- Chapter Page (`src/app/communities/[slug]/[chapter]/page.tsx`)
- User Profile (`src/app/u/[slug]/page.tsx`)

**ArrowIcon Component:**
Used across all pages for consistent list item navigation:
```tsx
const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
```

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
- `/communities` - Browse all communities (brands, clubs, groups)
- `/communities/[slug]` - Community profile (e.g., /communities/straede)
- `/communities/[slug]/edit` - Edit community settings, manage community-level sponsors
- `/communities/[slug]/[chapter]` - Chapter page (e.g., /communities/straede/leipzig)
- `/communities/[slug]/[chapter]/edit` - Chapter settings, manage chapter sponsors
- `/communities/create` - Register a new community
- `/communities/[slug]/create-chapter` - Start a chapter

### Database Models
- **Brand** - name, slug, domain, discipline, logo, logoDark, colors, backdrop, slogan (from Brand.dev), social links (instagram, twitter, facebook, strava, youtube)
- **Chapter** - brand reference, city, slug, discipline (override), member counts
- **ChapterMember** - user, chapter, role (OWNER, ADMIN, MODERATOR; legacy: LEAD, AMBASSADOR)
- **Ride** - optional `chapterId` for brand-affiliated rides, `paceMin`/`paceMax` for custom speed range

### Community Discipline (IMPLEMENTED)
Communities can specify their primary cycling discipline:
- **Road** - Road cycling on paved roads
- **Gravel** - Gravel and unpaved roads
- **Mountain Bike** - Off-road mountain biking
- **Mixed (Road & Gravel)** - Combination rides
- **Mixed (Road & Cycle Path)** - Road and dedicated cycle paths
- **Cycle Path Only** - Dedicated cycling infrastructure

Discipline is set during community creation and can be edited in community settings.
The communities listing page includes a discipline filter to help users find relevant communities.

### Community Social Links (IMPLEMENTED)
Communities can display links to their social media profiles:
- Instagram, Twitter/X, Facebook, Strava Club, YouTube
- Stored in Brand model as optional string fields
- Edit via community edit page (`/communities/[slug]/edit`)
- Displayed as icon row in community hero section
- Smart URL handling: accepts handles (`@username`) or full URLs

### Community Types (IMPLEMENTED)
Communities can be one of four types, displayed as badges:
- **BRAND** - Commercial cycling brand (Rapha, Straede) - purple badge
- **CLUB** - Cycling club with members - blue badge
- **TEAM** - Racing or competitive team - orange badge
- **GROUP** - Informal riding group - green badge

### API Endpoints
- `GET/POST /api/communities` - List and create communities
- `GET/PUT /api/communities/[slug]` - Community details, refresh from Brand.dev
- `GET/POST /api/chapters` - List and create chapters
- `GET/PUT/POST /api/chapters/[id]` - Chapter details, update, add members

### Community Admin Roles (IMPLEMENTED)
Chapter members can have different roles with varying permissions:
- **OWNER** - Full control, can transfer ownership, delete community
- **ADMIN** - Can manage members, edit settings, create rides
- **MODERATOR** - Can create rides, moderate content
- Legacy roles (LEAD, AMBASSADOR) are mapped to new roles via `src/lib/roles.ts`

### Verified Badges
Chapter members (Owners, Admins, Moderators) display a blue verified checkmark:
- On their profile pages
- On ride cards they organize
- In attendee lists

### Brand.dev Integration (IMPLEMENTED)
`src/lib/brand-dev.ts` provides:
- `fetchBrandAssets(domain)` - Fetches logo, colors, fonts, backdrop, slogan from domain
- Auto-populates brand profile when domain is entered
- Can refresh brand assets via PUT `/api/communities/[slug]` with `refreshBranding: true`

### Chapter-Linked Rides (IMPLEMENTED)
When creating a ride from a chapter page:
- `/create?chapterId=xxx` - Links the ride to a chapter
- Ride detail page shows brand backdrop image and slogan in header
- Promotional banner at bottom links back to the brand/chapter
- Chapter ride counts are automatically incremented

### Custom Speed Range (IMPLEMENTED)
Replaced fixed pace categories (Casual/Moderate/Fast/Race) with custom speed inputs:
- **Fields**: `paceMin` and `paceMax` (Float, nullable) in km/h
- **Create/Edit forms**: Two number inputs for min and max speed
- **Display formats**:
  - Both set: "25-30 km/h"
  - Min only: "25+ km/h"
  - Max only: "Up to 30 km/h"
- **Copy/paste**: Included in ride detail share text
- **Legacy**: `pace` field (RidePace enum) kept for backward compatibility but no longer used in UI

### Ride Detail Page Layout
- Ride Info card displayed in main content (under date/time and location)
- Discussion section in main content area (below route links, above RSVP card) - visible for all rides
- Sidebar (branded rides only) shows "Presented by" card and sponsor cards
- "Presented by" card can be hidden at community or chapter level (hidePresentedBy setting)
- "Hosted by" links to the creator's user profile (/u/slug), not the organizer entity

### Chapter Team Management (IMPLEMENTED)
- Chapter settings page includes team member management section
- Owners can add/remove members, change roles (Owner, Admin, Moderator)
- Admins can only add/manage Moderators
- User search by name or email via `/api/users/search` endpoint
- Roles have hierarchical permissions for editing chapters and creating rides

### Recurring Rides (IMPLEMENTED)
Organizers can create recurring ride series that repeat on a schedule.

**Recurrence Options:**
- **WEEKLY** - Same day every week
- **BIWEEKLY** - Same day every 2 weeks
- **MONTHLY** - Same day every month

**Database Fields (Ride model):**
```prisma
recurrencePattern   RecurrencePattern? // WEEKLY, BIWEEKLY, MONTHLY
recurrenceDay       Int?               // 0-6 for day of week (0=Sunday)
recurrenceEndDate   DateTime?          // When the series ends
recurrenceSeriesId  String?            // Links rides in same series
isRecurringTemplate Boolean            // True for the template ride
```

**How it works:**
- When creating a recurring ride, all instances are generated at creation time
- Each instance is a separate ride record, linked via `recurrenceSeriesId`
- The first ride is marked as `isRecurringTemplate: true`
- Editing one instance only affects that occurrence, not the entire series
- Homepage "Latest rides" only shows template rides (not all instances)

**UI:**
- Create form has "Make this a recurring ride" toggle
- Edit form shows info banner if ride is part of a series
- Delete dialog for recurring rides offers: "This ride only", "This and following", "All rides in series"

### Ride Description Snippets (IMPLEMENTED)
Ride creators can save and reuse text blocks (snippets) for ride descriptions.

**Features:**
- Create, edit, delete reusable text snippets
- Organize by category (e.g., "Etiquette", "Safety", "Gear")
- Insert snippets into ride descriptions via picker button
- Great for standardizing ride etiquette, what to bring, safety guidelines, etc.

**Database Model:**
```prisma
model RideSnippet {
  id        String   @id @default(cuid())
  userId    String
  title     String   // e.g., "Group Ride Etiquette"
  content   String   @db.Text
  category  String?  // Optional grouping
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Key Files:**
- `src/app/settings/snippets/page.tsx` - Snippet management UI
- `src/components/rides/snippet-picker.tsx` - Insert snippet button/dialog
- `src/app/api/snippets/route.ts` - List/create snippets
- `src/app/api/snippets/[id]/route.ts` - Get/update/delete snippet

**UI Locations:**
- Settings → Ride Snippets: Manage all snippets
- Create/Edit Ride → "Insert Snippet" button next to description field

### Add to Calendar (IMPLEMENTED)
Users can export rides to their calendar app.

**Supported:**
- Google Calendar (opens in new tab)
- Outlook Web (opens in new tab)
- Apple Calendar (.ics file download)

**Component:** `src/components/rides/add-to-calendar.tsx`
**Location:** Appears below the date/time on ride detail pages (for upcoming rides only)

### Past Rides on Chapter Pages (IMPLEMENTED)
- Chapter pages show collapsible "Past Rides" section
- Past rides load on-demand when expanded (API: `?includePastRides=true`)
- Shows up to 20 most recent past rides
- Displays with slightly faded styling to distinguish from upcoming rides

### Community Sponsors/Partners/Ads (IMPLEMENTED)
Communities and chapters can manage sponsors that display on ride detail pages.

**Hierarchy:**
- Chapters manage their own sponsors (no inheritance from community)
- Chapters can inherit the sponsor *label* from the community, or set their own
- Label options: "sponsors", "partners", or "ads"

**Display Sizes:**
- **SMALL** - Logo + name only (compact)
- **MEDIUM** - Logo + name + description (up to 150 chars ad copy)
- **LARGE** - Featured with backdrop image + logo + name + description

**Database Model:**
```prisma
model Sponsor {
  id          String      @id @default(cuid())
  brandId     String?     // Community-level sponsor
  chapterId   String?     // Chapter-level sponsor
  name        String
  domain      String?     // For Brand.dev lookup
  description String?     @db.VarChar(150)
  website     String      // Click-through URL
  logo        String?
  backdrop    String?     // Wide banner for LARGE display
  primaryColor String?
  displaySize SponsorSize @default(SMALL)
  isActive    Boolean     @default(true)
  displayOrder Int        @default(0)
}

enum SponsorSize {
  SMALL
  MEDIUM
  LARGE
}
```

**Key Files:**
- `src/components/communities/sponsor-card.tsx` - Renders sponsors in Small/Medium/Large formats
- `src/components/communities/sponsor-form.tsx` - Add/edit sponsor with size selector, image uploads
- `src/app/communities/[slug]/edit/page.tsx` - Community sponsor management
- `src/app/communities/[slug]/[chapter]/edit/page.tsx` - Chapter settings with sponsor management

**API Endpoints:**
- `GET/POST /api/communities/[slug]/sponsors` - Community-level sponsors
- `PUT/DELETE /api/communities/[slug]/sponsors/[id]` - Update/delete community sponsor
- `GET/POST /api/communities/[slug]/[chapter]/sponsors` - Chapter-level sponsors
- `PUT/DELETE /api/communities/[slug]/[chapter]/sponsors/[id]` - Update/delete chapter sponsor

**Ride Display:**
- Sponsors appear in the sidebar on ride detail pages (for branded rides)
- Only chapter-specific sponsors are shown (not inherited from community)
- Section header uses the chapter's label (or inherited from community)

### Platform Admin & Paid Sponsors (IMPLEMENTED)
Platform owner controls which communities can use the sponsors feature, enabling monetization as a paid add-on.

**User Roles:**
- **USER** - Default role for all users
- **PLATFORM_ADMIN** - Special role with full platform access (only `rogermbyrne@gmail.com`)

**Database Fields:**
```prisma
model User {
  role  String @default("USER")  // "USER" | "PLATFORM_ADMIN"
}

model Brand {
  sponsorsEnabled Boolean @default(false)  // Only platform admin can enable
}
```

**How it works:**
- Platform admin is automatically set via seed script on deployment
- Communities have `sponsorsEnabled` flag (default: false)
- Only platform admin can toggle `sponsorsEnabled` via admin panel
- Community owners can only manage sponsors if the feature is enabled

**Admin Panel:**
- URL: `/admin/communities` (https://rideswith.com/admin/communities)
- Only accessible by platform admin
- Shows all communities with toggle for `sponsorsEnabled`
- Displays community name, type, owner, and chapter count
- Expandable rows to show chapters within each community
- Chapter-level sponsor toggle (inherit from brand, or explicitly disable)

**Key Files:**
- `src/lib/platform-admin.ts` - Helper functions (`isPlatformAdmin`, `canManageSponsors`)
- `src/types/next-auth.d.ts` - TypeScript types for session with role
- `src/app/admin/communities/page.tsx` - Admin panel UI
- `src/app/api/admin/communities/route.ts` - GET all communities
- `src/app/api/admin/communities/[id]/route.ts` - PATCH to toggle sponsorsEnabled
- `prisma/seed.ts` - Sets platform admin on deployment

**API Endpoints:**
- `GET /api/admin/communities` - List all communities with chapters (platform admin only)
- `PATCH /api/admin/communities/[id]` - Update community settings (sponsorsEnabled)
- `PATCH /api/admin/chapters/[id]` - Update chapter settings (sponsorsEnabled)

**UI Behavior:**
- Community owners see sponsors section only if `sponsorsEnabled === true`
- Platform admin always sees sponsors section
- When disabled, owners see: "Contact us to enable sponsors for your community"

**Deployment Setup:**
- Seed script runs automatically on Railway via `npm run start`
- Sets `rogermbyrne@gmail.com` as PLATFORM_ADMIN if user exists
- If user doesn't exist yet, they become admin on first login (handled by seed on next deploy)

---

## Cake & Coffee Stop (Post-Ride Social)

Post-ride social features that unlock after a ride's date has passed.

### Features
- **Comments**: Users can post comments about the ride experience, with threaded replies
- **Media Gallery**: Upload photos and videos from the ride
- **Lightbox**: Click to view full-size photos or play videos

### Implementation
- Component: `src/components/rides/cake-and-coffee.tsx`
- API endpoints:
  - `GET/POST/DELETE /api/rides/[id]/comments` - Manage comments
  - `GET/POST/DELETE /api/rides/[id]/photos` - Manage photos/videos

### Cloudinary Integration
- **Upload**: Client-side unsigned upload to Cloudinary
- **Upload presets** (must be configured as unsigned in Cloudinary dashboard):
  - `ride_photos` - For ride photos/videos (folder: `ride-photos`)
  - `profile_photos` - For user profile images (folder: `profile-photos`)
- **Thumbnails**: Auto-generated at 400x300 for gallery grid
- **Video thumbnails**: Cloudinary generates frame from video

### Database Models
```prisma
model RideComment {
  id, rideId, userId, content, parentId (for replies), createdAt, updatedAt
  parent/replies relations for threading
  @@index([rideId, createdAt])
}

model RidePhoto {
  id, rideId, userId, publicId, url, thumbnailUrl, width, height, isVideo, caption, createdAt
  @@index([rideId, createdAt])
}
```

### Permissions
- Any signed-in user can post comments and upload media
- Users can delete their own content
- Ride organizers (OWNER/ADMIN of organizer) can delete any content

---

## SEO & Metadata (IMPLEMENTED)

Comprehensive SEO setup for Google indexing and social sharing.

### Dynamic Metadata
- **Rides**: Title, description, OG image from brand backdrop, canonical URL
- **Communities**: Title, description, type badge, OG image from logo/backdrop
- **Chapters**: Title with brand name, city location, member/ride counts
- **User Profiles**: Name, bio, location, ride count

### Static Files
- `public/robots.txt` - Crawl directives, sitemap location
- `src/app/sitemap.ts` - Dynamic sitemap with all public pages

### JSON-LD Structured Data
- Rides use `SportsEvent` schema with location, organizer, dates
- Proper Schema.org markup for search engine rich snippets

### Key Files
- `src/app/rides/[id]/page.tsx` - `generateMetadata` + JSON-LD for rides
- `src/app/communities/[slug]/page.tsx` - `generateMetadata` for communities
- `src/app/communities/[slug]/[chapter]/layout.tsx` - Metadata for chapters
- `src/app/u/[slug]/page.tsx` - `generateMetadata` for user profiles
- `src/app/discover/layout.tsx` - Static metadata for discover page
- `src/app/sitemap.ts` - Dynamic sitemap generator

### Testing SEO
```bash
# View page source to check server-rendered HTML
curl -s https://rideswith.com/rides/[id] | head -100

# Check sitemap
curl https://rideswith.com/sitemap.xml

# Check robots.txt
curl https://rideswith.com/robots.txt
```

---

## Planned Integrations

### AI-Assisted Ride Creation
Natural language / voice input to auto-fill ride details:
- User describes ride: "Saturday morning coffee ride, 45km, starting at Phoenix Park at 8am, moderate pace, mostly flat roads"
- AI extracts: title, distance, location, time, pace, terrain
- Could use Claude API or OpenAI for parsing
- Optional voice input via Web Speech API
- Environment variable: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`

### Push Notifications (IMPLEMENTED)
Push notifications when new rides are added to followed communities/chapters.

**Features:**
- Web Push notifications for new rides in followed chapters
- User notification settings (enable/disable per notification type)
- Auto-follow chapters when RSVPing to their rides (configurable)
- Service worker for receiving push notifications

**Database Models:**
```prisma
model Follow {
  id        String   @id @default(cuid())
  userId    String
  brandId   String?  // Following a community
  chapterId String?  // Following a chapter
  createdAt DateTime @default(now())
  // ... relations
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String   // Public key
  auth      String   // Auth secret
  // ... relations
}

model UserNotificationSettings {
  id                        String  @id @default(cuid())
  userId                    String  @unique
  pushEnabled               Boolean @default(true)  // Master switch
  newRideNotifications      Boolean @default(true)  // New rides in followed chapters
  rideUpdateNotifications   Boolean @default(true)  // Updates to RSVPed rides
  rideReminderNotifications Boolean @default(true)  // Reminders before rides
  commentNotifications      Boolean @default(true)  // Replies to comments
  autoFollowOnRsvp          Boolean @default(true)  // Auto-follow on RSVP
}
```

**Key Files:**
- `src/lib/push-notifications.ts` - Send notification helper
- `public/sw.js` - Service Worker for receiving push
- `src/components/notifications/push-permission.tsx` - Request permission banner/button
- `src/app/settings/notifications/page.tsx` - Notification preferences UI
- `src/app/api/notifications/settings/route.ts` - Notification settings API
- `src/app/api/push/subscribe/route.ts` - Push subscription API
- `src/app/api/follows/route.ts` - Follow/unfollow API

**API Endpoints:**
- `GET/PUT /api/notifications/settings` - User notification preferences
- `POST/DELETE /api/push/subscribe` - Manage push subscriptions
- `GET/POST/DELETE /api/follows` - Follow/unfollow communities/chapters

**Environment Variables (needed for push to work):**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Web Push VAPID public key
- `VAPID_PRIVATE_KEY` - Web Push VAPID private key
- `VAPID_EMAIL` - Contact email for push service (optional)

**Generate VAPID keys:** Run `node -e "console.log(require('web-push').generateVAPIDKeys())"`

### Strava Club Events Sync (IMPLEMENTED)

Chapter owners can connect their Strava club to automatically sync events to RidesWith.

**Features:**
- OAuth 2.0 authentication with Strava
- Club selection from user's Strava memberships
- Manual sync trigger to import events
- Duplicate detection (prevents reimporting same events)
- Event updates (detects changes and updates rides)

**Database Models:**
```prisma
model StravaConnection {
  id             String   @id @default(cuid())
  userId         String
  chapterId      String   @unique
  accessToken    String   @db.Text
  refreshToken   String   @db.Text
  expiresAt      DateTime
  stravaClubId   String
  stravaClubName String?
  autoSync       Boolean  @default(false)
  lastSyncAt     DateTime?
  lastSyncError  String?
  // ... relations to User and Chapter
}

model StravaSyncedEvent {
  id              String   @id @default(cuid())
  chapterId       String
  rideId          String   @unique
  stravaEventId   String
  stravaEventHash String?  // Hash to detect changes
  syncedAt        DateTime @default(now())
  // ... relations to Chapter and Ride
  @@unique([chapterId, stravaEventId])
}
```

**API Endpoints:**
- `GET /api/strava/authorize?chapterId=xxx` - Start OAuth flow
- `GET /api/strava/callback` - OAuth callback, stores tokens
- `DELETE /api/strava/disconnect?chapterId=xxx` - Remove connection
- `GET/POST /api/strava/clubs?chapterId=xxx` - List/select clubs
- `GET/POST/PUT /api/strava/sync/[chapterId]` - Get status, trigger sync, update settings

**Key Files:**
- `src/lib/strava.ts` - OAuth functions, API client wrapper
- `src/lib/strava-sync.ts` - Sync logic (fetch, map, create rides)
- `src/components/strava/strava-sync-settings.tsx` - Chapter settings UI
- `src/app/api/strava/*` - API routes

**UI Location:**
- Chapter settings page: `/communities/[slug]/[chapter]/edit`
- "Strava Integration" section with connect/sync controls

**Event Mapping:**
| Strava Field | RidesWith Field |
|--------------|-----------------|
| title | title |
| description | description |
| address | locationName |
| start_latlng[0] | latitude |
| start_latlng[1] | longitude |
| upcoming_occurrences[0] | date |
| skill_level (1-4) | paceMin/paceMax |

**Environment Variables:**
- `STRAVA_CLIENT_ID` - From Strava API settings
- `STRAVA_CLIENT_SECRET` - From Strava API settings
- `STRAVA_REDIRECT_URI` - Optional, defaults to `{AUTH_URL}/api/strava/callback`

**Setup:**
1. Register app at https://www.strava.com/settings/api
2. Set Authorization Callback Domain to your domain (e.g., rideswith.com)
3. Add environment variables to Railway/deployment
4. Chapter admins can connect via chapter settings page

### Telegram Bot (IMPLEMENTED)

Telegram bot for natural language ride discovery at [@rideswith_bot](https://t.me/rideswith_bot).

**Architecture:**
- Separate Node.js service in `telegram-bot/` directory
- Uses Grammy framework (TypeScript Telegram bot library)
- Groq API (Llama 3.3 70B) for natural language query parsing
- Shares PostgreSQL database with main app via Prisma
- Deployed as separate Railway service with webhooks

**Features:**
- Natural language ride search ("gravel rides this weekend", "rides near Berlin")
- Location-aware searches (share location or search by city)
- Geocoding via OpenStreetMap Nominatim (free, no API key)
- Smart alternatives when no exact matches found
- Inline links to each ride in results

**Bot Commands:**
- `/start` - Welcome message and location request
- `/rides [query]` - Search for rides
- `/nearby` - Rides near saved location
- `/settings` - Update preferences
- `/help` - Usage guide

**Key Files:**
```
telegram-bot/
├── src/
│   ├── index.ts              # Entry point (webhook server)
│   ├── config.ts             # Environment config
│   ├── bot/
│   │   ├── bot.ts            # Grammy bot setup
│   │   └── handlers/         # Command handlers
│   │       ├── start.ts
│   │       ├── help.ts
│   │       ├── rides.ts      # Main search handler
│   │       ├── nearby.ts
│   │       ├── settings.ts
│   │       └── message.ts    # Natural language fallback
│   ├── services/
│   │   ├── rideswith-api.ts  # HTTP client for /api/rides
│   │   ├── query-parser.ts   # Groq NLP parsing
│   │   └── geocoding.ts      # Nominatim geocoding
│   ├── db/
│   │   └── prisma.ts
│   └── utils/
│       └── format.ts         # Telegram message formatting
├── prisma/
│   └── schema.prisma         # Local copy for standalone deploy
├── package.json
├── tsconfig.json
└── nixpacks.toml             # Railway build config
```

**Database Model:**
```prisma
model TelegramUser {
  id               String   @id @default(cuid())
  telegramId       BigInt   @unique
  username         String?
  firstName        String?
  defaultLatitude  Float?
  defaultLongitude Float?
  defaultCity      String?
  defaultRadius    Int      @default(50)
  unitPreference   String   @default("km")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**Environment Variables (telegram-bot service):**
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `GROQ_API_KEY` - Groq API key for NLP
- `DATABASE_URL` - Shared PostgreSQL connection
- `WEBHOOK_URL` - Public Railway URL for webhooks
- `NODE_ENV` - "production" for webhook mode

**Development:**
```bash
cd telegram-bot
npm install
npm run dev    # Long-polling mode (no webhook needed)
```

**Website Integration:**
- `/telegram` page with bot instructions and usage examples
- "Telegram Bot" link in main navigation
- Callout on Discover page

**Future: Analytics (Planned)**
- `TelegramBotEvent` model for tracking searches, commands, results
- Admin page at `/admin/telegram` for usage stats
- See plan file: `.claude/plans/ethereal-sleeping-trinket.md`

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
| `/settings/notifications` | `src/app/settings/notifications/page.tsx` | Push notification preferences |
| `/settings/snippets` | `src/app/settings/snippets/page.tsx` | Ride description snippets |
| `/profile` | `src/app/profile/page.tsx` | User profile with ride history |
| `/profile/edit` | `src/app/profile/edit/page.tsx` | Edit profile with custom URL |
| `/u/[slug]` | `src/app/u/[slug]/page.tsx` | Public profile by custom URL |
| `/auth/signin` | `src/app/auth/signin/page.tsx` | Working |
| `/auth/verify` | `src/app/auth/verify/page.tsx` | Working |
| `/auth/error` | `src/app/auth/error/page.tsx` | Working |
| `/rides/[id]` | `src/app/rides/[id]/page.tsx` | Working (fetches from DB) |
| `/rides/[id]/edit` | `src/app/rides/[id]/edit/page.tsx` | Edit/delete rides |
| `/communities` | `src/app/communities/page.tsx` | Communities listing (brands, clubs, groups) |
| `/communities/create` | `src/app/communities/create/page.tsx` | Register new community |
| `/communities/[slug]` | `src/app/communities/[slug]/page.tsx` | Community profile with chapters |
| `/communities/[slug]/[chapter]` | `src/app/communities/[slug]/[chapter]/page.tsx` | Chapter page with rides |
| `/communities/[slug]/create-chapter` | `src/app/communities/[slug]/create-chapter/page.tsx` | Start a chapter |
| `/admin/communities` | `src/app/admin/communities/page.tsx` | Platform admin panel (admin only) |

### All Pages Working
All footer links now have pages:
- `/about` - About page with mission and how it works
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/how-it-works` - Removed from footer (covered in About page)

### Pages Needing Work
| Page | Current State | What's Needed |
|------|---------------|---------------|
| `/create` | ✅ DONE | Full form with location search, wired to API |
| `/profile` | ✅ DONE | User profile with ride history and stats |
| `/profile/edit` | ✅ DONE | Edit profile including custom URL slug |
| `/u/[slug]` | ✅ DONE | Public profile pages |
| `/rides/[id]/edit` | ✅ DONE | Edit and delete rides |
| `/discover/past` | ✅ DONE | Past rides archive with filters |
| `/rides/[id]` | ✅ DONE | Fetches from database |

---

## Immediate TODO (Fix Basics First)

### 1. Fix Critical 404s
- [x] Create `/profile` page (user profile)
- [x] Create `/privacy` page (privacy policy)
- [x] Create `/terms` page (terms of service)
- [x] Create `/about` page (about, mission, how it works)

### 2. Complete Placeholder Pages
- [x] `/create` - Full form with location search, API endpoint
- [x] `/profile` - User profile with ride history and stats
- [x] `/profile/edit` - Edit profile with custom slug
- [x] `/u/[slug]` - Public profile pages
- [x] `/rides/[id]/edit` - Edit and delete rides
- [x] `/discover/past` - Past rides archive

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
- [x] Editorial design system (January 2026) - minimalist two-column layouts, thin borders, uppercase typography

### Phase 3: Fix Basics (COMPLETE)
- [x] Create profile pages (/profile, /profile/edit, /u/[slug])
- [x] Create missing pages (about, privacy, terms)
- [x] Enable create ride form
- [x] Wire pages to database (discover, rides)
- [x] Wire homepage to database (latest rides from /api/rides/latest)

### Phase 4: Backend APIs
- [x] GET/POST /api/rides - List and create rides
- [x] GET/PUT/DELETE /api/rides/[id] - Individual ride operations
- [x] GET /api/rides/past - Past rides for archive
- [x] GET /api/rides/latest - Latest 3 rides for homepage
- [x] GET/PUT /api/profile - User profile management
- [x] GET /api/profile/check-slug - Slug availability check
- [x] POST /api/rides/[id]/rsvp - RSVP to rides (going/maybe/not going)

### Phase 5: Ride Management
- [x] Create ride form (full implementation)
- [x] Edit/delete rides
- [x] RSVP functionality (going/maybe/not going)
- [x] Attendee list on ride detail page

### Phase 6: Enhanced Features
- [ ] GPX route upload + map visualization
- [x] Photo/video upload for rides (Cloudinary integration)
- [x] Recurring rides
- [ ] Ride series/events
- [ ] Email notifications (ride reminders, updates)

### Phase 7: Discovery & Social
- [ ] Advanced search (location, date, pace)
- [ ] Follow users/communities
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
- Filter UI on discover page (with working distance, pace, and date range filters)
- Discover page fetches from database
- User profile pages with ride history and stats
- Public profile URLs (/u/username)
- Edit/delete rides for organizers
- Past rides archive

**Recently Wired to DB:**
- Homepage "Latest rides" section (fetches from /api/rides/latest)

**All Footer Links Working:**
- /about, /privacy, /terms pages created

**Recently Completed:**
- Web Push notifications - get notified when new rides are added to followed communities
- Follow system - auto-follow chapters on RSVP, notification settings page
- Notification preferences UI - control push notifications and auto-follow behavior
- Ride description snippets - save and reuse text blocks (etiquette, safety, what to bring)
- Recurring ride bulk delete - delete this ride, this and following, or entire series
- Chapter-level sponsor toggles in admin panel (expandable community rows)
- Share button changed to always copy to clipboard with tooltip
- Date/time pickers auto-close after selection
- Dark mode fixes for outline buttons and picker icons
- Platform admin feature - control sponsors as paid add-on per community
- Admin panel at /admin/communities for platform admin only
- Automatic platform admin setup via seed script on deployment
- Date range filter on Discover page (Next 7 days, 2 weeks, month, 3 months)
- Mobile sponsors section on ride detail page (shows sponsors below main content on mobile)
- Improved video lightbox close button for mobile (prominent header bar with Close button)
- Discussion moved to main content area (visible for all rides, not just branded)
- Chapter team management UI - add/remove members, change roles via chapter settings
- Hide "Presented by" option at community and chapter levels (hidePresentedBy setting)
- Sponsor card logo visibility fix for dark mode (bg-muted instead of bg-white)
- Team community type - 4th option (Brand/Club/Team/Group) with Trophy icon and orange badge
- Discussion section on ride detail pages - users can ask questions, post links, reply to comments
- Threaded comment replies - comments now support nested replies with inline reply forms
- Custom speed range - organizers specify min/max speed (km/h) instead of pace categories
- Profile image upload - users can upload their own profile photo via Cloudinary
- Social icons improved - removed external link arrows, increased icon size 25%
- "Hosted by" on ride detail now links to user profile instead of organizer
- RSVP system with going/maybe/not going functionality
- Attendee list on ride detail page with profile links
- User social links (Instagram, Strava) on profile pages
- Community admin roles (Owner, Admin, Moderator) with backward compatibility
- Brand social links (Instagram, Twitter, Facebook, Strava, YouTube) on brand pages
- Ride detail layout improvements (Ride Info in main content, conditional sidebar)
- Map app picker with clean SVG icons (replaced emoji icons with Lucide-style SVGs)
- "Cake & Coffee Stop" post-ride social features (comments + photo/video uploads)
- Cloudinary integration for photo/video uploads (unsigned upload preset)
- Video support with play icon overlays and lightbox player
- Past rides section on brand chapter pages (collapsible, loads on demand)
- Brand & Chapter system with hierarchical organization
- Brand.dev integration for auto-fetching brand assets (logo, logoDark, backdrop, slogan)
- Verified badge component for brand ambassadors
- Community pages (/communities, /communities/[slug], /communities/[slug]/[chapter])
- Brand/chapter creation flows
- Chapter-linked ride creation (/create?chapterId=xxx)
- Ride detail pages show brand backdrop/slogan for chapter rides
- Mobile menu improvements (auto-close, user account options)
- User profile system (/profile, /profile/edit, /u/[slug])
- Past rides archive (/discover/past) with time range and pace filters

**Next Priority:** Show verified badges on ride cards for chapter members.

---

## Active TODO List

### Completed Recently
- [x] Editorial design system - minimalist design with two-column layouts, thin borders, uppercase typography
- [x] Redesigned all major pages: homepage, discover, ride detail, communities, chapters, user profiles
- [x] Chapter-level sponsor toggles in admin panel (expandable community rows with chapter toggles)
- [x] Admin menu link in user dropdown for platform admin
- [x] Share button changed to clipboard copy with tooltip explanation
- [x] Date/time pickers auto-close after selection
- [x] Dark mode fixes - outline button hover, date/time picker icons visibility
- [x] Chapter-level sponsor toggle in chapter settings (inherit, enable, disable)
- [x] Platform admin feature - sponsors as paid add-on controlled by platform owner
- [x] Admin panel at /admin/communities for managing community sponsor access
- [x] Automatic platform admin setup via prisma/seed.ts on deployment
- [x] Date range filter on Discover page (Next 7 days, 2 weeks, month, 3 months)
- [x] Mobile sponsors section on ride detail page
- [x] Improved video lightbox close button for mobile
- [x] Recurring rides - create weekly/biweekly/monthly ride series
- [x] Add to Calendar - export rides to Google Calendar, Outlook, Apple Calendar
- [x] Discussion section moved from sidebar to main content (visible for all rides)
- [x] Chapter team management - add/remove members, change roles in chapter settings
- [x] Hide "Presented by" card option at community/chapter level
- [x] Sponsor card logo visibility fix for dark mode
- [x] Community Sponsors/Partners/Ads - chapters can manage sponsors with Small/Medium/Large display sizes
- [x] Chapter settings page - `/communities/[slug]/[chapter]/edit` for managing sponsors and settings
- [x] Sponsor display sizes - Small (logo+name), Medium (+description), Large (+backdrop image)
- [x] Team community type - 4th option (Brand/Club/Team/Group) with Trophy icon and orange badge
- [x] Discussion section on ride detail pages - questions, links, threaded replies
- [x] Threaded comment replies - nested replies with inline reply forms
- [x] Custom speed range - replaced pace categories (Casual/Moderate/Fast/Race) with min/max speed inputs (km/h)
- [x] URL rename: /brands → /communities with type badges (Brand/Club/Team/Group)
- [x] Profile image upload - users can upload their own profile photo
- [x] Social icons - removed external link arrows, made icons 25% bigger
- [x] "Hosted by" link now goes to user profile instead of organizer
- [x] RSVP system with going/maybe/not going functionality
- [x] Attendee list on ride detail page with profile links
- [x] User social links (Instagram, Strava) on profiles
- [x] Community admin roles (Owner, Admin, Moderator) with backward compatibility
- [x] Brand social links (Instagram, Twitter, Facebook, Strava, YouTube)
- [x] Ride detail layout - Ride Info in main content, sidebar with discussion
- [x] "Cake & Coffee Stop" - post-ride comments and photo/video uploads
- [x] Cloudinary integration for media uploads (unsigned preset)
- [x] Brand & Chapter system with hierarchical organization
- [x] User profile system (/profile, /profile/edit, /u/[slug])
- [x] Past rides archive (/discover/past) with filters

### High Priority (Next Up)
- [ ] Show verified badges on ride cards for chapter members

### Medium Priority
- [ ] GPX route upload + map visualization
- [ ] Email notifications (ride reminders, updates)

### Low Priority
- [ ] Advanced search (location radius)
- [ ] Social sharing

### Future Features
- [x] Push Notifications - IMPLEMENTED (see "Push Notifications" section above)
- [ ] Ride reminders - send push notification before rides user RSVPed to
- [ ] Follow/unfollow UI on chapter pages

---

## Discover Page Filters (IMPLEMENTED)

The Discover page supports multiple filters for finding rides:

**Location Filters:**
- Search by city/location using OpenStreetMap Nominatim
- Use current location via geolocation
- Radius filter: 10km, 25km, 50km, 100km, 200km

**Ride Filters:**
- **Pace**: Casual, Moderate, Fast, Race (multi-select)
- **Distance**: Short (<30km), Medium (30-60km), Long (60-100km), Epic (>100km) (multi-select)
- **Date Range**: All upcoming, Next 7 days, Next 2 weeks, Next month, Next 3 months

**UI:**
- Desktop: Dropdown menus and select components in filter bar
- Mobile: Filter sheet (bottom drawer) with button groups
- Active filter count badge on filter button
- "Clear filters" button when filters are active
- Location name displayed next to location button (desktop) and in filters row (mobile)

### Map Removed (January 2026)

The interactive map was removed from the Discover page to simplify the UI. The ride list now takes full width. Location-based filtering still works using the search radius.

**To restore the map**, add the following changes to `src/app/discover/page.tsx`:

1. Add the Map import:
```typescript
import { Map } from '@/components/maps';
```

2. Add mapMarkers computation after the `filteredRides` filter (around line 226):
```typescript
const mapMarkers = filteredRides.map((ride) => ({
  id: ride.id,
  position: { lat: ride.latitude, lng: ride.longitude },
  title: ride.title,
}));
```

3. Replace the Main Content section with a split layout:
```tsx
{/* Main Content */}
<div className="flex-1 flex flex-col lg:flex-row">
  {/* Map */}
  <div className="h-48 sm:h-64 lg:h-auto lg:flex-1 border-b lg:border-b-0 lg:border-r relative">
    <Map
      center={mapCenter}
      zoom={10}
      markers={mapMarkers}
      className="h-full w-full"
    />
  </div>

  {/* Ride List */}
  <div className="flex-1 lg:flex-none lg:w-96 xl:w-[420px] flex flex-col">
    {/* ... existing ride list content ... */}
  </div>
</div>
```

The Map component is in `src/components/maps/` and uses Leaflet + OpenStreetMap (no API key needed).
