import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDTO } from '@cfp-platform/shared-types';
import { Subject, throwError } from 'rxjs';
import { EventRegistrationService } from '../event-registration.service';
import { CfpEventComponent } from './cfp-event';

describe('CfpEventComponent', () => {
  const register = jest.fn();

  beforeEach(async () => {
    // Freeze only the clock (2026-11-21, 10:00 local) so Angular's scheduling
    // keeps using real timers.
    jest.useFakeTimers({
      now: new Date(2026, 10, 21, 10, 0),
      doNotFake: [
        'hrtime',
        'nextTick',
        'performance',
        'queueMicrotask',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'requestIdleCallback',
        'cancelIdleCallback',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
    });
    register.mockReset();

    await TestBed.configureTestingModule({
      imports: [CfpEventComponent],
      providers: [{ provide: EventRegistrationService, useValue: { register } }],
    }).compileComponents();
  });

  afterEach(() => jest.useRealTimers());

  async function render(): Promise<ComponentFixture<CfpEventComponent>> {
    const fixture = TestBed.createComponent(CfpEventComponent);
    await fixture.whenStable();
    return fixture;
  }

  function control(
    fixture: ComponentFixture<CfpEventComponent>,
    selector: string
  ): HTMLInputElement {
    return fixture.nativeElement.querySelector(selector) as HTMLInputElement;
  }

  function input(
    fixture: ComponentFixture<CfpEventComponent>,
    selector: string,
    value: string
  ): void {
    const element = control(fixture, selector);
    element.value = value;
    element.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function blur(fixture: ComponentFixture<CfpEventComponent>, selector: string) {
    control(fixture, selector).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function submitButton(
    fixture: ComponentFixture<CfpEventComponent>
  ): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
  }

  function fillValidForm(fixture: ComponentFixture<CfpEventComponent>): void {
    input(fixture, '#event-name', '  DevFest Sul  ');
    input(fixture, '#event-address', '  Av. Ipiranga, 6681 - Porto Alegre  ');
    input(fixture, '#event-date', '2026-11-22');
  }

  it('starts idle, empty and with a disabled submit button', async () => {
    const fixture = await render();
    const component = fixture.componentInstance;

    expect(component.event()).toEqual({ name: '', address: '', date: '' });
    expect(component.submissionStatus()).toBe('idle');
    expect(component.canSubmit()).toBe(false);
    expect(submitButton(fixture).disabled).toBe(true);
  });

  it('renders labelled required controls with a native datepicker', async () => {
    const fixture = await render();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLLabelElement>
    ).map((label) => [label.htmlFor, label.textContent?.trim()]);

    expect(labels).toEqual([
      ['event-name', 'Nome'],
      ['event-address', 'Endereço'],
      ['event-date', 'Data'],
    ]);
    expect(control(fixture, '#event-date').type).toBe('date');
    for (const id of ['#event-name', '#event-address', '#event-date']) {
      expect(control(fixture, id).required).toBe(true);
    }
  });

  it('limits the datepicker to dates from tomorrow on', async () => {
    const fixture = await render();

    expect(control(fixture, '#event-date').min).toBe('2026-11-22');
  });

  it.each<[string, string, string]>([
    ['#event-name', 'event-name-error', 'Informe o nome do evento.'],
    ['#event-address', 'event-address-error', 'Informe o endereço do evento.'],
    ['#event-date', 'event-date-error', 'Informe a data do evento.'],
  ])(
    'flags %s as required after leaving it empty',
    async (selector, errorId, message) => {
      const fixture = await render();
      blur(fixture, selector);

      const element = control(fixture, selector);
      expect(element.getAttribute('aria-invalid')).toBe('true');
      expect(element.getAttribute('aria-describedby')).toBe(errorId);
      expect(
        fixture.nativeElement.querySelector(`#${errorId}`)?.textContent?.trim()
      ).toBe(message);
    }
  );

  it('does not flag a field before the user leaves it', async () => {
    const fixture = await render();

    expect(control(fixture, '#event-name').getAttribute('aria-invalid')).toBeNull();
    expect(fixture.nativeElement.querySelector('.cfp-field-error')).toBeNull();
  });

  it.each(['#event-name', '#event-address'])(
    'treats whitespace-only %s as empty',
    async (selector) => {
      const fixture = await render();
      fillValidForm(fixture);
      input(fixture, selector, '    ');
      blur(fixture, selector);

      expect(control(fixture, selector).getAttribute('aria-invalid')).toBe('true');
      expect(submitButton(fixture).disabled).toBe(true);
    }
  );

  it.each([
    ['today', '2026-11-21'],
    ['yesterday', '2026-11-20'],
    ['a past year', '2025-12-31'],
  ])('rejects a date of %s', async (_, date) => {
    const fixture = await render();
    fillValidForm(fixture);
    input(fixture, '#event-date', date);
    blur(fixture, '#event-date');

    expect(control(fixture, '#event-date').getAttribute('aria-invalid')).toBe(
      'true'
    );
    expect(
      fixture.nativeElement.querySelector('#event-date-error')?.textContent?.trim()
    ).toBe('Escolha uma data a partir de amanhã.');
    expect(fixture.componentInstance.canSubmit()).toBe(false);
    expect(submitButton(fixture).disabled).toBe(true);
  });

  function submitForm(fixture: ComponentFixture<CfpEventComponent>): void {
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { cancelable: true })
    );
    fixture.detectChanges();
  }

  function errorText(
    fixture: ComponentFixture<CfpEventComponent>,
    id: string
  ): string | undefined {
    return fixture.nativeElement.querySelector(`#${id}`)?.textContent?.trim();
  }

  it('reveals every field error when an empty form is submitted', async () => {
    const fixture = await render();

    submitForm(fixture);

    expect(errorText(fixture, 'event-name-error')).toBe('Informe o nome do evento.');
    expect(errorText(fixture, 'event-address-error')).toBe(
      'Informe o endereço do evento.'
    );
    expect(errorText(fixture, 'event-date-error')).toBe('Informe a data do evento.');
    for (const selector of ['#event-name', '#event-address', '#event-date']) {
      expect(control(fixture, selector).getAttribute('aria-invalid')).toBe('true');
    }
    expect(register).not.toHaveBeenCalled();
  });

  it('reveals only the date error when submitted with a past date', async () => {
    const fixture = await render();
    input(fixture, '#event-name', 'DevFest Sul');
    input(fixture, '#event-address', 'Av. Ipiranga, 6681 - Porto Alegre');
    input(fixture, '#event-date', '2020-01-01');

    submitForm(fixture);

    expect(fixture.nativeElement.querySelector('#event-name-error')).toBeNull();
    expect(fixture.nativeElement.querySelector('#event-address-error')).toBeNull();
    expect(errorText(fixture, 'event-date-error')).toBe(
      'Escolha uma data a partir de amanhã.'
    );
    expect(register).not.toHaveBeenCalled();
  });

  it('enables submission once every field is valid', async () => {
    const fixture = await render();
    fillValidForm(fixture);

    expect(fixture.componentInstance.isValid()).toBe(true);
    expect(submitButton(fixture).disabled).toBe(false);
  });

  it('sends a trimmed EventDTO with a fresh id and locks while pending', async () => {
    const response = new Subject<EventDTO>();
    register.mockReturnValue(response.asObservable());
    const fixture = await render();
    fillValidForm(fixture);

    const button = submitButton(fixture);
    button.click();
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();

    expect(register).toHaveBeenCalledTimes(1);
    const payload = register.mock.calls[0][0] as EventDTO;
    expect(Object.keys(payload).sort()).toEqual(['address', 'date', 'id', 'name']);
    expect(payload).toEqual({
      id: expect.stringMatching(/\S/),
      name: 'DevFest Sul',
      address: 'Av. Ipiranga, 6681 - Porto Alegre',
      date: '2026-11-22',
    });
    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('Cadastrando...');
    expect(
      (fixture.nativeElement.querySelector('form') as HTMLFormElement).getAttribute(
        'aria-busy'
      )
    ).toBe('true');

    response.complete();
    fixture.detectChanges();
    expect(fixture.componentInstance.isSubmitting()).toBe(false);
    expect(button.disabled).toBe(false);
  });

  it('generates a new id on every submission', async () => {
    // A failed request ends immediately, so the form can be submitted again.
    register.mockReturnValue(throwError(() => new Error('request failed')));
    const fixture = await render();
    fillValidForm(fixture);

    submitButton(fixture).click();
    fixture.detectChanges();
    submitButton(fixture).click();
    fixture.detectChanges();

    expect(register).toHaveBeenCalledTimes(2);
    expect(register.mock.calls[0][0].id).not.toBe(register.mock.calls[1][0].id);
  });

  it('announces confirmation only after a successful response', async () => {
    const response = new Subject<EventDTO>();
    register.mockReturnValue(response.asObservable());
    const fixture = await render();
    fillValidForm(fixture);

    submitButton(fixture).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();

    response.next(register.mock.calls[0][0]);
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector(
      '[role="status"]'
    ) as HTMLElement;
    expect(status.textContent?.trim()).toBe('Evento cadastrado com sucesso.');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(fixture.componentInstance.isSubmitting()).toBe(false);
  });

  it('announces an accessible error without technical details and allows retrying', async () => {
    register.mockReturnValue(
      throwError(() => new Error('database exploded at line 42'))
    );
    const fixture = await render();
    fillValidForm(fixture);

    submitButton(fixture).click();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector(
      '[role="alert"]'
    ) as HTMLElement;
    expect(alert.textContent).toContain('Não foi possível cadastrar o evento');
    expect(alert.textContent).not.toContain('database');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
    expect(submitButton(fixture).disabled).toBe(false);

    input(fixture, '#event-name', 'DevFest Sul 2027');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(submitButton(fixture).disabled).toBe(false);
  });
});
