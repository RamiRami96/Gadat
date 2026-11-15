import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  template: `
    <div
      class="w-full overflow-hidden rounded-full bg-track"
      [class]="thin() ? 'h-1.5' : 'h-2.5'"
      role="progressbar"
      aria-valuemin="0"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuenow]="value()"
      [attr.aria-label]="label()"
    >
      <div
        class="h-full rounded-full bg-accent transition-[width] duration-300"
        [style.width.%]="percent()"
      ></div>
    </div>
  `,
  host: { class: 'block' },
})
export class ProgressBar {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly label = input.required<string>();
  readonly thin = input(false);
  protected readonly percent = computed(() =>
    this.max() <= 0 ? 0 : Math.min(100, (this.value() / this.max()) * 100),
  );
}
