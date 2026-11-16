import { DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ALL_WEEKDAYS } from '@shared/constants/app-constants';
import { NAME_MAX, NOTE_MAX, SAVE_ERROR } from '../../constants/habit-constants';
import { QUICK_PICKS } from '../../constants/habit-constants';
import { HabitRow } from '../habit-row';
import { HabitValidators } from '../../services/habit-validators';
import { HabitStore } from '../../stores/habit-store';
import { DaysPicker } from '../days-picker';
import { Button } from '@shared/components/button';
import { Chip } from '@shared/components/chip';
import { Icon } from '@shared/components/icon';

@Component({
  selector: 'app-add-habit-dialog',
  imports: [ReactiveFormsModule, HabitRow, DaysPicker, Button, Chip, Icon],
  templateUrl: './index.html',
})
export class AddHabitDialog {
  private readonly store = inject(HabitStore);
  private readonly validators = inject(HabitValidators);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly nameMax = NAME_MAX;
  protected readonly noteMax = NOTE_MAX;
  protected readonly quickPicks = QUICK_PICKS;
  protected readonly saving = signal(false);
  protected readonly serverError = signal('');

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(NAME_MAX), this.validators.notBlank],
    }),
    note: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(NOTE_MAX)] }),
    days: new FormControl([...ALL_WEEKDAYS], {
      nonNullable: true,
      validators: [this.validators.atLeastOneDay],
    }),
  });

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly nameLength = computed(() => (this.value().name ?? '').length);
  protected readonly noteLength = computed(() => (this.value().note ?? '').length);
  protected readonly previewName = computed(() => (this.value().name ?? '').trim() || 'Your habit');
  protected readonly previewNote = computed(() => (this.value().note ?? '').trim() || null);

  protected pick(name: string): void {
    this.form.controls.name.setValue(name);
    this.form.controls.name.markAsDirty();
  }

  protected close(): void {
    this.ref.close(false);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) return;
    const { name, note, days } = this.form.getRawValue();
    this.saving.set(true);
    this.serverError.set('');
    try {
      await this.store.addHabit({
        name: name.trim(),
        ...(note.trim() ? { note: note.trim() } : {}),
        days: [...days].sort((a, b) => a - b),
      });
      this.ref.close(true);
    } catch (error) {
      const message =
        error instanceof HttpErrorResponse
          ? (error.error?.message as string | undefined)
          : undefined;
      this.serverError.set(message ?? SAVE_ERROR);
      this.saving.set(false);
    }
  }
}
