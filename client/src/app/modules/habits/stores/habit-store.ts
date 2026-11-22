import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@shared/services/toast-service';
import type { Habit, NewHabit } from '@shared/models/api-models';
import {
  addDays,
  diffDays,
  monthIndex,
  monthOf,
  monthShortName,
  todayIso,
} from '@shared/utils/dates';
import { CHECK_IN_WINDOW_DAYS, LOAD_STATUS, SAVE_ERROR } from '../constants/habit-constants';
import type { LoadStatus } from '../models/habit-models';
import { HabitService } from '../services/habit-service';
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
  private readonly habitService = inject(HabitService);

  private readonly toast = inject(ToastService);

  public readonly status = signal<LoadStatus>(LOAD_STATUS.Idle);

  public readonly habits = signal<Habit[]>([]);

  public readonly checks = signal<CheckInSet>(new Set());

  public readonly today = signal(todayIso());

  public readonly filter = signal<string | null>(null);

  public readonly viewMonth = signal(monthOf(todayIso()));

  public readonly selectedDate = signal(todayIso());

  public readonly todayHabits = computed(() => scheduledOn(this.habits(), this.today()));

  public readonly todayProgress = computed(() =>
    dayProgress(this.habits(), this.checks(), this.today()),
  );

  public readonly firstDate = computed(() => earliestStart(this.habits()));

  public readonly canGoPrev = computed(() => {
    const first = this.firstDate();
    const view = this.viewMonth();
    if (first === null) return false;
    const start = monthOf(first);
    return monthIndex(view.year, view.month) > monthIndex(start.year, start.month);
  });

  public readonly canGoNext = computed(() => {
    const view = this.viewMonth();
    const now = monthOf(this.today());
    return monthIndex(view.year, view.month) < monthIndex(now.year, now.month);
  });

  public readonly currentStreak = computed(() =>
    currentStreak(this.habits(), this.checks(), this.today(), this.filter()),
  );

  public readonly bestStreak = computed(() =>
    bestStreak(this.habits(), this.checks(), this.today(), this.filter()),
  );

  public readonly monthRate = computed(() => {
    const { year, month } = this.viewMonth();
    return monthRate(this.habits(), this.checks(), year, month, this.today(), this.filter());
  });

  public readonly monthRateLabel = computed(() => `${monthShortName(this.viewMonth().month)} rate`);

  public streakFor(habitId: string): number {
    return currentStreak(this.habits(), this.checks(), this.today(), habitId);
  }

  public isChecked(habitId: string, date: string): boolean {
    return this.checks().has(checkKey(habitId, date));
  }

  public async load(): Promise<void> {
    this.status.set(LOAD_STATUS.Loading);
    try {
      const habits = await firstValueFrom(this.habitService.listHabits());
      const today = this.today();
      const first = earliestStart(habits);
      const keys = new Set<string>();
      if (first !== null) {
        const requests = [];
        for (let from = first; from <= today; from = addDays(from, CHECK_IN_WINDOW_DAYS)) {
          const to = addDays(from, CHECK_IN_WINDOW_DAYS - 1);
          requests.push(
            firstValueFrom(this.habitService.listCheckIns(from, to < today ? to : today)),
          );
        }
        (await Promise.all(requests)).flat().forEach((c) => keys.add(checkKey(c.habitId, c.date)));
      }
      this.habits.set(habits);
      this.checks.set(keys);
      this.status.set(LOAD_STATUS.Ready);
    } catch {
      this.status.set(LOAD_STATUS.Error);
    }
  }

  public reset(): void {
    this.status.set(LOAD_STATUS.Idle);
    this.habits.set([]);
    this.checks.set(new Set());
    this.filter.set(null);
  }

  public async addHabit(input: Omit<NewHabit, 'startDate'>): Promise<Habit> {
    const habit = await firstValueFrom(
      this.habitService.createHabit({ ...input, startDate: this.today() }),
    );
    this.habits.update((list) => [...list, habit]);
    return habit;
  }

  private readonly confirmed = new Map<string, boolean>();

  private readonly pending = new Map<string, number>();

  private readonly queue = new Map<string, Promise<void>>();

  public toggleToday(habitId: string): Promise<void> {
    const date = this.today();
    const key = checkKey(habitId, date);
    const next = !this.checks().has(key);
    if (!this.confirmed.has(key)) this.confirmed.set(key, !next);

    this.setChecked(key, next);
    this.pending.set(key, (this.pending.get(key) ?? 0) + 1);

    const run = (this.queue.get(key) ?? Promise.resolve()).then(async () => {
      try {
        await firstValueFrom(
          next ? this.habitService.tick(habitId, date) : this.habitService.untick(habitId, date),
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

  public selectFilter(habitId: string | null): void {
    this.filter.set(habitId);
  }

  public selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  public shiftMonth(delta: -1 | 1): void {
    const { year, month } = this.viewMonth();
    const index = monthIndex(year, month) + delta;
    this.viewMonth.set({ year: Math.floor(index / 12), month: (index % 12) + 1 });
  }

  public refreshToday(now: Date = new Date()): void {
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
