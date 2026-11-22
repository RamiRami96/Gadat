import type { Habit } from '@shared/models/api-models';
import {
  bestStreak,
  checkKey,
  currentStreak,
  dayProgress,
  isScheduled,
  monthRate,
  ringFraction,
  ringStatus,
} from './habit-stats';

const ALL = [1, 2, 3, 4, 5, 6, 7];

function habit(id: string, over: Partial<Habit> = {}): Habit {
  return {
    id,
    name: id,
    note: null,
    days: ALL,
    startDate: '2025-11-01',
    endDate: null,
    createdAt: '2025-11-01T00:00:00Z',
    ...over,
  };
}

function ticks(id: string, dates: string[]): string[] {
  return dates.map((d) => checkKey(id, d));
}

const set = (...keys: string[][]) => new Set(keys.flat());

describe('isScheduled', () => {
  const mwf = habit('mwf', { days: [1, 3, 5], startDate: '2025-11-03', endDate: '2025-11-14' });

  it('is scheduled only on its weekdays', () => {
    expect(isScheduled(mwf, '2025-11-03')).toBe(true);
    expect(isScheduled(mwf, '2025-11-04')).toBe(false);
    expect(isScheduled(mwf, '2025-11-05')).toBe(true);
  });

  it('is not scheduled before it started', () => {
    expect(isScheduled(habit('late', { startDate: '2025-11-10' }), '2025-11-09')).toBe(false);
    expect(isScheduled(habit('late', { startDate: '2025-11-10' }), '2025-11-10')).toBe(true);
  });

  it('counts its end date as the last scheduled day', () => {
    expect(isScheduled(mwf, '2025-11-14')).toBe(true);
    expect(isScheduled(mwf, '2025-11-17')).toBe(false);
  });
});

describe('day progress and ring', () => {
  const habits = [habit('a'), habit('b'), habit('mwf', { days: [1, 3, 5] })];

  it('counts only habits scheduled that weekday', () => {
    expect(dayProgress(habits, new Set(), '2025-11-04')).toEqual({ done: 0, total: 2 });
    expect(dayProgress(habits, new Set(), '2025-11-03')).toEqual({ done: 0, total: 3 });
  });

  it('ignores ticks on habits that are not scheduled', () => {
    const checks = set(ticks('mwf', ['2025-11-04']));
    expect(dayProgress(habits, checks, '2025-11-04')).toEqual({ done: 0, total: 2 });
  });

  it('fills done / total', () => {
    expect(ringFraction({ done: 2, total: 5 })).toBeCloseTo(0.4);
    expect(ringFraction({ done: 5, total: 5 })).toBe(1);
    expect(ringFraction({ done: 0, total: 0 })).toBe(0);
  });

  it('names the ring state', () => {
    expect(ringStatus({ done: 0, total: 0 })).toBe('none');
    expect(ringStatus({ done: 0, total: 3 })).toBe('empty');
    expect(ringStatus({ done: 1, total: 3 })).toBe('partial');
    expect(ringStatus({ done: 3, total: 3 })).toBe('full');
  });

  it('narrows to one habit for the chip filter', () => {
    const checks = set(ticks('a', ['2025-11-04']));
    expect(dayProgress(habits, checks, '2025-11-04', 'a')).toEqual({ done: 1, total: 1 });
    expect(dayProgress(habits, checks, '2025-11-04', 'b')).toEqual({ done: 0, total: 1 });
    expect(dayProgress(habits, checks, '2025-11-04', 'mwf')).toEqual({ done: 0, total: 0 });
  });
});

describe('currentStreak', () => {
  const daily = [habit('a')];

  it('keeps the streak alive while today is not ticked yet', () => {
    const checks = set(ticks('a', ['2025-11-01', '2025-11-02', '2025-11-03', '2025-11-04']));
    expect(currentStreak(daily, checks, '2025-11-05')).toBe(4);
  });

  it('adds today once it is ticked', () => {
    const checks = set(ticks('a', ['2025-11-03', '2025-11-04', '2025-11-05']));
    expect(currentStreak(daily, checks, '2025-11-05')).toBe(3);
  });

  it('is 1 after the first tick, and 0 before it', () => {
    expect(currentStreak(daily, set(ticks('a', ['2025-11-05'])), '2025-11-05')).toBe(1);
    expect(currentStreak(daily, new Set(), '2025-11-05')).toBe(0);
  });

  it('breaks on a missed day before yesterday', () => {
    const checks = set(ticks('a', ['2025-11-01', '2025-11-02', '2025-11-04']));
    expect(currentStreak(daily, checks, '2025-11-05')).toBe(1);
  });

  it('is 0 when yesterday was missed and today is not ticked', () => {
    const checks = set(ticks('a', ['2025-11-01', '2025-11-02']));
    expect(currentStreak(daily, checks, '2025-11-05')).toBe(0);
  });

  it('is 0 without habits', () => {
    expect(currentStreak([], new Set(), '2025-11-05')).toBe(0);
  });

  it('skips days when nothing is scheduled instead of breaking', () => {
    const mwf = [habit('mwf', { days: [1, 3, 5] })];
    const checks = set(ticks('mwf', ['2025-11-03', '2025-11-05', '2025-11-07']));
    expect(currentStreak(mwf, checks, '2025-11-09')).toBe(3);
    expect(currentStreak(mwf, checks, '2025-11-10')).toBe(3);
    expect(currentStreak(mwf, checks, '2025-11-12')).toBe(0);
  });

  it('counts a day for all habits when at least one scheduled habit is ticked', () => {
    const habits = [habit('a'), habit('b')];
    const checks = set(
      ticks('a', ['2025-11-01', '2025-11-03']),
      ticks('b', ['2025-11-02', '2025-11-03']),
    );
    expect(currentStreak(habits, checks, '2025-11-03')).toBe(3);
  });

  it('uses only that habit when one is selected', () => {
    const habits = [habit('a'), habit('b')];
    const checks = set(
      ticks('a', ['2025-11-01', '2025-11-02', '2025-11-03']),
      ticks('b', ['2025-11-03']),
    );
    expect(currentStreak(habits, checks, '2025-11-03', 'a')).toBe(3);
    expect(currentStreak(habits, checks, '2025-11-03', 'b')).toBe(1);
  });

  it('does not count a habit before it started', () => {
    const late = [habit('a', { startDate: '2025-11-04' })];
    expect(currentStreak(late, set(ticks('a', ['2025-11-04', '2025-11-05'])), '2025-11-05')).toBe(
      2,
    );
  });
});

describe('bestStreak', () => {
  it('is the longest run in the whole history', () => {
    const checks = set(
      ticks('a', [
        '2025-11-01',
        '2025-11-02',
        '2025-11-04',
        '2025-11-05',
        '2025-11-06',
        '2025-11-08',
      ]),
    );
    expect(bestStreak([habit('a')], checks, '2025-11-08')).toBe(3);
  });

  it('is not reduced by an open, unticked today', () => {
    const checks = set(ticks('a', ['2025-11-01', '2025-11-02', '2025-11-03']));
    expect(bestStreak([habit('a')], checks, '2025-11-04')).toBe(3);
  });

  it('bridges days where nothing is scheduled', () => {
    const mwf = [habit('mwf', { days: [1, 3, 5] })];
    const checks = set(ticks('mwf', ['2025-11-03', '2025-11-05', '2025-11-07', '2025-11-10']));
    expect(bestStreak(mwf, checks, '2025-11-12')).toBe(4);
  });

  it('is 0 with no ticks or no habits', () => {
    expect(bestStreak([habit('a')], new Set(), '2025-11-08')).toBe(0);
    expect(bestStreak([], new Set(), '2025-11-08')).toBe(0);
  });
});

describe('monthRate', () => {
  const habits = [habit('a'), habit('mwf', { days: [1, 3, 5] })];

  it('divides ticks by scheduled habit-days from the 1st through today', () => {
    const checks = set(
      ticks('a', ['2025-11-01', '2025-11-02', '2025-11-03', '2025-11-04', '2025-11-05']),
      ticks('mwf', ['2025-11-03', '2025-11-05']),
    );
    expect(monthRate(habits, checks, 2025, 11, '2025-11-10')).toBe(Math.round((7 / 14) * 100));
  });

  it('uses the whole month for a past month', () => {
    expect(monthRate(habits, new Set(), 2025, 10, '2025-11-10')).toBe(0);
    const old = [habit('a', { startDate: '2025-10-01' })];
    const checks = set(ticks('a', ['2025-10-01', '2025-10-02', '2025-10-03']));
    expect(monthRate(old, checks, 2025, 10, '2025-11-10')).toBe(Math.round((3 / 31) * 100));
  });

  it('is 0, not NaN, when nothing was scheduled', () => {
    expect(monthRate([], new Set(), 2025, 11, '2025-11-10')).toBe(0);
    expect(monthRate(habits, new Set(), 2025, 12, '2025-11-10')).toBe(0);
  });

  it('ignores ticks on days a habit was not scheduled', () => {
    const checks = set(ticks('mwf', ['2025-11-04']));
    expect(monthRate([habit('mwf', { days: [1, 3, 5] })], checks, 2025, 11, '2025-11-10')).toBe(0);
  });

  it('follows the chip filter', () => {
    const checks = set(ticks('a', ['2025-11-01', '2025-11-02']));
    expect(monthRate(habits, checks, 2025, 11, '2025-11-04', 'a')).toBe(50);
  });
});
