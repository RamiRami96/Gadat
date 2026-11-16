import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HabitStore } from '@modules/habits';
import { Icon } from '@shared/components/icon';
import { Logo } from '@shared/components/logo';
import { UNLOCK_URL } from '@shared/constants/app-constants';
import { SessionService } from '@shared/services/session-service';

@Component({
  selector: 'app-dashboard-header',
  imports: [Icon, Logo],
  templateUrl: './index.html',
  host: { class: 'block' },
})
export class DashboardHeader {
  private readonly session = inject(SessionService);

  private readonly store = inject(HabitStore);

  private readonly router = inject(Router);

  protected async logOut(): Promise<void> {
    await this.session.logout().catch(() => undefined);
    this.store.reset();
    await this.router.navigateByUrl(UNLOCK_URL);
  }
}
