import { Component, inject } from '@angular/core';
import { HabitStore } from '@modules/habits';
import { Chip } from '@shared/components/chip';
import { Icon } from '@shared/components/icon';
import { ProgressBar } from '@shared/components/progress-bar';
import { useCalendar } from '../../hooks/use-calendar';
import { CalendarGrid } from '../calendar-grid';

@Component({
  selector: 'app-calendar-card',
  imports: [CalendarGrid, Chip, Icon, ProgressBar],
  templateUrl: './index.html',
  host: { class: 'block' },
})
export class CalendarCard {
  protected readonly store = inject(HabitStore);
  protected readonly calendar = useCalendar();
}
