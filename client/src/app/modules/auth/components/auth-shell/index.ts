import { Component } from '@angular/core';
import { Logo } from '@shared/components/logo';

@Component({
  selector: 'app-auth-shell',
  imports: [Logo],
  template: `
    <main class="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <app-logo />
      <section
        class="anim-page-in w-full max-w-[440px] rounded-[24px] border border-line bg-surface p-6 shadow-sm sm:p-8"
      >
        <ng-content />
      </section>
      <ng-content select="[footer]" />
    </main>
  `,
})
export class AuthShell {}
