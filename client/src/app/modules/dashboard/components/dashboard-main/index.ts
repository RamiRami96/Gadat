import { Dialog } from '@angular/cdk/dialog';
import { Component, inject, OnInit } from '@angular/core';
import { CalendarCard } from '@modules/calendar';
import { AddHabitDialog, HabitStore, StatsTiles, TodayCard } from '@modules/habits';
import { ADD_HABIT_DIALOG } from '../../constants/dashboard-constants';
import { TodayClockService } from '../../services/today-clock-service';

@Component({
  selector: 'app-dashboard-main',
  imports: [TodayCard, StatsTiles, CalendarCard],
  templateUrl: './index.html',
  providers: [TodayClockService],
  host: { class: 'block' },
})
export class DashboardMain implements OnInit {
  private readonly store = inject(HabitStore);
  private readonly dialog = inject(Dialog);
  private readonly clock = inject(TodayClockService);

  ngOnInit(): void {
    this.clock.start();
    void this.store.load();
  }

  protected retry(): void {
    void this.store.load();
  }

  protected openAdd(trigger: HTMLElement): void {
    this.dialog.open(AddHabitDialog, { ...ADD_HABIT_DIALOG, restoreFocus: trigger });
  }
}
