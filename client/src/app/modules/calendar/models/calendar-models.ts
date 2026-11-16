import type { Habit } from '@infrastructure/models/api-models';
import type { CheckInSet, RingStatus } from '@modules/habits';

export interface DayCell {
  date: string;
  day: number;
  status: RingStatus;
  fraction: number;
  done: number;
  total: number;
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
  filter: string | null;
  selected: string;
}
