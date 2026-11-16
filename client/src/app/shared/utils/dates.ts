export const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const DAY_MS = 86_400_000;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

export function toIso(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function parseIso(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return { year, month, day };
}

function utcMs(date: string): number {
  const { year, month, day } = parseIso(date);
  return Date.UTC(year, month - 1, day);
}

export function todayIso(now: Date = new Date()): string {
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addDays(date: string, days: number): string {
  const d = new Date(utcMs(date) + days * DAY_MS);
  return toIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function diffDays(from: string, to: string): number {
  return Math.round((utcMs(to) - utcMs(from)) / DAY_MS);
}

export function isoWeekday(date: string): number {
  const day = new Date(utcMs(date)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function monthOf(date: string): { year: number; month: number } {
  const { year, month } = parseIso(date);
  return { year, month };
}

export function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = monthIndex(year, month) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function monthGrid(year: number, month: number): (string | null)[] {
  const lead = isoWeekday(toIso(year, month, 1)) - 1;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth(year, month); day += 1) cells.push(toIso(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function formatLongDate(date: string): string {
  const { month, day } = parseIso(date);
  return `${WEEKDAY_NAMES[isoWeekday(date) - 1]}, ${day} ${MONTH_NAMES[month - 1]}`;
}

export function formatDayMonth(date: string): string {
  const { month, day } = parseIso(date);
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

export function monthShortName(month: number): string {
  return MONTH_NAMES[month - 1].slice(0, 3);
}
