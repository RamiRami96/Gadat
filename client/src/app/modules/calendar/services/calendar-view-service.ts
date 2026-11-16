import { computed, inject, Injectable } from '@angular/core';
import { dayProgress, HabitStore } from '@modules/habits';
import { formatLongDate, MONTH_NAMES } from '@shared/utils/dates';
import { buildCalendar } from '../utils/calendar-days';

@Injectable()
export class CalendarViewService {
  private readonly store = inject(HabitStore);

  readonly title = computed(() => {
    const { year, month } = this.store.viewMonth();
    return `${MONTH_NAMES[month - 1]} ${year}`;
  });

  readonly days = computed(() => {
    const { year, month } = this.store.viewMonth();
    return buildCalendar({
      habits: this.store.habits(),
      checks: this.store.checks(),
      year,
      month,
      today: this.store.today(),
      filter: this.store.filter(),
      selected: this.store.selectedDate(),
    });
  });

  readonly summary = computed(() => {
    const date = this.store.selectedDate();
    return {
      date,
      label: formatLongDate(date),
      ...dayProgress(this.store.habits(), this.store.checks(), date, this.store.filter()),
    };
  });
}
