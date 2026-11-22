import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { ToastService } from '@shared/services/toast-service';
import type { CheckIn, Habit } from '@shared/models/api-models';
import { HabitService } from '../services/habit-service';
import { LOAD_STATUS } from '../constants/habit-constants';
import { HabitStore } from './habit-store';

const TODAY = '2025-11-12';

const READ: Habit = {
  id: 'read',
  name: 'Read 20 pages',
  note: null,
  days: [1, 2, 3, 4, 5, 6, 7],
  startDate: '2025-11-10',
  endDate: null,
  createdAt: '2025-11-10T00:00:00Z',
};

class FakeHabitService extends HabitService {
  public habits: Habit[] = [READ];

  public checkIns: CheckIn[] = [{ habitId: 'read', date: '2025-11-11' }];

  public ticks: string[] = [];

  public next: () => Observable<void> = () => of(undefined);

  public listHabits() {
    return of(this.habits);
  }

  public createHabit(): never {
    throw new Error('not used');
  }

  public archiveHabit(): never {
    throw new Error('not used');
  }

  public listCheckIns() {
    return of(this.checkIns);
  }

  public tick(habitId: string, date: string) {
    this.ticks.push(`PUT ${habitId} ${date}`);
    return this.next();
  }

  public untick(habitId: string, date: string) {
    this.ticks.push(`DELETE ${habitId} ${date}`);
    return this.next();
  }
}

function setup() {
  const habitService = new FakeHabitService();
  TestBed.configureTestingModule({
    providers: [HabitStore, { provide: HabitService, useValue: habitService }],
  });
  const store = TestBed.inject(HabitStore);
  store.today.set(TODAY);
  return { habitService, store, toast: TestBed.inject(ToastService) };
}

describe('HabitStore', () => {
  it('loads habits and check-ins', async () => {
    const { store } = setup();
    await store.load();
    expect(store.status()).toBe(LOAD_STATUS.Ready);
    expect(store.todayHabits().map((h) => h.id)).toEqual(['read']);
    expect(store.streakFor('read')).toBe(1);
  });

  it('ticking updates the screen at once and the streak follows', async () => {
    const { store, habitService } = setup();
    await store.load();
    const done = store.toggleToday('read');
    expect(store.isChecked('read', TODAY)).toBe(true);
    expect(store.todayProgress()).toEqual({ done: 1, total: 1 });
    await done;
    expect(habitService.ticks).toEqual([`PUT read ${TODAY}`]);
    expect(store.streakFor('read')).toBe(2);
    expect(store.currentStreak()).toBe(2);
  });

  it('undoes the change and shows a toast when the call fails', async () => {
    const { store, habitService, toast } = setup();
    await store.load();
    habitService.next = () => throwError(() => new Error('offline'));
    await store.toggleToday('read');
    expect(store.isChecked('read', TODAY)).toBe(false);
    expect(toast.toasts().map((t) => t.message)).toEqual(['Couldn’t save. Try again.']);
  });

  it('survives rapid double taps: calls go out in order and the end state is right', async () => {
    const { store, habitService } = setup();
    await store.load();
    const gate = new Subject<void>();
    let calls = 0;
    habitService.next = () => {
      calls += 1;
      return calls === 1 ? gate : of(undefined);
    };

    const first = store.toggleToday('read');
    const second = store.toggleToday('read');
    expect(store.isChecked('read', TODAY)).toBe(false);
    await new Promise((resolve) => {
      setTimeout(resolve);
    });
    expect(habitService.ticks).toEqual([`PUT read ${TODAY}`]);

    gate.next();
    gate.complete();
    await first;
    await second;

    expect(habitService.ticks).toEqual([`PUT read ${TODAY}`, `DELETE read ${TODAY}`]);
    expect(store.isChecked('read', TODAY)).toBe(false);
  });

  it('keeps month navigation between the first habit and the current month', async () => {
    const { store } = setup();
    store.viewMonth.set({ year: 2025, month: 11 });
    await store.load();
    expect(store.canGoNext()).toBe(false);
    expect(store.canGoPrev()).toBe(false);
    store.habits.update((list) => [{ ...list[0], startDate: '2025-09-01' }]);
    expect(store.canGoPrev()).toBe(true);
    store.shiftMonth(-1);
    expect(store.canGoNext()).toBe(true);
  });

  it('follows midnight: today, the selected day and the month move on', async () => {
    const { store } = setup();
    store.selectedDate.set(TODAY);
    store.viewMonth.set({ year: 2025, month: 11 });
    store.refreshToday(new Date(2025, 11, 1, 0, 1));
    expect(store.today()).toBe('2025-12-01');
    expect(store.selectedDate()).toBe('2025-12-01');
    expect(store.viewMonth()).toEqual({ year: 2025, month: 12 });
  });
});
