import { addDays, diffDays, isFutureDate, isValidDateString, latestAllowedDate } from './dates.js';

describe('dates', () => {
  it('accepts only real YYYY-MM-DD calendar dates', () => {
    expect(isValidDateString('2024-02-29')).toBe(true);
    expect(isValidDateString('2025-02-29')).toBe(false);
    expect(isValidDateString('2025-02-30')).toBe(false);
    expect(isValidDateString('2025-13-01')).toBe(false);
    expect(isValidDateString('2025-1-1')).toBe(false);
    expect(isValidDateString('2025-01-01T00:00:00Z')).toBe(false);
    expect(isValidDateString(20250101)).toBe(false);
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2025-03-01', -1)).toBe('2025-02-28');
  });

  it('counts whole days between dates', () => {
    expect(diffDays('2025-01-01', '2025-01-31')).toBe(30);
    expect(diffDays('2025-03-01', '2025-02-01')).toBe(-28);
  });

  it('rejects anything later than the server UTC date plus one day', () => {
    const now = new Date('2025-06-10T23:30:00Z');
    expect(latestAllowedDate(now)).toBe('2025-06-11');
    expect(isFutureDate('2025-06-11', now)).toBe(false);
    expect(isFutureDate('2025-06-12', now)).toBe(true);
  });
});
