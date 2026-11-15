import { DestroyRef, inject } from '@angular/core';
import { HabitStore } from '@modules/habits';
import { CLOCK_CHECK_MS } from '../constants/dashboard-constants';

/**
 * Keeps "today" correct while the app stays open for days: it re-checks the date on a timer and
 * whenever the tab becomes visible again. Call it from a component constructor or field.
 */
export function useTodayClock(): void {
  const store = inject(HabitStore);
  const destroyRef = inject(DestroyRef);

  const timer = setInterval(() => store.refreshToday(), CLOCK_CHECK_MS);
  const onVisible = () => {
    if (document.visibilityState === 'visible') store.refreshToday();
  };
  document.addEventListener('visibilitychange', onVisible);
  destroyRef.onDestroy(() => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisible);
  });
}
