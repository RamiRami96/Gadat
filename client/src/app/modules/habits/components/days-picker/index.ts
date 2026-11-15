import { Component, computed, input, model } from '@angular/core';
import { WEEKDAY_OPTIONS } from '../../data/habit-data';

/** Seven round weekday toggles, Monday to Sunday. */
@Component({
  selector: 'app-days-picker',
  template: `
    <div class="flex items-center justify-between gap-2">
      <span id="repeat-label" class="text-sm font-semibold">Repeat on</span>
      <span class="text-sm" [class]="selected().length ? 'text-muted' : 'font-semibold text-error'">
        {{ summary() }}
      </span>
    </div>
    <div class="mt-2 flex justify-between gap-1" role="group" aria-labelledby="repeat-label">
      @for (day of days; track day.value) {
        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors sm:h-12 sm:w-12"
          [class]="
            selected().includes(day.value)
              ? 'border-accent bg-accent text-white'
              : 'border-control bg-surface text-ink hover:bg-page'
          "
          [attr.aria-pressed]="selected().includes(day.value)"
          [attr.aria-label]="day.full"
          (click)="toggle(day.value)"
        >
          {{ day.short }}
        </button>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class DaysPicker {
  readonly selected = model.required<number[]>();
  readonly id = input('days');
  protected readonly days = WEEKDAY_OPTIONS;

  protected readonly summary = computed(() => {
    const count = this.selected().length;
    if (count === 0) return 'Pick at least one day';
    if (count === 7) return 'Every day';
    return `${count} ${count === 1 ? 'day' : 'days'} a week`;
  });

  protected toggle(day: number): void {
    const current = this.selected();
    this.selected.set(
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }
}
