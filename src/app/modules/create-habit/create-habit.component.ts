import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HabitService } from '../../shared/services/habit.service';
import { Habit } from '../../shared/models/habit.model';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { v4 as uuidv4 } from 'uuid';
import { SelectDataModel } from '../../shared/models/selectedData.model';
import { habitTypes, healthHabits, jobHabits, relationshipHabits } from '../../shared/const/habitTypes.const';

@Component({
  selector: 'app-create-habit',
  standalone: true,
  imports: [
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogTitle,
    MatDialogContent,
  ],
  templateUrl: './create-habit.component.html',
  styleUrl: './create-habit.component.css',
})
export class CreateHabitComponent implements OnInit {
  public form: FormGroup;
  public habitTypes = habitTypes;
  public currentHabits: SelectDataModel[] = [];
  private destroyRef = inject(DestroyRef);
  private _dialogRef = inject(MatDialogRef<CreateHabitComponent>);
  private _formBuilder = inject(FormBuilder);
  private _habitService = inject(HabitService);

  constructor() {
    this.form = this._formBuilder.group({
      type: ['', Validators.required],
      name: ['', Validators.required],
    });
  }

  createHabit(): void {
    const newHabit: Habit = {
      id: uuidv4(),
      type: this.form.get('type')?.value,
      name: this.form.get('name')?.value,
      start: new Date(),
      sprint: new Array(7).fill(false) as boolean[],
    };

    this._habitService.createHabit(newHabit);
    this._dialogRef.close();
  }
  ngOnInit(): void {
    this.form
      .get('type')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(sphere => {
        switch (sphere) {
          case 'Health':
            this.currentHabits = healthHabits;
            break;
          case 'Job':
            this.currentHabits = jobHabits;
            break;
          case 'Relationships':
            this.currentHabits = relationshipHabits;
            break;
          default:
            break;
        }
      });
  }
}
