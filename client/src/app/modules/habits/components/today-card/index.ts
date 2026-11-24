import { Component, computed, inject, output } from '@angular/core';
import { formatLongDate } from '@shared/utils/dates';
import { Button } from '@shared/components/button';
import { Icon } from '@shared/components/icon';
import { ProgressBar } from '@shared/components/progress-bar';
import { LOAD_STATUS } from '../../constants/habit-constants';
import { HabitStore } from '../../stores/habit-store';
import { HabitRow } from '../habit-row';

@Component({
  selector: 'app-today-card',
  imports: [HabitRow, Button, Icon, ProgressBar],
  template: `
    <section
      class="rounded-[24px] border border-line bg-surface p-5 sm:p-6"
      aria-labelledby="today-title"
    >
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="text-sm text-muted">{{ dateLabel() }}</p>
          <h2 id="today-title" class="text-4xl leading-none">Today</h2>
        </div>
        @if (store.status() === Status.Ready && progress().total > 0) {
          <p class="pb-1 text-[15px] font-semibold text-muted">
            {{ progress().done }} of {{ progress().total }} done
          </p>
        }
      </div>

      @if (store.status() === Status.Ready && progress().total > 0) {
        <app-progress-bar
          class="mt-4"
          [value]="progress().done"
          [max]="progress().total"
          label="Habits done today"
        />
      }

      <div class="mt-5 space-y-3">
        @switch (store.status()) {
          @case (Status.Ready) {
            @if (store.habits().length === 0) {
              <div
                animate.enter="anim-fade-up"
                class="rounded-[16px] border border-dashed border-control px-4 py-8 text-center"
              >
                <h3 class="text-xl">No habits yet</h3>
                <p class="mx-auto mt-1 max-w-xs text-sm text-muted">
                  Add the first thing you want to do regularly. You can pick the days it repeats on.
                </p>
              </div>
            } @else if (store.todayHabits().length === 0) {
              <p
                animate.enter="anim-fade-up"
                class="rounded-[16px] bg-page px-4 py-6 text-center text-sm text-muted"
              >
                Nothing is scheduled for today.
              </p>
            }
            @for (habit of store.todayHabits(); track habit.id) {
              <app-habit-row
                animate.enter="anim-fade-up"
                animate.leave="anim-fade-out"
                [name]="habit.name"
                [note]="habit.note"
                [checked]="store.isChecked(habit.id, store.today())"
                [streak]="store.streakFor(habit.id)"
                (toggled)="store.toggleToday(habit.id)"
              />
            }
            <button
              appButton
              variant="secondary"
              type="button"
              class="w-full !border-dashed !border-control"
              (click)="onAdd($event)"
            >
              <app-icon name="plus" [size]="20" />
              Add habit
            </button>
          }
          @case (Status.Error) {
            <div
              role="alert"
              animate.enter="anim-fade-up"
              class="rounded-[16px] bg-error-bg px-4 py-5 text-center text-error"
            >
              <p class="font-semibold">Couldn’t load your habits.</p>
              <button
                appButton
                variant="secondary"
                type="button"
                class="mt-3"
                (click)="retry.emit()"
              >
                Try again
              </button>
            </div>
          }
          @default {
            @for (n of skeletonRows; track n) {
              <div class="skeleton h-[68px] rounded-[16px]" aria-hidden="true"></div>
            }
            <span class="sr-only" role="status">Loading your habits</span>
          }
        }
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export class TodayCard {
  protected readonly store = inject(HabitStore);

  readonly add = output<HTMLElement>();

  readonly retry = output();

  protected readonly Status = LOAD_STATUS;

  protected readonly skeletonRows = [1, 2, 3];

  protected readonly dateLabel = computed(() => formatLongDate(this.store.today()));

  protected readonly progress = this.store.todayProgress;

  protected onAdd(event: Event): void {
    this.add.emit(event.currentTarget as HTMLElement);
  }
}
