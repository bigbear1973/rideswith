import { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { prisma } from '../../db/prisma.js';
import { parseRideQuery, type ParsedQuery } from '../../services/query-parser.js';
import { geocodeLocation } from '../../services/geocoding.js';
import { searchRides, getRideUrl, type SearchParams } from '../../services/rideswith-api.js';
import { formatRideList, getDateRange } from '../../utils/format.js';

interface UserPrefs {
  defaultLatitude: number | null;
  defaultLongitude: number | null;
  defaultCity: string | null;
  defaultRadius: number;
}

export async function handleRides(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;
  const text = ctx.message?.text;

  if (!telegramId) {
    await ctx.reply('Sorry, I could not identify your Telegram account.');
    return;
  }

  // Extract query from /rides command or use direct message
  let query = '';
  if (text?.startsWith('/rides')) {
    query = text.replace(/^\/rides\s*/, '').trim();
  } else {
    query = text?.trim() || '';
  }

  if (!query) {
    await ctx.reply(
      '🔍 <b>Search for rides</b>\n\nTry something like:\n• "rides near Berlin"\n• "gravel rides this weekend"\n• "fast rides tomorrow"',
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Get user's saved preferences (gracefully handle DB errors)
  let user: UserPrefs | null = null;
  try {
    const dbUser = await prisma.telegramUser.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
    if (dbUser) {
      user = {
        defaultLatitude: dbUser.defaultLatitude,
        defaultLongitude: dbUser.defaultLongitude,
        defaultCity: dbUser.defaultCity,
        defaultRadius: dbUser.defaultRadius,
      };
    }
  } catch (error) {
    console.log('Database not available, continuing without user preferences');
  }

  // Show loading message
  const loadingMsg = await ctx.reply('🔍 Searching...');

  try {
    // Parse the natural language query with Groq
    const today = new Date().toISOString().split('T')[0];
    const parsed = await parseRideQuery(query, today);
    console.log('Parsed query:', JSON.stringify(parsed));

    // Build search params from parsed query
    const searchParams = buildSearchParams(parsed, user);
    console.log('Search params:', JSON.stringify(searchParams));

    // If we need to geocode a location
    let locationName: string | undefined;
    if (parsed.location?.name) {
      const geocoded = await geocodeLocation(parsed.location.name);
      console.log('Geocoded result:', JSON.stringify(geocoded));
      if (geocoded) {
        searchParams.lat = geocoded.latitude;
        searchParams.lng = geocoded.longitude;
        locationName = geocoded.city || parsed.location.name;
      } else {
        await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});
        await ctx.reply(
          `📍 I couldn't find "${parsed.location.name}". Try being more specific (e.g., "Berlin, Germany").`
        );
        return;
      }
    } else if (parsed.location?.useUserLocation && user?.defaultLatitude && user?.defaultLongitude) {
      searchParams.lat = user.defaultLatitude;
      searchParams.lng = user.defaultLongitude;
      locationName = user.defaultCity || undefined;
    }

    // Set default radius if we have location
    if (searchParams.lat !== undefined && !searchParams.radius) {
      searchParams.radius = parsed.radius || user?.defaultRadius || 50;
    }

    // Search for rides
    console.log('Final search params:', JSON.stringify(searchParams));
    const rides = await searchRides(searchParams);
    console.log('Rides found:', rides.length);

    // Delete loading message
    await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});

    // Format and send results
    const message = formatRideList(
      rides,
      locationName,
      searchParams.lat,
      searchParams.lng
    );

    // Build inline keyboard with View buttons
    const keyboard = new InlineKeyboard();
    rides.slice(0, 5).forEach((ride, index) => {
      if (index > 0) keyboard.row();
      const title = ride.title.length > 25 ? ride.title.substring(0, 22) + '...' : ride.title;
      keyboard.url(`View: ${title}`, getRideUrl(ride.id));
    });

    if (rides.length > 0) {
      keyboard.row().url('🌐 Browse all rides', 'https://rideswith.com/discover');
    } else {
      keyboard.url('🌐 Browse rides on RidesWith', 'https://rideswith.com/discover');
    }

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.error('Rides search error:', error);
    await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});
    await ctx.reply(
      'Sorry, something went wrong while searching. Please try again.\n\nYou can also browse rides at rideswith.com/discover'
    );
  }
}

function buildSearchParams(
  parsed: ParsedQuery,
  user: UserPrefs | null
): SearchParams {
  const params: SearchParams = {
    limit: 5,
  };

  // Handle date range
  if (parsed.dateRange) {
    if (parsed.dateRange.relative) {
      const range = getDateRange(parsed.dateRange.relative);
      params.dateFrom = range.from;
      params.dateTo = range.to;
    } else {
      if (parsed.dateRange.from) params.dateFrom = parsed.dateRange.from;
      if (parsed.dateRange.to) params.dateTo = parsed.dateRange.to;
    }
  }

  // Handle pace
  if (parsed.pace) {
    if (parsed.pace.min) params.paceMin = parsed.pace.min;
    if (parsed.pace.max) params.paceMax = parsed.pace.max;
  }

  // Handle community filter
  if (parsed.community) {
    params.brandSlug = parsed.community;
  }

  // Handle radius
  if (parsed.radius) {
    params.radius = parsed.radius;
  }

  return params;
}
