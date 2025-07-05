import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-habit-btn',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './add-habit-btn.component.html',
  styleUrl: './add-habit-btn.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddHabitBtnComponent {
  private _router = inject(Router);

  public createHabbit(): void {
    this._router.navigate(['/habits/create']);
  }
}
