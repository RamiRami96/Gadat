import { computed, Directive, input } from '@angular/core';

@Directive({
  selector: 'button[appChip]',
  host: {
    type: 'button',
    '[attr.aria-pressed]': 'selected()',
    '[class]': 'classes()',
  },
})
export class Chip {
  readonly selected = input(false);

  protected readonly classes = computed(
    () =>
      `inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors ${
        this.selected()
          ? 'border-ink bg-ink text-white'
          : 'border-line bg-surface text-ink hover:bg-page'
      }`,
  );
}
