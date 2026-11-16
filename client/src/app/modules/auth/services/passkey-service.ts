import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  startAuthentication,
  startRegistration,
  WebAuthnAbortService,
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { firstValueFrom } from 'rxjs';
import { api } from '@shared/services/api-service';
import { AppStore } from '@shared/stores/app-store';

@Injectable({ providedIn: 'root' })
export class PasskeyService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AppStore);

  async register(): Promise<string> {
    const options = await firstValueFrom(
      this.http.post<PublicKeyCredentialCreationOptionsJSON>(api('/auth/register/options'), {}),
    );
    const response = await startRegistration({ optionsJSON: options });
    const result = await firstValueFrom(
      this.http.post<{ recoveryCode: string }>(api('/auth/register/verify'), { response }),
    );
    this.store.signedIn.set(true);
    return result.recoveryCode;
  }

  async login(): Promise<void> {
    const options = await firstValueFrom(
      this.http.post<PublicKeyCredentialRequestOptionsJSON>(api('/auth/login/options'), {}),
    );
    const response = await startAuthentication({ optionsJSON: options });
    await firstValueFrom(this.http.post(api('/auth/login/verify'), { response }));
    this.store.signedIn.set(true);
  }

  async recover(code: string): Promise<string> {
    const result = await firstValueFrom(
      this.http.post<{ recoveryCode: string }>(api('/auth/recovery'), { code }),
    );
    this.store.signedIn.set(true);
    return result.recoveryCode;
  }

  async addPasskey(): Promise<void> {
    const options = await firstValueFrom(
      this.http.post<PublicKeyCredentialCreationOptionsJSON>(api('/auth/credentials/options'), {}),
    );
    const response = await startRegistration({ optionsJSON: options });
    await firstValueFrom(this.http.post(api('/auth/credentials/verify'), { response }));
  }

  cancelPrompt(): void {
    WebAuthnAbortService.cancelCeremony();
  }
}
