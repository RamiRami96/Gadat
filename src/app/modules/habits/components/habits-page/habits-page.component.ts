import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ListHabitComponent } from '../list-habit/list-habit.component';
import { AddHabitBtnComponent } from '../add-habit-btn/add-habit-btn.component';
import { AuthService } from '../../../auth/services/auth.service';
import { HabitService } from '../../services/habit.service';
import { LayoutComponent } from '../../../../layout/layout.component';

@Component({
  selector: 'app-habits-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    LayoutComponent,
    ListHabitComponent,
    AddHabitBtnComponent,
  ],
  templateUrl: './habits-page.component.html',
  styleUrl: './habits-page.component.css',
})
export class HabitsPageComponent implements OnInit {
  private _router = inject(Router);
  private _authService = inject(AuthService);
  private _habitService = inject(HabitService);

  ngOnInit() {
    if (!this._authService.checkSessionValidity()) {
      this._router.navigate(['/login']);
      return;
    }
    
    this._habitService.loadUserHabits();
  }

  createNewHabit(): void {
    this._router.navigate(['/habits/create']);
  }

  logout(): void {
    this._habitService.clearUserData();
    this._authService.logout();
    this._router.navigate(['/']);
  }
}
