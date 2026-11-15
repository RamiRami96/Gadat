import type { Habit } from '@infrastructure/models/api-models';
import type { CheckInSet, RingStatus } from '@modules/habits';

export interface DayCell {
  date: string;
  day: number;
  status: RingStatus;
  /** Share of the ring that is filled, 0 to 1. */
  fraction: number;
  done: number;
  total: number;
  /** Not scheduled, in the future, or before the first habit: a plain, disabled number. */
  disabled: boolean;
  isToday: boolean;
  isSelected: boolean;
  label: string;
}

export interface CalendarInput {
  habits: readonly Habit[];
  checks: CheckInSet;
  year: number;
  month: number;
  today: string;
  /** A single habit chosen in the chips, or null for all habits. */
  filter: string | null;
  selected: string;
}
