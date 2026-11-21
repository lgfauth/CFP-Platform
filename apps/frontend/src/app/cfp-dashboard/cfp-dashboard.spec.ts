import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EventDTO, SpeakerDTO } from '@cfp-platform/shared-types';
import { CfpDashboardComponent, formatEventDate } from './cfp-dashboard';

type Fixture = ComponentFixture<CfpDashboardComponent>;
type SectionName = 'speakers' | 'events';

const SOURCES: Record<SectionName, string> = {
  speakers: '/api/speakers',
  events: '/api/events',
};

describe('CfpDashboardComponent', () => {
  let httpTesting: HttpTestingController;

  const ada: SpeakerDTO = {
    id: 'proposal-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    talkTitle: 'Computação para todas as pessoas',
    isGDE: true,
  };

  const grace: SpeakerDTO = {
    id: 'proposal-2',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    talkTitle: 'Compiladores e a arte de depurar',
    isGDE: false,
  };

  const devFest: EventDTO = {
    id: 'event-1',
    name: 'DevFest Sul',
    address: 'Av. Ipiranga, 6681 - Porto Alegre, RS',
    date: '2027-03-05',
  };

  const tdc: EventDTO = {
    id: 'event-2',
    name: 'TDC Florianópolis',
    address: 'Centro de Eventos, Florianópolis, SC',
    date: '2026-12-31',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CfpDashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Settle whichever source a test left pending, then verify nothing else.
    Object.values(SOURCES).forEach((url) =>
      httpTesting
        .match(url)
        .filter((request) => !request.cancelled)
        .forEach((request) => request.flush([]))
    );
    httpTesting.verify();
  });

  async function render(): Promise<Fixture> {
    const fixture = TestBed.createComponent(CfpDashboardComponent);
    await fixture.whenStable();
    return fixture;
  }

  function section(fixture: Fixture, name: SectionName): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      `#${name}-section`
    ) as HTMLElement;
  }

  function query<T extends Element = HTMLElement>(
    fixture: Fixture,
    name: SectionName,
    selector: string
  ): T | null {
    return section(fixture, name).querySelector<T>(selector);
  }

  function contentArea(fixture: Fixture, name: SectionName): HTMLElement {
    return query(fixture, name, '.dashboard-content') as HTMLElement;
  }

  function rows(fixture: Fixture, name: SectionName): (string | undefined)[][] {
    return Array.from(section(fixture, name).querySelectorAll('tbody tr')).map(
      (row) =>
        Array.from(row.querySelectorAll('td')).map((td) =>
          td.textContent?.trim()
        )
    );
  }

  async function respond(
    fixture: Fixture,
    name: SectionName,
    body: SpeakerDTO[] | EventDTO[]
  ): Promise<void> {
    httpTesting.expectOne(SOURCES[name]).flush(body);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function respondWithError(
    fixture: Fixture,
    name: SectionName
  ): Promise<void> {
    httpTesting
      .expectOne(SOURCES[name])
      .flush(
        { message: 'database exploded at line 42' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    fixture.detectChanges();
    await fixture.whenStable();
  }

  describe('layout', () => {
    it('titles the page "Dashboard" with one labelled section per listing', async () => {
      const fixture = await render();
      const root = fixture.nativeElement as HTMLElement;

      expect(root.querySelector('h1')?.textContent?.trim()).toBe('Dashboard');
      for (const [name, title] of [
        ['speakers', 'Palestras submetidas'],
        ['events', 'Eventos cadastrados'],
      ] as const) {
        const element = section(fixture, name);
        const heading = element.querySelector('h2') as HTMLElement;
        expect(element.tagName).toBe('SECTION');
        expect(heading.textContent?.trim()).toBe(title);
        expect(element.getAttribute('aria-labelledby')).toBe(heading.id);
      }
    });
  });

  describe('speakers state', () => {
    it('requests GET /api/speakers on creation and starts loading with an empty list', async () => {
      const fixture = await render();
      const component = fixture.componentInstance;

      const request = httpTesting.expectOne('/api/speakers');
      expect(request.request.method).toBe('GET');
      expect(component.status()).toBe('loading');
      expect(component.speakers()).toEqual([]);
      expect(component.isLoading()).toBe(true);
      expect(component.hasError()).toBe(false);
      expect(component.isEmpty()).toBe(false);
      request.flush([]);
    });

    it('fills the list and becomes ready on success', async () => {
      const fixture = await render();
      await respond(fixture, 'speakers', [ada, grace]);
      const component = fixture.componentInstance;

      expect(component.status()).toBe('ready');
      expect(component.speakers()).toEqual([ada, grace]);
      expect(component.isLoading()).toBe(false);
      expect(component.isEmpty()).toBe(false);
    });

    it('keeps the list empty and becomes error on failure', async () => {
      const fixture = await render();
      await respondWithError(fixture, 'speakers');
      const component = fixture.componentInstance;

      expect(component.status()).toBe('error');
      expect(component.speakers()).toEqual([]);
      expect(component.hasError()).toBe(true);
      expect(component.isLoading()).toBe(false);
    });

    it('cancels both pending requests when the component is destroyed', async () => {
      const fixture = await render();
      const speakers = httpTesting.expectOne('/api/speakers');
      const events = httpTesting.expectOne('/api/events');

      fixture.destroy();

      expect(speakers.cancelled).toBe(true);
      expect(events.cancelled).toBe(true);
    });
  });

  describe('speakers table', () => {
    it('renders one row per submission with its four values', async () => {
      const fixture = await render();
      await respond(fixture, 'speakers', [ada, grace]);

      const region = query(fixture, 'speakers', '[role="region"]') as HTMLElement;
      expect(region.getAttribute('aria-labelledby')).toBe('speakers-title');
      expect(region.getAttribute('tabindex')).toBe('0');
      expect(
        query(fixture, 'speakers', 'table caption')?.textContent?.trim()
      ).not.toBe('');

      const headers = Array.from(
        region.querySelectorAll<HTMLTableCellElement>('thead th')
      );
      expect(headers.map((th) => th.textContent?.trim())).toEqual([
        'Palestra',
        'Palestrante',
        'Email',
        'GDE',
      ]);
      expect(headers.every((th) => th.getAttribute('scope') === 'col')).toBe(
        true
      );
      expect(rows(fixture, 'speakers')).toEqual([
        [ada.talkTitle, ada.name, ada.email, 'Sim'],
        [grace.talkTitle, grace.name, grace.email, 'Não'],
      ]);
    });

    it('distinguishes GDE true and false by text, with a badge on "Sim"', async () => {
      const fixture = await render();
      await respond(fixture, 'speakers', [ada, grace]);

      const [gdeCell, nonGdeCell] = Array.from(
        section(fixture, 'speakers').querySelectorAll('tbody tr td:last-child')
      );
      expect(gdeCell.textContent?.trim()).toBe('Sim');
      expect(gdeCell.querySelector('.gde-badge')?.textContent?.trim()).toBe(
        'Sim'
      );
      expect(nonGdeCell.textContent?.trim()).toBe('Não');
      expect(nonGdeCell.querySelector('.gde-badge')).toBeNull();
    });
  });

  describe('speakers states area', () => {
    it('marks the area busy and announces loading while pending', async () => {
      const fixture = await render();

      expect(contentArea(fixture, 'speakers').getAttribute('aria-busy')).toBe(
        'true'
      );
      expect(
        query(fixture, 'speakers', '[role="status"]')?.textContent?.trim()
      ).toBe('Carregando palestras…');
      expect(query(fixture, 'speakers', 'table')).toBeNull();
    });

    it('removes the loading indicator once the response arrives', async () => {
      const fixture = await render();
      await respond(fixture, 'speakers', [ada]);

      expect(contentArea(fixture, 'speakers').hasAttribute('aria-busy')).toBe(
        false
      );
      expect(section(fixture, 'speakers').textContent).not.toContain(
        'Carregando palestras…'
      );
    });

    it('removes the loading indicator when the request fails', async () => {
      const fixture = await render();
      await respondWithError(fixture, 'speakers');

      expect(contentArea(fixture, 'speakers').hasAttribute('aria-busy')).toBe(
        false
      );
      expect(section(fixture, 'speakers').textContent).not.toContain(
        'Carregando palestras…'
      );
    });

    it('shows an explicit empty message instead of a table', async () => {
      const fixture = await render();
      await respond(fixture, 'speakers', []);

      expect(fixture.componentInstance.isEmpty()).toBe(true);
      expect(
        query(fixture, 'speakers', '[role="status"]')?.textContent?.trim()
      ).toBe('Ainda não há palestras submetidas.');
      expect(query(fixture, 'speakers', 'table')).toBeNull();
    });

    it('announces a stable error via role="alert" without a table or technical details', async () => {
      const fixture = await render();
      await respondWithError(fixture, 'speakers');

      const alert = query(fixture, 'speakers', '[role="alert"]') as HTMLElement;
      expect(alert.textContent?.trim()).toBe(
        'Não foi possível carregar as palestras. Tente novamente mais tarde.'
      );
      expect(section(fixture, 'speakers').textContent).not.toContain('500');
      expect(section(fixture, 'speakers').textContent).not.toContain('database');
      expect(query(fixture, 'speakers', 'table')).toBeNull();
      expect(query(fixture, 'speakers', '[role="status"]')).toBeNull();
    });
  });

  describe('events', () => {
    it('requests GET /api/events on creation and starts loading', async () => {
      const fixture = await render();
      const component = fixture.componentInstance;

      const request = httpTesting.expectOne('/api/events');
      expect(request.request.method).toBe('GET');
      expect(component.eventsStatus()).toBe('loading');
      expect(component.events()).toEqual([]);
      expect(component.eventsLoading()).toBe(true);
      expect(contentArea(fixture, 'events').getAttribute('aria-busy')).toBe(
        'true'
      );
      expect(
        query(fixture, 'events', '[role="status"]')?.textContent?.trim()
      ).toBe('Carregando eventos…');
      expect(query(fixture, 'events', 'table')).toBeNull();
    });

    it('renders one row per event, in API order, with name, address and date', async () => {
      const fixture = await render();
      await respond(fixture, 'events', [devFest, tdc]);

      expect(fixture.componentInstance.eventsStatus()).toBe('ready');
      expect(contentArea(fixture, 'events').hasAttribute('aria-busy')).toBe(
        false
      );

      const region = query(fixture, 'events', '[role="region"]') as HTMLElement;
      expect(region.getAttribute('aria-labelledby')).toBe('events-title');
      expect(region.getAttribute('tabindex')).toBe('0');
      expect(
        query(fixture, 'events', 'table caption')?.textContent?.trim()
      ).not.toBe('');

      const headers = Array.from(
        region.querySelectorAll<HTMLTableCellElement>('thead th')
      );
      expect(headers.map((th) => th.textContent?.trim())).toEqual([
        'Evento',
        'Endereço',
        'Data',
      ]);
      expect(headers.every((th) => th.getAttribute('scope') === 'col')).toBe(
        true
      );
      expect(rows(fixture, 'events')).toEqual([
        [devFest.name, devFest.address, '05/03/2027'],
        [tdc.name, tdc.address, '31/12/2026'],
      ]);
    });

    it('shows the date as DD/MM/AAAA with the ISO value in a <time> element', async () => {
      const fixture = await render();
      await respond(fixture, 'events', [devFest]);

      const time = query(fixture, 'events', 'tbody time') as HTMLTimeElement;
      expect(time.textContent?.trim()).toBe('05/03/2027');
      expect(time.getAttribute('datetime')).toBe('2027-03-05');
    });

    it('shows an explicit empty message instead of a table', async () => {
      const fixture = await render();
      await respond(fixture, 'events', []);

      expect(fixture.componentInstance.eventsEmpty()).toBe(true);
      expect(
        query(fixture, 'events', '[role="status"]')?.textContent?.trim()
      ).toBe('Ainda não há eventos cadastrados.');
      expect(query(fixture, 'events', 'table')).toBeNull();
    });

    it('announces a stable error without technical details or partial data', async () => {
      const fixture = await render();
      await respondWithError(fixture, 'events');

      expect(fixture.componentInstance.eventsError()).toBe(true);
      expect(fixture.componentInstance.events()).toEqual([]);
      expect(contentArea(fixture, 'events').hasAttribute('aria-busy')).toBe(
        false
      );
      const alert = query(fixture, 'events', '[role="alert"]') as HTMLElement;
      expect(alert.textContent?.trim()).toBe(
        'Não foi possível carregar os eventos. Tente novamente mais tarde.'
      );
      expect(section(fixture, 'events').textContent).not.toContain('database');
      expect(query(fixture, 'events', 'table')).toBeNull();
      expect(query(fixture, 'events', '[role="status"]')).toBeNull();
    });

    it('keeps showing speakers when only the events request fails', async () => {
      const fixture = await render();
      await respond(fixture, 'speakers', [ada]);
      await respondWithError(fixture, 'events');

      expect(rows(fixture, 'speakers')).toEqual([
        [ada.talkTitle, ada.name, ada.email, 'Sim'],
      ]);
      expect(query(fixture, 'speakers', '[role="alert"]')).toBeNull();
      expect(query(fixture, 'events', '[role="alert"]')).not.toBeNull();
    });

    it('keeps showing events when only the speakers request fails', async () => {
      const fixture = await render();
      await respondWithError(fixture, 'speakers');
      await respond(fixture, 'events', [devFest]);

      expect(rows(fixture, 'events')).toEqual([
        [devFest.name, devFest.address, '05/03/2027'],
      ]);
      expect(query(fixture, 'events', '[role="alert"]')).toBeNull();
      expect(query(fixture, 'speakers', '[role="alert"]')).not.toBeNull();
    });
  });

  describe('formatEventDate', () => {
    it.each([
      ['2027-03-05', '05/03/2027'],
      ['2026-12-31', '31/12/2026'],
      ['2028-02-29', '29/02/2028'],
    ])('formats %s as %s', (iso, formatted) => {
      expect(formatEventDate(iso)).toBe(formatted);
    });
  });
});
