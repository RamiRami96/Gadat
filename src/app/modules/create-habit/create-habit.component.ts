import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { HabitService } from '../../shared/services/habit.service';
import { Habit } from '../../shared/models/habit.model';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
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
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
  ],
  templateUrl: './create-habit.component.html',
  styleUrl: './create-habit.component.css',
})
export class CreateHabitComponent implements OnInit, OnDestroy {
  public form: FormGroup;
  public habitTypes = habitTypes;
  public currentHabits: SelectDataModel[] = [];
  private _destroy$ = new Subject<void>();

  constructor(
    private _dialogRef: MatDialogRef<CreateHabitComponent>,
    private _formBuilder: FormBuilder,
    private _habitService: HabitService
  ) {
    this.form = this._formBuilder.group({
      type: ['', Validators.required],
      name: ['', Validators.required],
    });
  }

  createSprint(): void {
    const newHabit: Habit = {
      id: 'id' + Math.random().toString(16).slice(2),
      type: this.form.get('type')?.value,
      name: this.form.get('name')?.value,
      start: new Date(),
      sprint: new Array(7).fill(false) as boolean[],
    };

    this._habitService.createHabit(newHabit);
    this._dialogRef.close();
  }

  ngOnInit() {
    this.form
      .get('type')
      ?.valueChanges.pipe(takeUntil(this._destroy$))
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

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
