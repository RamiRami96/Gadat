import { Observable } from 'rxjs';
import type { CheckIn, Habit, NewHabit } from '@infrastructure/models/api-models';

/** Where habits and check-ins come from. The store depends on this, never on HttpClient. */
export abstract class HabitRepository {
  abstract listHabits(): Observable<Habit[]>;
  abstract createHabit(habit: NewHabit): Observable<Habit>;
  abstract archiveHabit(id: string, date: string): Observable<void>;
  /** The server answers at most 400 days per request. */
  abstract listCheckIns(from: string, to: string): Observable<CheckIn[]>;
  abstract tick(habitId: string, date: string): Observable<void>;
  abstract untick(habitId: string, date: string): Observable<void>;
}
