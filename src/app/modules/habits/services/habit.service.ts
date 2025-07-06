import { Injectable, signal, inject } from '@angular/core';
import { Habit } from '../models/habit.model';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class HabitService {
  private _authService = inject(AuthService);
  private _habits = signal<Habit[]>([]);
  private _initialHabits: Habit[] = [];

  constructor() {
    this.loadUserHabits();
  }

  public get habits() {
    return this._habits;
  }

  public get hasInitialHabits(): boolean {
    return this._initialHabits.length > 0;
  }

  public getHabit(id: string): Habit | null {
    return this._habits().find(habit => habit.id === id) ?? null;
  }

  public createHabit(habit: Habit): void {
    const user = this._authService.currentUser();
    if (!user) return;

    const habitWithUser = {
      ...habit,
      userId: user.id,
      createdBy: user.username,
      createdAt: new Date().toISOString()
    };

    const newHabits = [...this._habits(), habitWithUser];
    this._updateHabits(newHabits);
  }

  public updateHabit(habit: Habit): void {
    const user = this._authService.currentUser();
    if (!user) return;

    // Ensure user can only update their own habits
    if (habit.userId && habit.userId !== user.id) {
      console.warn('User cannot update habits that do not belong to them');
      return;
    }

    const habitWithUpdateInfo = {
      ...habit,
      updatedAt: new Date().toISOString(),
      updatedBy: user.username
    };

    const updatedHabits = this._habits().map(item => 
      (item.id === habit.id ? habitWithUpdateInfo : item)
    );
    this._updateHabits(updatedHabits);
  }

  public deleteHabit(id: string): void {
    const user = this._authService.currentUser();
    if (!user) return;

    const habitToDelete = this.getHabit(id);
    if (habitToDelete?.userId && habitToDelete.userId !== user.id) {
      console.warn('User cannot delete habits that do not belong to them');
      return;
    }

    const updatedHabits = this._habits().filter(item => item.id !== id);
    this._updateHabits(updatedHabits);
  }

  public deleteAllHabits(): void {
    const user = this._authService.currentUser();
    if (!user) return;

    // Only delete habits that belong to the current user
    const updatedHabits = this._habits().filter(habit => 
      habit.userId && habit.userId !== user.id
    );
    this._updateHabits(updatedHabits);
  }

  public completeHabit(habit: Habit): void {
    const user = this._authService.currentUser();
    if (!user) return;

    if (habit.userId && habit.userId !== user.id) {
      console.warn('User cannot complete habits that do not belong to them');
      return;
    }

    const updatedHabit = this._markHabitAsCompleted(habit, new Date());
    this.updateHabit(updatedHabit);
  }

  public searchHabit(value?: string | null): void {
    if (!value) {
      this._habits.set(this._initialHabits);
    } else {
      const searchingHabits =
        this._initialHabits.filter(habit =>
          habit.name.toLocaleLowerCase().includes(value.trim().toLocaleLowerCase())
        ) ?? [];
      this._habits.set(searchingHabits);
    }
  }

  public getUserHabitsCount(): number {
    const user = this._authService.currentUser();
    if (!user) return 0;
    
    return this._initialHabits.filter(habit => habit.userId === user.id).length;
  }

  public getUserCompletedHabitsCount(): number {
    const user = this._authService.currentUser();
    if (!user) return 0;
    
    return this._initialHabits.filter(habit => 
      habit.userId === user.id && 
      habit.sprint.some(day => day === true)
    ).length;
  }

  public loadUserHabits(): void {
    const user = this._authService.currentUser();
    if (!user) {
      this._initialHabits = [];
      this._habits.set([]);
      return;
    }

    const allHabits = this._getAllHabitsFromStorage();
    const userHabits = allHabits.filter(habit => 
      !habit.userId || habit.userId === user.id
    );

    this._initialHabits = userHabits;
    this._habits.set(userHabits);
  }

  public clearUserData(): void {
    this._initialHabits = [];
    this._habits.set([]);
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

    return { 
      ...habit, 
      sprint: updatedSprint,
      lastCompletedAt: new Date().toISOString()
    };
  }

  private _updateHabits(newHabits: Habit[]): void {
    const user = this._authService.currentUser();
    if (!user) return;

    const allHabits = this._getAllHabitsFromStorage();
    
    const otherUsersHabits = allHabits.filter(habit => 
      habit.userId && habit.userId !== user.id
    );
    
    const updatedAllHabits = [...otherUsersHabits, ...newHabits];
    
    localStorage.setItem('habits', JSON.stringify(updatedAllHabits));
    
    this._initialHabits = newHabits;
    this._habits.set(newHabits);
  }

  private _getAllHabitsFromStorage(): Habit[] {
    const _jsonHabits = localStorage.getItem('habits');
    return _jsonHabits ? (JSON.parse(_jsonHabits) as Habit[]) : [];
  }
}
