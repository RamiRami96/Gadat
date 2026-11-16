import { Component, computed, input, output } from '@angular/core';
import { Icon } from '@shared/components/icon';

@Component({
  selector: 'app-habit-row',
  imports: [Icon],
  template: `
    <button
      type="button"
      class="flex min-h-[68px] w-full items-center gap-4 rounded-[16px] border px-4 py-3 text-left transition-colors"
      [class]="
        checked() ? 'border-accent/25 bg-accent-tint' : 'border-line bg-surface hover:bg-page'
      "
      [attr.aria-pressed]="checked()"
      [disabled]="preview()"
      (click)="toggled.emit()"
    >
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border-2 transition-colors"
        [class]="
          checked()
            ? 'border-accent bg-accent text-white'
            : 'border-control bg-surface text-transparent'
        "
        aria-hidden="true"
      >
        <app-icon name="check" [size]="26" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-[17px] font-semibold leading-snug">{{ name() }}</span>
        @if (note()) {
          <span class="block truncate text-[13px] text-muted">{{ note() }}</span>
        }
      </span>
      <span
        class="flex shrink-0 items-center gap-1 text-[15px] font-semibold"
        [class]="flameClass()"
      >
        <app-icon name="flame" [size]="22" />
        <span aria-hidden="true">{{ streak() }}</span>
        <span class="sr-only">{{ streak() }} day streak</span>
      </span>
    </button>
  `,
  host: { class: 'block' },
})
export class HabitRow {
  readonly name = input.required<string>();

  readonly note = input<string | null>(null);

  readonly checked = input(false);

  readonly streak = input(0);

  readonly preview = input(false);

  readonly toggled = output();

  protected readonly flameClass = computed(() =>
    this.streak() > 0 ? 'text-accent' : 'text-muted',
  );
}
