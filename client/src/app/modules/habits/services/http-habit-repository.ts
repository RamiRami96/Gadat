import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { api } from '@shared/services/api-service';
import type { CheckIn, Habit, NewHabit } from '@infrastructure/models/api-models';
import { HabitRepository } from './habit-repository';

@Injectable()
export class HttpHabitRepository extends HabitRepository {
  private readonly http = inject(HttpClient);

  listHabits(): Observable<Habit[]> {
    return this.http.get<Habit[]>(api('/habits'));
  }

  createHabit(habit: NewHabit): Observable<Habit> {
    return this.http.post<Habit>(api('/habits'), habit);
  }

  archiveHabit(id: string, date: string): Observable<void> {
    const params = new HttpParams().set('date', date);
    return this.http.delete(api(`/habits/${id}`), { params }).pipe(map(() => undefined));
  }

  listCheckIns(from: string, to: string): Observable<CheckIn[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<CheckIn[]>(api('/check-ins'), { params });
  }

  tick(habitId: string, date: string): Observable<void> {
    return this.http
      .put(api(`/habits/${habitId}/check-ins/${date}`), null)
      .pipe(map(() => undefined));
  }

  untick(habitId: string, date: string): Observable<void> {
    return this.http.delete(api(`/habits/${habitId}/check-ins/${date}`)).pipe(map(() => undefined));
  }
}
