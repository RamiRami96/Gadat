import { Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <span class="inline-flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r="14" fill="none" stroke="var(--track)" stroke-width="4" />
        <path
          d="M16 2a14 14 0 1 1-9.9 4.1"
          fill="none"
          stroke="var(--accent)"
          stroke-width="4"
          stroke-linecap="round"
        />
        <path
          d="m10.5 16.5 3.8 3.8 7.2-7.6"
          fill="none"
          stroke="var(--accent)"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="logo-text text-[26px] leading-none text-ink">Gӓdӓt</span>
    </span>
  `,
  styles: `
    .logo-text {
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 700;
      letter-spacing: -0.04em;
    }
  `,
})
export class Logo {}
