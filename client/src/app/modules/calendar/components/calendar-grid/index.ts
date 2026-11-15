import { Component, input, output } from '@angular/core';
import { WEEKDAY_LABELS } from '../../constants/calendar-constants';
import type { DayCell } from '../../models/calendar-models';

/**
 * The month grid. Each day is a circle drawn with a conic-gradient ring that starts at the top and
 * runs clockwise. It only displays; tapping a day just reports which one.
 */
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
            class="day"
            [class.day--off]="cell.disabled"
            [class.day--empty]="cell.status === 'empty'"
            [class.day--partial]="cell.status === 'partial'"
            [class.day--full]="cell.status === 'full'"
            [class.day--today]="cell.isToday"
            [class.day--selected]="cell.isSelected"
            [disabled]="cell.disabled"
            [attr.aria-label]="cell.label"
            [attr.aria-current]="cell.isToday ? 'date' : null"
            [attr.aria-pressed]="cell.isSelected"
            [style.--fill.deg]="cell.fraction * 360"
            (click)="pick.emit(cell.date)"
          >
            <span class="day__ring">
              <span class="day__num">{{ cell.day }}</span>
              @if (cell.isToday) {
                <span class="day__dot"></span>
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
  styles: `
    .day {
      display: grid;
      place-items: center;
      width: 100%;
      min-height: 48px;
      padding: 1px 0;
      background: none;
      border: 0;
      color: var(--text);
    }
    .day__ring {
      position: relative;
      display: grid;
      place-items: center;
      width: min(100%, 54px);
      aspect-ratio: 1;
      border-radius: 50%;
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .day__ring::before {
      content: '';
      position: absolute;
      inset: 5px;
      border-radius: 50%;
      background: var(--surface);
    }
    .day__num {
      position: relative;
      z-index: 1;
    }
    .day__dot {
      position: absolute;
      z-index: 1;
      bottom: 22%;
      left: 50%;
      width: 4px;
      height: 4px;
      margin-left: -2px;
      border-radius: 50%;
      background: var(--accent);
    }
    /* Not scheduled, in the future, or before the first habit: just a muted number. */
    .day--off {
      color: var(--muted);
      cursor: default;
    }
    .day--off .day__ring::before {
      display: none;
    }
    .day--off .day__ring {
      font-weight: 500;
    }
    /* Scheduled, nothing done: light grey ring, white centre. */
    .day--empty .day__ring {
      background: var(--track);
    }
    /* Partly done: an accent arc for done / total, from the top, clockwise. */
    .day--partial .day__ring {
      background: conic-gradient(from 0deg, var(--accent) var(--fill), var(--track) 0);
    }
    /* All done: a solid accent circle with a white number. */
    .day--full {
      color: #fff;
    }
    .day--full .day__ring {
      background: var(--accent);
    }
    .day--full .day__ring::before {
      display: none;
    }
    .day--full .day__dot {
      background: #fff;
    }
    /* Selected: 2px dark ring with a 3px white gap. */
    .day--selected .day__ring {
      box-shadow:
        0 0 0 3px var(--surface),
        0 0 0 5px var(--text);
    }
    .day:not(:disabled):hover .day__ring {
      filter: brightness(0.96);
    }
    .day:focus-visible {
      outline-offset: -2px;
      border-radius: 14px;
    }
  `,
})
export class CalendarGrid {
  readonly days = input.required<readonly (DayCell | null)[]>();
  readonly pick = output<string>();
  protected readonly weekdays = WEEKDAY_LABELS;
}
