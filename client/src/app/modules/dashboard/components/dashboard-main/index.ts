import { Dialog } from '@angular/cdk/dialog';
import { Component, inject, OnInit } from '@angular/core';
import { CalendarCard } from '@modules/calendar';
import { AddHabitDialog, HabitStore, StatsTiles, TodayCard } from '@modules/habits';
import { ADD_HABIT_DIALOG } from '../../constants/dashboard-constants';
import { useTodayClock } from '../../hooks/use-today-clock';

@Component({
  selector: 'app-dashboard-main',
  imports: [TodayCard, StatsTiles, CalendarCard],
  templateUrl: './index.html',
  host: { class: 'block' },
})
export class DashboardMain implements OnInit {
  private readonly store = inject(HabitStore);
  private readonly dialog = inject(Dialog);

  constructor() {
    useTodayClock();
  }

  ngOnInit(): void {
    void this.store.load();
  }

  protected retry(): void {
    void this.store.load();
  }

  protected openAdd(trigger: HTMLElement): void {
    this.dialog.open(AddHabitDialog, { ...ADD_HABIT_DIALOG, restoreFocus: trigger });
  }
}
