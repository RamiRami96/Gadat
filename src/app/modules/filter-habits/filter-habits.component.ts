import { Component, EventEmitter, Output, OnInit, DestroyRef, inject } from '@angular/core';
import { debounceTime, tap } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-filter-habits',
  standalone: true,
  imports: [MatInputModule, MatProgressSpinnerModule, ReactiveFormsModule],
  templateUrl: './filter-habits.component.html',
  styleUrl: './filter-habits.component.css',
})
export class FilterHabitsComponent implements OnInit {
  @Output() searchHabits = new EventEmitter<{ value?: string | null }>();
  public searchControl = new FormControl('');
  public isLoading = false;
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        tap(() => (this.isLoading = true)),
        tap(value => {
          this.searchHabits.emit({ value });
          this.isLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
