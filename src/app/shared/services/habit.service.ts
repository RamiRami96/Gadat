import { Injectable, signal } from '@angular/core';
import { Habit } from '../models/habit.model';

@Injectable({
  providedIn: 'root',
})
export class HabitService {
  private _habits = signal<Habit[]>([]);
  private _initialHabits: Habit[] = [];

  constructor() {
    const _jsonHabits = localStorage.getItem('habits');
    this._initialHabits = _jsonHabits ? (JSON.parse(_jsonHabits) as Habit[]) : [];
    this._habits.set(this._initialHabits);
  }

  public get habits() {
    return this._habits;
  }

  public getHabit(id: string): Habit | null {
    return this._habits().find(habit => habit.id === id) ?? null;
  }

  public createHabit(habit: Habit): void {
    const newHabits = [...this._habits(), habit];
    this._updateHabits(newHabits);
  }

  public updateHabit(habit: Habit): void {
    const updatedHabits = this._habits().map(item => (item.id === habit.id ? habit : item));
    this._updateHabits(updatedHabits);
  }

  public deleteHabit(id: string): void {
    const updatedHabits = this._habits().filter(item => item.id !== id);
    this._updateHabits(updatedHabits);
  }

  public deleteAllHabits(): void {
    this._updateHabits([]);
  }

  public completeHabit(habit: Habit): void {
    const updatedHabit = this._markHabitAsCompleted(habit, new Date());
    this.updateHabit(updatedHabit);
  }

  public searchHabit(value?: string | null): void {
    if (!value) {
      this._habits.set(this._initialHabits);
    } else {
      const searchingHabits = this._initialHabits.filter(habit => habit.name.includes(value.trim())) ?? [];
      this._habits.set(searchingHabits);
    }
  }

  private _markHabitAsCompleted(habit: Habit, completionDate: Date): Habit {
    const startDate = new Date(habit.start);
    const completeDate = new Date(completionDate);

    const differenceInTime = completeDate.getTime() - startDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

    const updatedSprint = [...habit.sprint];
    if (differenceInDays >= 0 && differenceInDays < updatedSprint.length) {
      updatedSprint[differenceInDays] = true;
    }

    return { ...habit, sprint: updatedSprint };
  }

  private _updateHabits(newHabits: Habit[]): void {
    localStorage.setItem('habits', JSON.stringify(newHabits));
    this._initialHabits = newHabits;
    this._habits.set(newHabits);
  }
}
