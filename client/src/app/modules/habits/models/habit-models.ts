import type { LOAD_STATUS } from '../constants/habit-constants';

export type LoadStatus = (typeof LOAD_STATUS)[keyof typeof LOAD_STATUS];

export interface WeekdayOption {
  value: number;
  short: string;
  full: string;
}
