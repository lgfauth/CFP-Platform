import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By, Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { appRoutes } from './app.routes';
import { CfpDashboardComponent } from './cfp-dashboard/cfp-dashboard';
import { CfpEventComponent } from './cfp-event/cfp-event';
import { CfpSubmissionComponent } from './cfp-submission/cfp-submission';
import { EventRegistrationService } from './event-registration.service';
import { SpeakerSubmissionService } from './speaker-submission.service';

describe('appRoutes and main navigation', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;
  let httpTesting: HttpTestingController;

  const MENU = [
    ['Dashboard', '/'],
    ['Enviar palestra', '/palestras/nova'],
    ['Cadastrar evento', '/eventos/novo'],
  ] as const;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SpeakerSubmissionService, useValue: { submit: () => of() } },
        { provide: EventRegistrationService, useValue: { register: () => of() } },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(App);
    await fixture.whenStable();
  });

  afterEach(() => {
    for (const url of ['/api/speakers', '/api/events']) {
      httpTesting
        .match(url)
        .filter((request) => !request.cancelled)
        .forEach((request) => request.flush([]));
    }
    httpTesting.verify();
  });

  const root = (): HTMLElement => fixture.nativeElement as HTMLElement;

  async function open(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function routed<T>(type: Type<T>): T | null {
    return fixture.debugElement.query(By.directive(type))?.componentInstance ?? null;
  }

  function menu(): HTMLElement {
    return root().querySelector('nav[aria-label="Navegação principal"]') as HTMLElement;
  }

  function menuLink(label: string): HTMLAnchorElement {
    return Array.from(menu().querySelectorAll('a')).find(
      (link) => link.textContent?.trim() === label
    ) as HTMLAnchorElement;
  }

  /** Clicks a link like a user would and reports whether a reload was avoided. */
  async function click(link: HTMLAnchorElement): Promise<{ defaultPrevented: boolean }> {
    expect(link).toBeTruthy();
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    link.dispatchEvent(event);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    return { defaultPrevented: event.defaultPrevented };
  }

  describe('routes', () => {
    it('shows the dashboard on "/"', async () => {
      await open('/');

      expect(routed(CfpDashboardComponent)).toBeInstanceOf(CfpDashboardComponent);
      expect(root().querySelector('main h1')?.textContent?.trim()).toBe('Dashboard');
    });

    it.each(['/dashboard', '/rota/que-nao-existe'])(
      'redirects "%s" to the dashboard on "/"',
      async (url) => {
        await open(url);

        expect(router.url).toBe('/');
        expect(routed(CfpDashboardComponent)).toBeInstanceOf(CfpDashboardComponent);
      }
    );

    it('shows the speaker form on "/palestras/nova"', async () => {
      await open('/palestras/nova');

      expect(router.url).toBe('/palestras/nova');
      expect(routed(CfpSubmissionComponent)).toBeInstanceOf(CfpSubmissionComponent);
      expect(root().querySelector('#speaker-name')).not.toBeNull();
    });

    it('shows the event form on "/eventos/novo"', async () => {
      await open('/eventos/novo');

      expect(router.url).toBe('/eventos/novo');
      expect(routed(CfpEventComponent)).toBeInstanceOf(CfpEventComponent);
      expect(root().querySelector('#event-date')).not.toBeNull();
    });

    it('updates the document title from each route title', async () => {
      const title = TestBed.inject(Title);

      await open('/');
      expect(title.getTitle()).toBe('Dashboard');

      await open('/palestras/nova');
      expect(title.getTitle()).toBe('Proponha sua palestra');

      await open('/eventos/novo');
      expect(title.getTitle()).toBe('Cadastre um evento');
    });
  });

  describe('main menu', () => {
    it.each(['/', '/palestras/nova', '/eventos/novo'])(
      'is present with the three labelled links on "%s"',
      async (url) => {
        await open(url);

        const navs = root().querySelectorAll('nav[aria-label="Navegação principal"]');
        expect(navs).toHaveLength(1);
        expect(menu().closest('header')).not.toBeNull();
        expect(
          Array.from(menu().querySelectorAll('a')).map((link) => [
            link.textContent?.trim(),
            link.getAttribute('href'),
          ])
        ).toEqual(MENU.map(([label, href]) => [label, href]));
      }
    );

    it('navigates between every page without reloading the application', async () => {
      await open('/');
      const shell = root();

      for (const [label, href] of [...MENU].reverse()) {
        const result = await click(menuLink(label));

        expect(result.defaultPrevented).toBe(true);
        expect(router.url).toBe(href);
      }
      expect(routed(CfpDashboardComponent)).toBeInstanceOf(CfpDashboardComponent);

      // Same application root throughout: the page was never reloaded.
      expect(root()).toBe(shell);
    });

    it.each(MENU)(
      'marks only "%s" as the current page on %s',
      async (label, href) => {
        await open(href);

        const current = Array.from(
          menu().querySelectorAll('a[aria-current="page"]')
        ).map((link) => link.textContent?.trim());
        expect(current).toEqual([label]);
        expect(menuLink(label).classList).toContain('is-active');
      }
    );

    it('does not mark Dashboard as current on sub pages', async () => {
      for (const url of ['/palestras/nova', '/eventos/novo']) {
        await open(url);

        expect(menuLink('Dashboard').hasAttribute('aria-current')).toBe(false);
        expect(menuLink('Dashboard').classList).not.toContain('is-active');
      }
    });
  });

  describe('contextual actions', () => {
    it('goes from the speaker form to the dashboard without reloading', async () => {
      await open('/palestras/nova');
      const link = root().querySelector('main .cfp-actions a') as HTMLAnchorElement;
      expect(link.textContent?.trim()).toBe('Ver palestras submetidas');

      const result = await click(link);

      expect(result.defaultPrevented).toBe(true);
      expect(router.url).toBe('/');
      expect(routed(CfpDashboardComponent)).toBeInstanceOf(CfpDashboardComponent);
    });

    it('goes from the dashboard to the speaker form without reloading', async () => {
      await open('/');
      const link = root().querySelector('main .cfp-actions a') as HTMLAnchorElement;
      expect(link.textContent?.trim()).toBe('Enviar nova proposta');
      expect(link.classList).toContain('cfp-button-secondary');

      const result = await click(link);

      expect(result.defaultPrevented).toBe(true);
      expect(router.url).toBe('/palestras/nova');
      expect(routed(CfpSubmissionComponent)).toBeInstanceOf(CfpSubmissionComponent);
    });
  });
});
