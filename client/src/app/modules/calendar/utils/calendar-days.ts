import type { CalendarInput, DayCell } from '../models/calendar-models';
import { formatDayMonth, monthGrid, parseIso } from '@shared/utils/dates';
import { dayProgress, earliestStart, ringFraction, ringStatus } from '@modules/habits';

function labelFor(date: string, done: number, total: number, disabled: boolean): string {
  const text = formatDayMonth(date);
  if (total === 0 || disabled) return `${text}, no habits to do`;
  return `${text}, ${done} of ${total} ${total === 1 ? 'habit' : 'habits'} done`;
}

/** The cells of one month, Monday first, with blanks (null) before the 1st and after the last day. */
export function buildCalendar(input: CalendarInput): (DayCell | null)[] {
  const first = earliestStart(input.habits, input.filter);
  return monthGrid(input.year, input.month).map((date) => {
    if (date === null) return null;
    const progress = dayProgress(input.habits, input.checks, date, input.filter);
    const status = ringStatus(progress);
    const disabled = status === 'none' || date > input.today || first === null || date < first;
    return {
      date,
      day: parseIso(date).day,
      status: disabled ? 'none' : status,
      fraction: disabled ? 0 : ringFraction(progress),
      done: progress.done,
      total: progress.total,
      disabled,
      isToday: date === input.today,
      isSelected: date === input.selected,
      label: labelFor(date, progress.done, progress.total, disabled),
    };
  });
}
