export interface Habit {
  id: string;
  type: 'health' | 'job' | 'relationship';
  name: 'digital detox' | 'stay focused' | 'meet with new partner in a week';
  start: Date;
  sprint: boolean[];
}
