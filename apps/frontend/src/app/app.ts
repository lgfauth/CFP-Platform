import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="cfp-header">
      <span class="cfp-brand">Call for Papers</span>
      <nav class="cfp-nav" aria-label="Navegação principal">
        <a
          routerLink="/"
          routerLinkActive="is-active"
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="{ exact: true }"
          >Dashboard</a
        >
        <a
          routerLink="/palestras/nova"
          routerLinkActive="is-active"
          ariaCurrentWhenActive="page"
          >Enviar palestra</a
        >
        <a
          routerLink="/eventos/novo"
          routerLinkActive="is-active"
          ariaCurrentWhenActive="page"
          >Cadastrar evento</a
        >
      </nav>
    </header>
    <router-outlet />
  `,
})
export class App {}
