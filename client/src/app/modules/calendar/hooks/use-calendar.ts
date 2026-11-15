import { computed, inject } from '@angular/core';
import { dayProgress, HabitStore } from '@modules/habits';
import { formatLongDate, MONTH_NAMES } from '@shared/utils/dates';
import { buildCalendar } from '../utils/calendar-days';

/** The month on screen as signals: its title, its day cells and the selected-day summary. */
export function useCalendar() {
  const store = inject(HabitStore);

  const title = computed(() => {
    const { year, month } = store.viewMonth();
    return `${MONTH_NAMES[month - 1]} ${year}`;
  });

  const days = computed(() => {
    const { year, month } = store.viewMonth();
    return buildCalendar({
      habits: store.habits(),
      checks: store.checks(),
      year,
      month,
      today: store.today(),
      filter: store.filter(),
      selected: store.selectedDate(),
    });
  });

  const summary = computed(() => {
    const date = store.selectedDate();
    return {
      date,
      label: formatLongDate(date),
      ...dayProgress(store.habits(), store.checks(), date, store.filter()),
    };
  });

  return { title, days, summary };
}
