import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class HabitValidators {
  readonly notBlank = (control: AbstractControl<string>): ValidationErrors | null =>
    control.value.trim().length === 0 ? { blank: true } : null;

  readonly atLeastOneDay = (control: AbstractControl<number[]>): ValidationErrors | null =>
    control.value.length === 0 ? { noDays: true } : null;
}
