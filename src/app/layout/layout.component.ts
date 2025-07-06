import { Component, ChangeDetectionStrategy, inject, OnInit, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../modules/auth/services/auth.service';
import { HabitService } from '../modules/habits/services/habit.service';
import { User } from '../modules/auth/models/auth.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatDividerModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit {
  private readonly _authService = inject(AuthService);
  private readonly _habitService = inject(HabitService);
  private readonly _router = inject(Router);

  get currentUser(): Signal<User | null> {
    return this._authService.currentUser;
  }

  get isAuthenticated(): Signal<boolean> {
    return this._authService.isAuthenticated;
  }

  public userHabitsCount: Signal<number> = computed(() => {
    const user = this._authService.currentUser();
    const habits = this._habitService.habits();
    if (!user) return 0;
    return habits.filter(habit => habit.userId === user.id).length;
  });

  public userCompletedHabitsCount: Signal<number> = computed(() => {
    const user = this._authService.currentUser();
    const habits = this._habitService.habits();
    if (!user) return 0;
    return habits.filter(habit => habit.userId === user.id && habit.sprint.some(day => day === true)).length;
  });

  get timeUntilExpiry(): Signal<number> {
    return this._authService.timeUntilExpiry;
  }

  ngOnInit(): void {
    if (this.isAuthenticated()) {
      this._habitService.loadUserHabits();
    }
  }

  public logout(): void {
    this._habitService.clearUserData();
    this._authService.logout();
    this._router.navigate(['/login']);
  }

  public formatTimeRemaining(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
