const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function toMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return formatDate(toMs(date) + days * DAY_MS);
}

export function diffDays(from: string, to: string): number {
  return Math.round((toMs(to) - toMs(from)) / DAY_MS);
}

export function latestAllowedDate(now: Date = new Date()): string {
  return addDays(formatDate(now.getTime()), 1);
}

export function isFutureDate(date: string, now: Date = new Date()): boolean {
  return date > latestAllowedDate(now);
}
