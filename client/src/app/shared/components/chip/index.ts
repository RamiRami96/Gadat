import { Component, computed, input } from '@angular/core';

/** A fully round filter chip. The selected one is dark with white text. */
@Component({
  // Attribute selector on purpose: it styles a native <button> instead of wrapping it.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[appChip]',
  template: '<ng-content />',
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
      'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors ' +
      (this.selected()
        ? 'border-ink bg-ink text-white'
        : 'border-line bg-surface text-ink hover:bg-page'),
  );
}
