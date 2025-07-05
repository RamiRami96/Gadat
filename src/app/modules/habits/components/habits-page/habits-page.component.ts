import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { ListHabitComponent } from '../list-habit/list-habit.component';
import { AddHabitBtnComponent } from '../add-habit-btn/add-habit-btn.component';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-habits-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    LayoutComponent,
    ListHabitComponent,
    AddHabitBtnComponent,
  ],
  templateUrl: './habits-page.component.html',
  styleUrl: './habits-page.component.css',
})
export class HabitsPageComponent {
  private _router = inject(Router);
  private _authService = inject(AuthService);

  createNewHabit(): void {
    this._router.navigate(['/habits/create']);
  }

  logout(): void {
    this._authService.logout();
    this._router.navigate(['/']);
  }
}
