export type HabitType = 'health' | 'job' | 'relationship';

export type HabitName = 'digital detox' | 'stay focused' | 'meet with new partner in a week';

export interface Habit {
  id: string;
  type: HabitType;
  name: HabitName;
  start: Date;
  sprint: boolean[];
}
