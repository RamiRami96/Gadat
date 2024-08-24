import { Component, inject } from '@angular/core';
import { CreateHabitComponent } from '../create-habit/create-habit.component';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-habit-btn',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './add-habit-btn.component.html',
  styleUrl: './add-habit-btn.component.css',
})
export class AddHabitBtnComponent {
  public readonly dialog = inject(MatDialog);

  createHabbit(): void {
    this.dialog.open(CreateHabitComponent, {
      maxWidth: '80vw',
      maxHeight: '80vh',
      height: '100%',
      width: '100%',
      enterAnimationDuration: '5000',
      exitAnimationDuration: '5000',
    });
  }
}
