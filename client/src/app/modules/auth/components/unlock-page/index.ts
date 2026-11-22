import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from '@shared/components/button';
import { HOME_URL } from '@shared/constants/app-constants';
import { PasskeyService } from '../../services/passkey-service';
import { AuthShell } from '../auth-shell';
import { FingerprintCircle } from '../fingerprint-circle';
import { RecoveryCodeBox } from '../recovery-code-box';
import {
  RECOVERY_CODE_MIN_LENGTH,
  RECOVERY_ERROR_MESSAGES,
  SERVER_UNREACHABLE,
  SUCCESS_DELAY_MS,
  ADD_FINGERPRINT_FAILED,
  FINGERPRINT_STATE,
  TOO_MANY_TRIES,
  UNLOCK_VIEW_FINGERPRINT_STATE,
} from '../../constants/auth-constants';
import type { FingerprintState, UnlockView } from '../../models/auth-models';

@Component({
  selector: 'app-unlock-page',
  imports: [AuthShell, FingerprintCircle, RecoveryCodeBox, FormsModule, RouterLink, Button],
  templateUrl: './index.html',
})
export class UnlockPage {
  private readonly auth = inject(PasskeyService);

  private readonly router = inject(Router);

  protected readonly view = signal<UnlockView>('idle');

  protected readonly code = signal('');

  protected readonly newCode = signal('');

  protected readonly message = signal('');

  protected readonly busy = signal(false);

  private cancelled = false;

  protected readonly circle = computed<FingerprintState>(
    () => UNLOCK_VIEW_FINGERPRINT_STATE[this.view()] ?? FINGERPRINT_STATE.Idle,
  );

  protected readonly canRestore = computed(
    () => this.code().trim().length >= RECOVERY_CODE_MIN_LENGTH && !this.busy(),
  );

  protected async unlock(): Promise<void> {
    this.cancelled = false;
    this.view.set('scanning');
    try {
      await this.auth.login();
      this.view.set('success');
      setTimeout(() => {
        void this.router.navigateByUrl(HOME_URL);
      }, SUCCESS_DELAY_MS);
    } catch (error) {
      this.message.set(
        error instanceof HttpErrorResponse && error.status === HttpStatusCode.TooManyRequests
          ? TOO_MANY_TRIES
          : '',
      );
      this.view.set(this.cancelled ? 'idle' : 'error');
    }
  }

  protected cancel(): void {
    this.cancelled = true;
    this.auth.cancelPrompt();
  }

  protected showRecovery(): void {
    this.message.set('');
    this.view.set('recovery');
  }

  protected async restore(): Promise<void> {
    if (!this.canRestore()) return;
    this.busy.set(true);
    this.message.set('');
    try {
      this.newCode.set(await this.auth.recover(this.code().trim()));
      this.view.set('recovered');
    } catch (error) {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      this.message.set(RECOVERY_ERROR_MESSAGES[status] ?? SERVER_UNREACHABLE);
    } finally {
      this.busy.set(false);
    }
  }

  protected async addFingerprint(): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    try {
      await this.auth.addPasskey();
      await this.router.navigateByUrl(HOME_URL);
    } catch {
      this.message.set(ADD_FINGERPRINT_FAILED);
    } finally {
      this.busy.set(false);
    }
  }

  protected goHome(): void {
    void this.router.navigateByUrl(HOME_URL);
  }
}
