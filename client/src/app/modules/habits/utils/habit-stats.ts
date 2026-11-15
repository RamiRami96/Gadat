import type { Habit } from '@infrastructure/models/api-models';
import { addDays, daysInMonth, isoWeekday, toIso } from '@shared/utils/dates';

/** Everything here is pure: streaks, rates and rings are computed, never stored. */

/** A set of "habitId|date" keys, one per tick. */
export type CheckInSet = ReadonlySet<string>;

export function checkKey(habitId: string, date: string): string {
  return `${habitId}|${date}`;
}

export interface DayProgress {
  done: number;
  total: number;
}

export type RingStatus = 'none' | 'empty' | 'partial' | 'full';

/** A habit is scheduled when it has started, has not ended, and repeats on that weekday. */
export function isScheduled(habit: Habit, date: string): boolean {
  return (
    habit.startDate <= date &&
    (habit.endDate === null || habit.endDate >= date) &&
    habit.days.includes(isoWeekday(date))
  );
}

/** Habits scheduled on `date`, optionally narrowed to a single habit (the calendar chip filter). */
export function scheduledOn(
  habits: readonly Habit[],
  date: string,
  habitId: string | null = null,
): Habit[] {
  return habits.filter((h) => (habitId === null || h.id === habitId) && isScheduled(h, date));
}

export function dayProgress(
  habits: readonly Habit[],
  checks: CheckInSet,
  date: string,
  habitId: string | null = null,
): DayProgress {
  const scheduled = scheduledOn(habits, date, habitId);
  const done = scheduled.filter((h) => checks.has(checkKey(h.id, date))).length;
  return { done, total: scheduled.length };
}

/** How much of the ring is filled, clockwise from the top: done / total. */
export function ringFraction({ done, total }: DayProgress): number {
  return total === 0 ? 0 : Math.min(1, done / total);
}

export function ringStatus(progress: DayProgress): RingStatus {
  if (progress.total === 0) return 'none';
  if (progress.done === 0) return 'empty';
  return progress.done >= progress.total ? 'full' : 'partial';
}

/** The earliest start date among the habits, or null when there are none. */
export function earliestStart(
  habits: readonly Habit[],
  habitId: string | null = null,
): string | null {
  const dates = habits.filter((h) => habitId === null || h.id === habitId).map((h) => h.startDate);
  return dates.length === 0 ? null : dates.reduce((a, b) => (a < b ? a : b));
}

type Outcome = 'skip' | 'hit' | 'miss';

/**
 * One day of history. With all habits it is a hit when at least one scheduled habit is ticked;
 * with one habit it is a hit when that habit is ticked. Nothing scheduled means the day is skipped.
 */
function outcome(
  habits: readonly Habit[],
  checks: CheckInSet,
  date: string,
  habitId: string | null,
): Outcome {
  const { done, total } = dayProgress(habits, checks, date, habitId);
  if (total === 0) return 'skip';
  return done > 0 ? 'hit' : 'miss';
}

/**
 * The streak that ends today, or yesterday while today is still open (scheduled but not ticked yet),
 * so it does not fall to zero before the day is over. Unscheduled days neither count nor break it.
 */
export function currentStreak(
  habits: readonly Habit[],
  checks: CheckInSet,
  today: string,
  habitId: string | null = null,
): number {
  const first = earliestStart(habits, habitId);
  if (first === null) return 0;
  let streak = 0;
  for (let date = today; date >= first; date = addDays(date, -1)) {
    const result = outcome(habits, checks, date, habitId);
    if (result === 'hit') streak++;
    else if (result === 'miss' && date !== today) break;
  }
  return streak;
}

/** The longest run of hit days in the whole history. */
export function bestStreak(
  habits: readonly Habit[],
  checks: CheckInSet,
  today: string,
  habitId: string | null = null,
): number {
  const first = earliestStart(habits, habitId);
  if (first === null) return 0;
  let best = 0;
  let run = 0;
  for (let date = first; date <= today; date = addDays(date, 1)) {
    const result = outcome(habits, checks, date, habitId);
    if (result === 'hit') {
      run++;
      best = Math.max(best, run);
    } else if (result === 'miss') {
      run = 0;
    }
  }
  return best;
}

/**
 * Whole percent of scheduled habit-days that were ticked, from the 1st up to and including today
 * (the whole month for past months). 0 when nothing was scheduled.
 */
export function monthRate(
  habits: readonly Habit[],
  checks: CheckInSet,
  year: number,
  month: number,
  today: string,
  habitId: string | null = null,
): number {
  const first = toIso(year, month, 1);
  const last = toIso(year, month, daysInMonth(year, month));
  const end = today < last ? today : last;
  let scheduled = 0;
  let done = 0;
  for (let date = first; date <= end; date = addDays(date, 1)) {
    const progress = dayProgress(habits, checks, date, habitId);
    scheduled += progress.total;
    done += progress.done;
  }
  return scheduled === 0 ? 0 : Math.round((done / scheduled) * 100);
}
