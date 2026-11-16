import { Component, input, output } from '@angular/core';
import { WEEKDAY_LABELS } from '../../constants/calendar-constants';
import type { DayCell } from '../../models/calendar-models';

@Component({
  selector: 'app-calendar-grid',
  template: `
    <div class="grid grid-cols-7 text-center" aria-hidden="true">
      @for (name of weekdays; track name) {
        <span class="py-2 text-xs font-semibold uppercase tracking-wide text-muted">{{
          name
        }}</span>
      }
    </div>
    <div class="grid grid-cols-7" role="group" aria-label="Days of the month">
      @for (cell of days(); track $index) {
        @if (cell) {
          <button
            type="button"
            [class]="dayClass(cell)"
            [attr.data-status]="cell.status"
            [disabled]="cell.disabled"
            [attr.aria-label]="cell.label"
            [attr.aria-current]="cell.isToday ? 'date' : null"
            [attr.aria-pressed]="cell.isSelected"
            [style.--fill.deg]="cell.fraction * 360"
            (click)="pick.emit(cell.date)"
          >
            <span [class]="ringClass(cell)">
              <span class="relative z-1">{{ cell.day }}</span>
              @if (cell.isToday) {
                <span data-dot [class]="dotClass(cell)"></span>
              }
            </span>
          </button>
        } @else {
          <span aria-hidden="true"></span>
        }
      }
    </div>
  `,
  host: { class: 'block' },
})
export class CalendarGrid {
  readonly days = input.required<readonly (DayCell | null)[]>();

  readonly pick = output<string>();

  protected readonly weekdays = WEEKDAY_LABELS;

  protected dayClass(cell: DayCell): string {
    const base =
      'group grid min-h-12 w-full place-items-center bg-transparent px-0 py-px focus-visible:-outline-offset-2 focus-visible:rounded-[14px]';
    if (cell.status === 'none') return `${base} cursor-default text-muted`;
    return `${base} ${cell.status === 'full' ? 'text-white' : 'text-ink'}`;
  }

  protected ringClass(cell: DayCell): string {
    const base =
      "relative grid aspect-square w-[min(100%,54px)] place-items-center rounded-full text-[15px] tabular-nums before:absolute before:inset-[5px] before:rounded-full before:bg-surface before:content-['']";
    const ring: Record<DayCell['status'], string> = {
      none: 'font-medium before:hidden',
      empty: 'bg-track font-semibold',
      partial:
        'bg-[conic-gradient(from_0deg,var(--accent)_var(--fill),var(--track)_0)] font-semibold',
      full: 'bg-accent font-semibold before:hidden',
    };
    const selected = cell.isSelected
      ? ' shadow-[0_0_0_3px_var(--surface),0_0_0_5px_var(--text)]'
      : '';
    return `${base} ${ring[cell.status]}${selected} group-enabled:group-hover:brightness-[0.96]`;
  }

  protected dotClass(cell: DayCell): string {
    const color = cell.status === 'full' ? 'bg-white' : 'bg-accent';
    return `absolute bottom-[22%] left-1/2 z-1 -ml-0.5 size-1 rounded-full ${color}`;
  }
}
