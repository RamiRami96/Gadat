import { Component, Input, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Habit } from '../../shared/models/habit.model';
import { HabitService } from '../../shared/services/habit.service';

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [MatCardModule, MatCheckboxModule, MatButtonModule],
  templateUrl: './habit-card.component.html',
  styleUrl: './habit-card.component.css',
})
export class HabitCardComponent {
  @Input({ required: true }) habit!: Habit;
  private _today: Date = new Date();
  private _router = inject(Router);
  public habitService = inject(HabitService);

  public showCompleteButton(habit: Habit): boolean {
    const startDate = new Date(habit.start);

    const differenceInTime = this._today.getTime() - startDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

    const completedCount = habit.sprint.filter(day => day === true).length;

    const isAllSprintCompleted = habit.sprint.every((sprintValue: boolean) => sprintValue);

    return completedCount >= differenceInDays && !isAllSprintCompleted;
  }

  public editHabit(habitId: string): void {
    this._router.navigate(['/habits/edit', habitId]);
  }
}
