import { DestroyRef, inject, Injectable } from '@angular/core';
import { HabitStore } from '@modules/habits';
import { CLOCK_CHECK_MS } from '../constants/dashboard-constants';

@Injectable()
export class TodayClockService {
  private readonly store = inject(HabitStore);

  private readonly destroyRef = inject(DestroyRef);

  start(): void {
    const timer = setInterval(() => this.store.refreshToday(), CLOCK_CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') this.store.refreshToday();
    };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    });
  }
}
