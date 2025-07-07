import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HabitService } from '../../services/habit.service';
import { Habit, HabitType, HabitName } from '../../models/habit.model';
import { CanDeactivateComponent } from '../../guards/can-deactivate.guard';
import { v4 as uuidv4 } from 'uuid';
import { habitTypes, healthHabits, jobHabits, relationshipHabits } from '../../constants/habitTypes.const';

@Component({
  selector: 'app-habit-form',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './habit-form.component.html',
  styleUrl: './habit-form.component.css',
})
export class HabitFormComponent implements OnInit, CanDeactivateComponent {
  public habitType = signal<string>('');
  public habitName = signal<string>('');
  public habitTypes = habitTypes;

  public currentHabits = computed(() => {
    const type = this.habitType().toLowerCase();

    switch (type) {
      case 'health':
        return healthHabits;
      case 'job':
        return jobHabits;
      case 'relationship':
        return relationshipHabits;
      default:
        return [];
    }
  });

  public isEditing = false;
  public isDialogMode = false;
  private habitId: string | null = null;
  public originalFormValue = signal<any>({});

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private habitService: HabitService
  ) {}

  ngOnInit(): void {
    this.habitId = this.route.snapshot.paramMap.get('id');
    this.isEditing = !!this.habitId;

    if (this.isEditing && this.habitId) {
      const habit = this.habitService.getHabit(this.habitId);
      if (habit) {
        this.habitType.set(habit.type);
        this.habitName.set(habit.name);
      }
    }

    this.originalFormValue.set({ type: this.habitType(), name: this.habitName() });
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      if (this.isEditing && this.habitId) {
        const existingHabit = this.habitService.getHabit(this.habitId);
        if (existingHabit) {
          const updatedHabit: Habit = {
            ...existingHabit,
            type: this.habitType() as HabitType,
            name: this.habitName() as HabitName,
          };
          this.habitService.updateHabit(updatedHabit);
        }
      } else {
        const newHabit: Habit = {
          id: uuidv4(),
          type: this.habitType() as HabitType,
          name: this.habitName() as HabitName,
          start: new Date(),
          sprint: new Array(7).fill(false) as boolean[],
        };
        this.habitService.createHabit(newHabit);
      }

      this.originalFormValue.set({ type: this.habitType(), name: this.habitName() });

      this.router.navigate(['/habits']);
    }
  }

  public isFormValid(): boolean {
    return this.habitType() !== '' && this.habitName() !== '';
  }

  cancel(): void {
    this.router.navigate(['/habits']);
  }

  canDeactivate(): boolean {
    if (this.isDialogMode) {
      return true;
    }

    const currentFormValue = { type: this.habitType(), name: this.habitName() };
    if (this.hasFormChanged() && !this.formValuesEqual(this.originalFormValue(), currentFormValue)) {
      return confirm('You have unsaved changes. Are you sure you want to leave?');
    }
    return true;
  }

  private hasFormChanged(): boolean {
    const currentFormValue = { type: this.habitType(), name: this.habitName() };
    return !this.formValuesEqual(this.originalFormValue(), currentFormValue);
  }

  private formValuesEqual(value1: any, value2: any): boolean {
    return JSON.stringify(value1) === JSON.stringify(value2);
  }

  onTypeChange(type: string): void {
    this.habitType.set(type);
    this.habitName.set('');
  }

  onNameChange(name: string): void {
    this.habitName.set(name);
  }
}
