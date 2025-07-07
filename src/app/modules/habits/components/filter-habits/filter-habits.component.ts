import { Component, EventEmitter, Output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-filter-habits',
  standalone: true,
  imports: [MatInputModule, MatProgressSpinnerModule],
  templateUrl: './filter-habits.component.html',
  styleUrl: './filter-habits.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterHabitsComponent {
  @Output() searchHabits = new EventEmitter<{ value?: string | null }>();
  public searchValue = signal<string>('');
  public isLoading = signal<boolean>(false);

  constructor() {
    effect(
      onCleanup => {
        const value = this.searchValue();

        if (value.trim()) {
          this.isLoading.set(true);
        }

        const timeoutId = setTimeout(() => {
          this.searchHabits.emit({ value });
          this.isLoading.set(false);
        }, 500);

        onCleanup(() => {
          clearTimeout(timeoutId);
          this.isLoading.set(false);
        });
      },
      { allowSignalWrites: true }
    );
  }

  public onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchValue.set(target.value);
  }
}
