import { Component } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { DashboardHeader } from '../dashboard-header';
import { DashboardMain } from '../dashboard-main';

@Component({
  selector: 'app-dashboard-page',
  imports: [DashboardHeader, DashboardMain],
  templateUrl: './index.html',
})
export class DashboardPage {
  protected readonly exportUrl = `${environment.apiBase}/export`;
}
