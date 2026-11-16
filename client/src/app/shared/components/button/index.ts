import { Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const BASE =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-[16px] px-5 text-base font-semibold ' +
  'transition-colors disabled:opacity-50 disabled:pointer-events-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:brightness-110 active:brightness-95',
  secondary: 'border border-line bg-surface text-ink hover:bg-page',
  ghost: 'text-ink underline-offset-4 hover:underline',
};

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[appButton]',
  template: '<ng-content />',
  host: { '[class]': 'classes()' },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');

  protected readonly classes = computed(() => `${BASE} ${VARIANTS[this.variant()]}`);
}
