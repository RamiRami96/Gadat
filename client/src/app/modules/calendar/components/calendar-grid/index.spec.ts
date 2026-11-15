import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Habit } from '@infrastructure/models/api-models';
import { checkKey } from '@modules/habits';
import type { DayCell } from '../../models/calendar-models';
import { buildCalendar } from '../../utils/calendar-days';
import { CalendarGrid } from '.';

function habit(id: string, over: Partial<Habit> = {}): Habit {
  return {
    id,
    name: id,
    note: null,
    days: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2025-11-03',
    endDate: null,
    createdAt: '2025-11-03T00:00:00Z',
    ...over,
  };
}

@Component({
  imports: [CalendarGrid],
  template: `<app-calendar-grid [days]="days" (pick)="picked = $event" />`,
})
class Host {
  days: (DayCell | null)[] = [];
  picked = '';
}

// November 2025: the 1st is a Saturday. Today is Wednesday the 12th.
const habits = [habit('read'), habit('water'), habit('mwf', { days: [1, 3, 5] })];
const checks = new Set([
  // Mon 3: all three done -> full
  checkKey('read', '2025-11-03'),
  checkKey('water', '2025-11-03'),
  checkKey('mwf', '2025-11-03'),
  // Tue 4: one of two done -> partial
  checkKey('read', '2025-11-04'),
  // Wed 5: nothing done -> empty ring
]);

function render(filter: string | null = null, selected = '2025-11-12') {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.days = buildCalendar({
    habits,
    checks,
    year: 2025,
    month: 11,
    today: '2025-11-12',
    filter,
    selected,
  });
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const day = (n: number) =>
    root.querySelector<HTMLButtonElement>(`button[aria-label^="${n} November"]`)!;
  return { fixture, root, day };
}

describe('CalendarGrid day classes', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('draws a solid circle when every scheduled habit is done', () => {
    const { day } = render();
    expect(day(3).classList).toContain('day--full');
    expect(day(3).getAttribute('aria-label')).toBe('3 November, 3 of 3 habits done');
  });

  it('draws a partial arc when some habits are done', () => {
    const { day } = render();
    expect(day(4).classList).toContain('day--partial');
    expect(day(4).getAttribute('aria-label')).toBe('4 November, 1 of 2 habits done');
    expect(day(4).style.getPropertyValue('--fill')).toBe('180deg');
  });

  it('draws an empty ring when nothing is done yet', () => {
    const { day } = render();
    expect(day(5).classList).toContain('day--empty');
    expect(day(5).classList).not.toContain('day--full');
  });

  it('shows a plain disabled number before the first habit, and in the future', () => {
    const { day } = render();
    expect(day(1).classList).toContain('day--off'); // before the habits started
    expect(day(1).disabled).toBe(true);
    expect(day(20).classList).toContain('day--off'); // future
    expect(day(20).disabled).toBe(true);
  });

  it('never shows an unscheduled habit: a single weekday habit leaves other days plain', () => {
    const { day } = render('mwf');
    expect(day(4).classList).toContain('day--off'); // Tuesday: mwf is not scheduled
    expect(day(4).disabled).toBe(true);
    expect(day(5).classList).toContain('day--empty'); // Wednesday
  });

  it('with one habit selected, a day is either solid or an empty ring', () => {
    const { day } = render('read');
    expect(day(3).classList).toContain('day--full');
    expect(day(4).classList).toContain('day--full');
    expect(day(5).classList).toContain('day--empty');
    expect(root(day(3)).querySelector('.day--partial')).toBeNull();
  });

  it('marks today with a dot and the selected day with the selected class', () => {
    const { day } = render(null, '2025-11-04');
    expect(day(12).classList).toContain('day--today');
    expect(day(12).querySelector('.day__dot')).not.toBeNull();
    expect(day(12).getAttribute('aria-current')).toBe('date');
    expect(day(4).classList).toContain('day--selected');
    expect(day(5).classList).not.toContain('day--selected');
    expect(day(5).querySelector('.day__dot')).toBeNull();
  });

  it('reports the date of the tapped day', () => {
    const { fixture, day } = render();
    day(5).click();
    expect(fixture.componentInstance.picked).toBe('2025-11-05');
  });

  it('pads the first week so the 1st lands on a Saturday', () => {
    const { root } = render();
    const buttons = root.querySelectorAll('button.day');
    expect(buttons).toHaveLength(30);
    const cells = root.querySelectorAll('[role="group"] > *');
    expect(cells[5]).toBe(buttons[0]);
  });
});

function root(el: Element): Element {
  return el.closest('app-calendar-grid')!;
}
