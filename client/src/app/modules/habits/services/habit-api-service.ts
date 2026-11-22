import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { api } from '@shared/services/api-service';
import type { CheckIn, Habit, NewHabit } from '@shared/models/api-models';
import { HabitService } from './habit-service';

@Injectable()
export class HabitApiService extends HabitService {
  private readonly http = inject(HttpClient);

  public listHabits(): Observable<Habit[]> {
    return this.http.get<Habit[]>(api('/habits'));
  }

  public createHabit(habit: NewHabit): Observable<Habit> {
    return this.http.post<Habit>(api('/habits'), habit);
  }

  public archiveHabit(id: string, date: string): Observable<void> {
    const params = new HttpParams().set('date', date);
    return this.http.delete(api(`/habits/${id}`), { params }).pipe(map(() => undefined));
  }

  public listCheckIns(from: string, to: string): Observable<CheckIn[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<CheckIn[]>(api('/check-ins'), { params });
  }

  public tick(habitId: string, date: string): Observable<void> {
    return this.http
      .put(api(`/habits/${habitId}/check-ins/${date}`), null)
      .pipe(map(() => undefined));
  }

  public untick(habitId: string, date: string): Observable<void> {
    return this.http.delete(api(`/habits/${habitId}/check-ins/${date}`)).pipe(map(() => undefined));
  }
}
