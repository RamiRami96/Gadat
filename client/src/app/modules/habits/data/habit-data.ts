import type { WeekdayOption } from '../models/habit-models';

/** One tap on these fills the name in the Add habit form. */
export const QUICK_PICKS: readonly string[] = [
  'Read 20 pages',
  'Drink water',
  'Stretch 10 min',
  'Meditate',
  'Journal',
];

/** Monday to Sunday, in ISO weekday order. */
export const WEEKDAY_OPTIONS: readonly WeekdayOption[] = [
  { value: 1, short: 'Mon', full: 'Monday' },
  { value: 2, short: 'Tue', full: 'Tuesday' },
  { value: 3, short: 'Wed', full: 'Wednesday' },
  { value: 4, short: 'Thu', full: 'Thursday' },
  { value: 5, short: 'Fri', full: 'Friday' },
  { value: 6, short: 'Sat', full: 'Saturday' },
  { value: 7, short: 'Sun', full: 'Sunday' },
];
