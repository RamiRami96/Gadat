import { Component, input, signal } from '@angular/core';
import { Button } from '@shared/components/button';
import { Icon } from '@shared/components/icon';

/** Shows a recovery code in a dashed box with a Copy button. */
@Component({
  selector: 'app-recovery-code-box',
  imports: [Button, Icon],
  template: `
    <div class="rounded-[16px] border-2 border-dashed border-control bg-page px-4 py-5 text-center">
      <p
        class="select-all font-mono text-[22px] font-semibold tracking-wider text-ink"
        data-testid="recovery-code"
      >
        {{ code() }}
      </p>
    </div>
    <button appButton variant="secondary" type="button" class="mt-3 w-full" (click)="copy()">
      <app-icon name="copy" [size]="18" />
      {{ copied() ? 'Copied' : 'Copy code' }}
    </button>
  `,
  host: { class: 'block' },
})
export class RecoveryCodeBox {
  readonly code = input.required<string>();
  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // The code is selectable on screen, so the user can still copy it by hand.
    }
  }
}
