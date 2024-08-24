import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { ListHabitComponent } from './modules/list-habit/list-habit.component';
import { CreateHabitComponent } from './modules/create-habit/create-habit.component';
import { AddHabitBtnComponent } from './modules/add-habit-btn/add-habit-btn.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutComponent, ListHabitComponent, CreateHabitComponent, AddHabitBtnComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
