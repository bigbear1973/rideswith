import { Context } from 'grammy';

export async function handleHelp(ctx: Context): Promise<void> {
  const helpMessage = `
🚴 <b>RidesWith Bot Help</b>

<b>Search for rides:</b>
Just type naturally what you're looking for:
• "rides near Berlin"
• "gravel rides this weekend"
• "fast group rides in Munich"
• "any rides tomorrow?"

<b>Commands:</b>
/start - Welcome message & setup
/rides [query] - Search for rides
/nearby - Rides near your saved location
/settings - View/update your preferences
/help - Show this message

<b>Tips:</b>
• Share your location once, and I'll remember it
• You can filter by pace: "casual", "moderate", "fast"
• You can filter by type: "road", "gravel", "mtb"
• You can filter by time: "today", "tomorrow", "this weekend", "next week"

<b>Examples:</b>
• "rides in the next 3 days"
• "Straede rides near Berlin"
• "easy group rides within 50km"

Need more help? Visit <a href="https://rideswith.com">rideswith.com</a>
`;

  await ctx.reply(helpMessage, {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
  });
}
