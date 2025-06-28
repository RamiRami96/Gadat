import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { debounceTime, Subject, takeUntil, tap } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-filter-habits',
  standalone: true,
  imports: [MatInputModule, MatProgressSpinnerModule, ReactiveFormsModule],
  templateUrl: './filter-habits.component.html',
  styleUrl: './filter-habits.component.css',
})
export class FilterHabitsComponent implements OnInit, OnDestroy {
  @Output() searchHabits = new EventEmitter<{ value?: string | null }>();
  public searchControl = new FormControl('');
  public isLoading = false;
  private _destroy$ = new Subject<void>();

  ngOnInit() {
    this.searchControl.valueChanges
      .pipe(
        takeUntil(this._destroy$),
        debounceTime(500),
        tap(() => (this.isLoading = true)),
        tap(value => {
          this.searchHabits.emit({ value });
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
