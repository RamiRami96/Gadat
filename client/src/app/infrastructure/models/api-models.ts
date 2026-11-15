/** API contract, mirrored by hand from the server (see README, "API"). */

export interface Habit {
  id: string;
  name: string;
  note: string | null;
  /** ISO weekdays: 1 = Monday ... 7 = Sunday. */
  days: number[];
  /** "YYYY-MM-DD", first day the habit counts. */
  startDate: string;
  /** "YYYY-MM-DD", last day the habit counts; set when archived. */
  endDate: string | null;
  createdAt: string;
}

export interface CheckIn {
  habitId: string;
  date: string;
}

export interface NewHabit {
  name: string;
  note?: string;
  days: number[];
  startDate: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
}
