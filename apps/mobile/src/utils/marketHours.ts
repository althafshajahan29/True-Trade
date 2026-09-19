/** Approximate US equities regular-session hours (9:30–16:00 ET, Mon–Fri). Does not account for market holidays. */
export function isUsMarketOpenNow(date: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  if (map.weekday === 'Sat' || map.weekday === 'Sun') return false;

  const hour = parseInt(map.hour, 10) % 24;
  const minute = parseInt(map.minute, 10);
  const minutesSinceMidnight = hour * 60 + minute;
  return minutesSinceMidnight >= 9 * 60 + 30 && minutesSinceMidnight < 16 * 60;
}
