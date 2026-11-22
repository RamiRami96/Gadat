export interface Habit {
  id: string;
  name: string;
  note: string | null;
  days: number[];
  startDate: string;
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
