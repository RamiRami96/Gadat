import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { ToastService } from '@shared/services/toast-service';
import type { CheckIn, Habit } from '@infrastructure/models/api-models';
import { HabitRepository } from '../services/habit-repository';
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

class FakeRepository extends HabitRepository {
  habits: Habit[] = [READ];

  checkIns: CheckIn[] = [{ habitId: 'read', date: '2025-11-11' }];

  ticks: string[] = [];

  next: () => Observable<void> = () => of(undefined);

  listHabits() {
    return of(this.habits);
  }

  createHabit(): never {
    throw new Error('not used');
  }

  archiveHabit(): never {
    throw new Error('not used');
  }

  listCheckIns() {
    return of(this.checkIns);
  }

  tick(habitId: string, date: string) {
    this.ticks.push(`PUT ${habitId} ${date}`);
    return this.next();
  }

  untick(habitId: string, date: string) {
    this.ticks.push(`DELETE ${habitId} ${date}`);
    return this.next();
  }
}

function setup() {
  const repo = new FakeRepository();
  TestBed.configureTestingModule({
    providers: [HabitStore, { provide: HabitRepository, useValue: repo }],
  });
  const store = TestBed.inject(HabitStore);
  store.today.set(TODAY);
  return { repo, store, toast: TestBed.inject(ToastService) };
}

describe('HabitStore', () => {
  it('loads habits and check-ins', async () => {
    const { store } = setup();
    await store.load();
    expect(store.status()).toBe('ready');
    expect(store.todayHabits().map((h) => h.id)).toEqual(['read']);
    expect(store.streakFor('read')).toBe(1);
  });

  it('ticking updates the screen at once and the streak follows', async () => {
    const { store, repo } = setup();
    await store.load();
    const done = store.toggleToday('read');
    expect(store.isChecked('read', TODAY)).toBe(true);
    expect(store.todayProgress()).toEqual({ done: 1, total: 1 });
    await done;
    expect(repo.ticks).toEqual([`PUT read ${TODAY}`]);
    expect(store.streakFor('read')).toBe(2);
    expect(store.currentStreak()).toBe(2);
  });

  it('undoes the change and shows a toast when the call fails', async () => {
    const { store, repo, toast } = setup();
    await store.load();
    repo.next = () => throwError(() => new Error('offline'));
    await store.toggleToday('read');
    expect(store.isChecked('read', TODAY)).toBe(false);
    expect(toast.toasts().map((t) => t.message)).toEqual(['Couldn’t save. Try again.']);
  });

  it('survives rapid double taps: calls go out in order and the end state is right', async () => {
    const { store, repo } = setup();
    await store.load();
    const gate = new Subject<void>();
    let calls = 0;
    repo.next = () => {
      calls += 1;
      return calls === 1 ? gate : of(undefined);
    };

    const first = store.toggleToday('read');
    const second = store.toggleToday('read');
    expect(store.isChecked('read', TODAY)).toBe(false);
    await new Promise((resolve) => {
      setTimeout(resolve);
    });
    expect(repo.ticks).toEqual([`PUT read ${TODAY}`]);

    gate.next();
    gate.complete();
    await first;
    await second;

    expect(repo.ticks).toEqual([`PUT read ${TODAY}`, `DELETE read ${TODAY}`]);
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
