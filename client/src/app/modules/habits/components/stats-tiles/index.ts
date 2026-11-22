import { Component, inject } from '@angular/core';
import { Icon } from '@shared/components/icon';
import { LOAD_STATUS } from '../../constants/habit-constants';
import { HabitStore } from '../../stores/habit-store';

@Component({
  selector: 'app-stats-tiles',
  imports: [Icon],
  template: `
    <div class="grid grid-cols-3 gap-3">
      <div class="rounded-[20px] border border-line bg-surface p-3.5 sm:p-4">
        <p
          class="flex items-center gap-1.5 font-display text-[26px] font-semibold leading-none sm:text-[30px]"
        >
          <app-icon name="flame" [size]="24" class="text-accent" />
          {{ ready() ? store.currentStreak() : '–' }}
        </p>
        <p class="mt-2 text-[13px] text-muted">Current streak</p>
      </div>
      <div class="rounded-[20px] border border-line bg-surface p-3.5 sm:p-4">
        <p class="font-display text-[26px] font-semibold leading-none sm:text-[30px]">
          {{ ready() ? store.bestStreak() : '–' }}
          <span class="text-[15px] font-medium text-muted">days</span>
        </p>
        <p class="mt-2 text-[13px] text-muted">Best streak</p>
      </div>
      <div class="rounded-[20px] border border-line bg-surface p-3.5 sm:p-4">
        <p class="font-display text-[26px] font-semibold leading-none sm:text-[30px]">
          {{ ready() ? store.monthRate() + '%' : '–' }}
        </p>
        <p class="mt-2 text-[13px] text-muted">{{ store.monthRateLabel() }}</p>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class StatsTiles {
  protected readonly store = inject(HabitStore);

  protected readonly ready = () => this.store.status() === LOAD_STATUS.Ready;
}
