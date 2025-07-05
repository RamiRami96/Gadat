import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HabitService } from '../../shared/services/habit.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FilterHabitsComponent } from '../filter-habits/filter-habits.component';
import { HabitCardComponent } from '../habit-card/habit-card.component';

@Component({
  selector: 'app-list-habit',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, FilterHabitsComponent, HabitCardComponent],
  templateUrl: './list-habit.component.html',
  styleUrl: './list-habit.component.css',
})
export class ListHabitComponent {
  public habitService = inject(HabitService);
  public habits = this.habitService.habits;

  public searchHabit(event: { value?: string | null }) {
    this.habitService.searchHabit(event.value);
  }
}
