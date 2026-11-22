import { Component, computed, input } from '@angular/core';
import { Icon } from '@shared/components/icon';
import { FINGERPRINT_STATE } from '../../constants/auth-constants';
import type { FingerprintState } from '../../models/auth-models';

@Component({
  selector: 'app-fingerprint-circle',
  imports: [Icon],
  template: `
    <div class="relative mx-auto h-[168px] w-[168px]" aria-hidden="true">
      @if (state() === State.Scanning) {
        <span
          class="animate-pulse-ring motion-reduce:animate-none motion-reduce:scale-[1.15] motion-reduce:opacity-35 absolute inset-0 rounded-full border-2 border-accent"
        ></span>
        <span
          class="animate-pulse-ring motion-reduce:animate-none motion-reduce:scale-[1.15] motion-reduce:opacity-35 absolute inset-0 rounded-full border-2 border-accent"
          style="animation-delay: 0.9s"
        ></span>
      }
      <div
        class="relative flex h-full w-full items-center justify-center rounded-full transition-colors duration-300"
        [class]="circleClasses()"
      >
        @switch (state()) {
          @case (State.Success) {
            <app-icon name="check" [size]="72" />
          }
          @case (State.Error) {
            <app-icon name="x" [size]="72" />
          }
          @default {
            <app-icon name="fingerprint" [size]="76" />
          }
        }
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class FingerprintCircle {
  readonly state = input<FingerprintState>(FINGERPRINT_STATE.Idle);

  protected readonly State = FINGERPRINT_STATE;

  protected readonly circleClasses = computed(() => {
    switch (this.state()) {
      case FINGERPRINT_STATE.Success:
        return 'bg-accent text-white';
      case FINGERPRINT_STATE.Error:
        return 'bg-error-bg text-error';
      default:
        return 'bg-accent-tint text-accent border-2 border-accent/30';
    }
  });
}
