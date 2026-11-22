import { Observable } from 'rxjs';
import type { CheckIn, Habit, NewHabit } from '@shared/models/api-models';

export abstract class HabitService {
  public abstract listHabits(): Observable<Habit[]>;
  public abstract createHabit(habit: NewHabit): Observable<Habit>;
  public abstract archiveHabit(id: string, date: string): Observable<void>;
  public abstract listCheckIns(from: string, to: string): Observable<CheckIn[]>;
  public abstract tick(habitId: string, date: string): Observable<void>;
  public abstract untick(habitId: string, date: string): Observable<void>;
}
