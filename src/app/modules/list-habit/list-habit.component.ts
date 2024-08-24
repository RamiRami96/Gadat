import { Component, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Habit } from '../../shared/models/habit.model';
import { HabitService } from '../../shared/services/habit.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { FilterHabitsComponent } from '../filter-habits/filter-habits.component';

@Component({
  selector: 'app-list-habit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    FilterHabitsComponent,
  ],
  templateUrl: './list-habit.component.html',
  styleUrl: './list-habit.component.css',
})
export class ListHabitComponent implements OnInit {
  public habits = signal<Habit[]>([]);

  constructor(public habitService: HabitService) {}

  ngOnInit() {
    this.habits = this.habitService.habits;
  }

  public searchHabit(event: { value?: string | null }) {
    this.habitService.searchHabit(event.value);
  }

  public showCompleteButton(habit: Habit): boolean {
    const startDate = new Date(habit.start);
    const today = new Date();

    const differenceInTime = today.getTime() - startDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

    const completedCount = habit.sprint.filter(day => day === true).length;

    const isAllSprintCompleted = habit.sprint.every((sprintValue: boolean) => sprintValue);

    return completedCount >= differenceInDays && !isAllSprintCompleted;
  }
}
