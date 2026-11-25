// Local wall-clock times → ISO strings with the zone's offset, so a day
// built in the browser satisfies the engine's "times with an offset" rule.

function offsetMinutes(utcMs: number, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second')
  );
  return Math.round((asUtc - utcMs) / 60_000);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-11-25", 9.5 (9:30), "America/New_York" → "2026-11-25T09:30:00-05:00". */
export function localIso(date: string, hour: number, timezone: string): string {
  const [y, mo, d] = date.split('-').map(Number);
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const guess = Date.UTC(y, mo - 1, d, h, m);
  const off = offsetMinutes(guess - offsetMinutes(guess, timezone) * 60_000, timezone);
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return `${date}T${pad(h)}:${pad(m)}:00${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

/** The browser's zone and today's local date in it. */
export function browserDay(now = new Date()): { date: string; timezone: string } {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return { date: now.toLocaleDateString('sv-SE', { timeZone: timezone }), timezone };
}

/** The next n local dates starting at `date`. */
export function nextDates(date: string, n: number): string[] {
  const start = Date.parse(`${date}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) =>
    new Date(start + i * 86_400_000).toISOString().slice(0, 10)
  );
}
