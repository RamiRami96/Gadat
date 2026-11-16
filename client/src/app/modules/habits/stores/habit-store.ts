import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@shared/services/toast-service';
import { CHECK_IN_WINDOW_DAYS, SAVE_ERROR } from '../constants/habit-constants';
import type { LoadStatus } from '../models/habit-models';
import { HabitRepository } from '../services/habit-repository';
import type { Habit, NewHabit } from '@infrastructure/models/api-models';
import {
  addDays,
  diffDays,
  monthIndex,
  monthOf,
  monthShortName,
  todayIso,
} from '@shared/utils/dates';
import {
  bestStreak,
  checkKey,
  CheckInSet,
  currentStreak,
  dayProgress,
  earliestStart,
  monthRate,
  scheduledOn,
} from '../utils/habit-stats';

@Injectable({ providedIn: 'root' })
export class HabitStore {
  private readonly repo = inject(HabitRepository);
  private readonly toast = inject(ToastService);

  readonly status = signal<LoadStatus>('idle');
  readonly habits = signal<Habit[]>([]);
  readonly checks = signal<CheckInSet>(new Set());
  readonly today = signal(todayIso());
  readonly filter = signal<string | null>(null);
  readonly viewMonth = signal(monthOf(todayIso()));
  readonly selectedDate = signal(todayIso());

  readonly todayHabits = computed(() => scheduledOn(this.habits(), this.today()));
  readonly todayProgress = computed(() => dayProgress(this.habits(), this.checks(), this.today()));

  readonly firstDate = computed(() => earliestStart(this.habits()));
  readonly canGoPrev = computed(() => {
    const first = this.firstDate();
    const view = this.viewMonth();
    if (first === null) return false;
    const start = monthOf(first);
    return monthIndex(view.year, view.month) > monthIndex(start.year, start.month);
  });
  readonly canGoNext = computed(() => {
    const view = this.viewMonth();
    const now = monthOf(this.today());
    return monthIndex(view.year, view.month) < monthIndex(now.year, now.month);
  });

  readonly currentStreak = computed(() =>
    currentStreak(this.habits(), this.checks(), this.today(), this.filter()),
  );
  readonly bestStreak = computed(() =>
    bestStreak(this.habits(), this.checks(), this.today(), this.filter()),
  );
  readonly monthRate = computed(() => {
    const { year, month } = this.viewMonth();
    return monthRate(this.habits(), this.checks(), year, month, this.today(), this.filter());
  });
  readonly monthRateLabel = computed(() => `${monthShortName(this.viewMonth().month)} rate`);

  streakFor(habitId: string): number {
    return currentStreak(this.habits(), this.checks(), this.today(), habitId);
  }

  isChecked(habitId: string, date: string): boolean {
    return this.checks().has(checkKey(habitId, date));
  }

  async load(): Promise<void> {
    this.status.set('loading');
    try {
      const habits = await firstValueFrom(this.repo.listHabits());
      const today = this.today();
      const first = earliestStart(habits);
      const keys = new Set<string>();
      if (first !== null) {
        const requests = [];
        for (let from = first; from <= today; from = addDays(from, CHECK_IN_WINDOW_DAYS)) {
          const to = addDays(from, CHECK_IN_WINDOW_DAYS - 1);
          requests.push(firstValueFrom(this.repo.listCheckIns(from, to < today ? to : today)));
        }
        for (const list of await Promise.all(requests)) {
          for (const c of list) keys.add(checkKey(c.habitId, c.date));
        }
      }
      this.habits.set(habits);
      this.checks.set(keys);
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }

  reset(): void {
    this.status.set('idle');
    this.habits.set([]);
    this.checks.set(new Set());
    this.filter.set(null);
  }

  async addHabit(input: Omit<NewHabit, 'startDate'>): Promise<Habit> {
    const habit = await firstValueFrom(
      this.repo.createHabit({ ...input, startDate: this.today() }),
    );
    this.habits.update((list) => [...list, habit]);
    return habit;
  }

  private readonly confirmed = new Map<string, boolean>();
  private readonly pending = new Map<string, number>();
  private readonly queue = new Map<string, Promise<void>>();

  toggleToday(habitId: string): Promise<void> {
    const date = this.today();
    const key = checkKey(habitId, date);
    const next = !this.checks().has(key);
    if (!this.confirmed.has(key)) this.confirmed.set(key, !next);

    this.setChecked(key, next);
    this.pending.set(key, (this.pending.get(key) ?? 0) + 1);

    const run = (this.queue.get(key) ?? Promise.resolve()).then(async () => {
      try {
        await firstValueFrom(
          next ? this.repo.tick(habitId, date) : this.repo.untick(habitId, date),
        );
        this.confirmed.set(key, next);
      } catch {
        this.toast.show(SAVE_ERROR);
        if ((this.pending.get(key) ?? 1) <= 1)
          this.setChecked(key, this.confirmed.get(key) ?? !next);
      } finally {
        const left = (this.pending.get(key) ?? 1) - 1;
        if (left <= 0) {
          this.pending.delete(key);
          this.queue.delete(key);
        } else {
          this.pending.set(key, left);
        }
      }
    });
    this.queue.set(key, run);
    return run;
  }

  private setChecked(key: string, checked: boolean): void {
    this.checks.update((current) => {
      const copy = new Set(current);
      if (checked) copy.add(key);
      else copy.delete(key);
      return copy;
    });
  }

  selectFilter(habitId: string | null): void {
    this.filter.set(habitId);
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  shiftMonth(delta: -1 | 1): void {
    const { year, month } = this.viewMonth();
    const index = monthIndex(year, month) + delta;
    this.viewMonth.set({ year: Math.floor(index / 12), month: (index % 12) + 1 });
  }

  refreshToday(now: Date = new Date()): void {
    const fresh = todayIso(now);
    const old = this.today();
    if (fresh === old || diffDays(old, fresh) < 0) return;
    if (this.selectedDate() === old) this.selectedDate.set(fresh);
    const view = this.viewMonth();
    const oldMonth = monthOf(old);
    if (view.year === oldMonth.year && view.month === oldMonth.month)
      this.viewMonth.set(monthOf(fresh));
    this.today.set(fresh);
  }
}
