import { Observable } from 'rxjs';
import type { CheckIn, Habit, NewHabit } from '@shared/models/api-models';

export abstract class HabitRepository {
  abstract listHabits(): Observable<Habit[]>;
  abstract createHabit(habit: NewHabit): Observable<Habit>;
  abstract archiveHabit(id: string, date: string): Observable<void>;
  abstract listCheckIns(from: string, to: string): Observable<CheckIn[]>;
  abstract tick(habitId: string, date: string): Observable<void>;
  abstract untick(habitId: string, date: string): Observable<void>;
}
