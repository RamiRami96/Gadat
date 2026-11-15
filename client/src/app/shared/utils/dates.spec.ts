import {
  addDays,
  daysInMonth,
  diffDays,
  formatLongDate,
  isoWeekday,
  monthGrid,
  shiftMonth,
  todayIso,
} from './dates';

describe('dates', () => {
  it('uses the local calendar day, not UTC', () => {
    // 23:30 local time on 31 Dec must stay 31 Dec even though UTC may already be 1 Jan.
    expect(todayIso(new Date(2025, 11, 31, 23, 30))).toBe('2025-12-31');
    expect(todayIso(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });

  it('returns the ISO weekday with Monday = 1 and Sunday = 7', () => {
    expect(isoWeekday('2025-11-03')).toBe(1);
    expect(isoWeekday('2025-11-09')).toBe(7);
  });

  it('adds days across month and year boundaries and across daylight saving changes', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2025-03-01', -1)).toBe('2025-02-28');
    expect(addDays('2025-03-29', 3)).toBe('2025-04-01');
    expect(diffDays('2025-10-25', '2025-10-27')).toBe(2);
  });

  it('knows month lengths, including leap years', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2025, 11)).toBe(30);
  });

  it('steps months over year boundaries', () => {
    expect(shiftMonth(2025, 1, -1)).toEqual({ year: 2024, month: 12 });
    expect(shiftMonth(2025, 12, 1)).toEqual({ year: 2026, month: 1 });
  });

  it('builds a Monday-first grid padded to full weeks', () => {
    const grid = monthGrid(2025, 11); // 1 Nov 2025 is a Saturday
    expect(grid.length % 7).toBe(0);
    expect(grid.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(grid[5]).toBe('2025-11-01');
    expect(grid.filter(Boolean)).toHaveLength(30);
    expect(isoWeekday(grid[7]!)).toBe(1);
  });

  it('formats dates for display', () => {
    expect(formatLongDate('2025-11-03')).toBe('Monday, 3 November');
  });
});
