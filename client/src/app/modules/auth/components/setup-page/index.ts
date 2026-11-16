import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '@shared/components/button';
import { Icon } from '@shared/components/icon';
import { HOME_URL } from '@shared/constants/app-constants';
import { PasskeyService } from '../../services/passkey-service';
import { AuthShell } from '../auth-shell';
import { FingerprintCircle } from '../fingerprint-circle';
import { RecoveryCodeBox } from '../recovery-code-box';
import {
  SETUP_FAILED,
  TOO_MANY_TRIES,
  SETUP_BENEFITS,
  SETUP_STEPS,
} from '../../constants/auth-constants';
import type { SetupStep } from '../../models/auth-models';

@Component({
  selector: 'app-setup-page',
  imports: [AuthShell, FingerprintCircle, RecoveryCodeBox, Button, Icon],
  templateUrl: './index.html',
})
export class SetupPage {
  private readonly auth = inject(PasskeyService);

  private readonly router = inject(Router);

  protected readonly step = signal<SetupStep>(1);

  protected readonly recoveryCode = signal('');

  protected readonly saved = signal(false);

  protected readonly error = signal('');

  protected readonly steps = SETUP_STEPS;

  protected readonly benefits = SETUP_BENEFITS;

  protected readonly circle = computed(() => (this.step() === 2 ? 'scanning' : 'idle'));

  private cancelled = false;

  protected async start(): Promise<void> {
    this.cancelled = false;
    this.error.set('');
    this.step.set(2);
    try {
      this.recoveryCode.set(await this.auth.register());
      this.step.set(3);
    } catch (error) {
      this.step.set(1);
      if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.TooManyRequests) {
        this.error.set(TOO_MANY_TRIES);
      } else if (!this.cancelled) {
        this.error.set(SETUP_FAILED);
      }
    }
  }

  protected cancel(): void {
    this.cancelled = true;
    this.auth.cancelPrompt();
  }

  protected open(): void {
    void this.router.navigateByUrl(HOME_URL);
  }
}
