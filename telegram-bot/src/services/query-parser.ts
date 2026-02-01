import { config } from '../config.js';

export interface ParsedQuery {
  intent: 'search' | 'detail' | 'help' | 'unknown';
  location?: {
    name?: string;
    useUserLocation?: boolean;
  };
  radius?: number; // km
  dateRange?: {
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
    relative?: 'today' | 'tomorrow' | 'this_weekend' | 'next_week' | 'this_week';
  };
  pace?: {
    min?: number; // km/h
    max?: number; // km/h
  };
  distance?: {
    min?: number; // km
    max?: number; // km
  };
  community?: string; // slug
  chapter?: string; // name
  discipline?: 'road' | 'gravel' | 'mtb' | 'mixed';
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const SYSTEM_PROMPT = `You are a query parser for RidesWith.com, a cycling group ride discovery platform.

Parse user queries about cycling rides and return structured JSON. Be flexible with natural language.

IMPORTANT: Speed/pace is always in km/h. Distance is always in km.
- "fast" pace means 30+ km/h
- "moderate" pace means 22-28 km/h
- "casual/easy" pace means under 22 km/h
- "short" ride means under 30 km
- "medium" ride means 30-60 km
- "long" ride means 60-100 km
- "epic" ride means 100+ km

CRITICAL: Only include dateRange if the user EXPLICITLY mentions a time frame (today, tomorrow, this weekend, next week, etc).
- Do NOT add dateRange for queries like "rides near Berlin" - they want ALL upcoming rides
- Only add dateRange for queries like "rides this weekend" or "rides tomorrow"

Examples:
- "rides near Berlin" → location only, NO dateRange
- "fast rides this weekend" → location + pace + dateRange
- "any gravel rides?" → discipline only, NO dateRange
- "rides tomorrow" → dateRange only
- "Straede rides" → community filter only`;

/**
 * Parse a ride query using Groq's fast inference API
 */
export async function parseRideQuery(
  userMessage: string,
  today: string
): Promise<ParsedQuery> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Parse this cycling ride search query. Today is ${today}. Return ONLY valid JSON, no explanation.

Query: "${userMessage}"

Return JSON matching this schema (omit null/undefined fields):
{
  "intent": "search" | "detail" | "help" | "unknown",
  "location": { "name": "city", "useUserLocation": boolean },
  "radius": number (km),
  "dateRange": {
    "from": "YYYY-MM-DD",
    "to": "YYYY-MM-DD",
    "relative": "today" | "tomorrow" | "this_weekend" | "next_week" | "this_week"
  },
  "pace": { "min": number, "max": number },
  "distance": { "min": number, "max": number },
  "community": "slug",
  "chapter": "name",
  "discipline": "road" | "gravel" | "mtb" | "mixed"
}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      return { intent: 'unknown' };
    }

    const data = (await response.json()) as GroqResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { intent: 'unknown' };
    }

    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { intent: 'unknown' };
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedQuery;
    return parsed;
  } catch (error) {
    console.error('Groq parsing error:', error);
    return { intent: 'unknown' };
  }
}
