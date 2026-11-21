import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SpeakerDTO } from '@cfp-platform/shared-types';
import { Subject, throwError } from 'rxjs';
import { CfpSubmissionComponent } from './cfp-submission';
import { SpeakerSubmissionService } from '../speaker-submission.service';

describe('CfpSubmissionComponent', () => {
  const submit = jest.fn();

  beforeEach(async () => {
    submit.mockReset();
    await TestBed.configureTestingModule({
      imports: [CfpSubmissionComponent],
      providers: [
        provideRouter([]),
        {
          provide: SpeakerSubmissionService,
          useValue: { submit },
        },
      ],
    }).compileComponents();
  });

  function input(
    fixture: ReturnType<TestBed['createComponent']>,
    selector: string,
    value: string
  ): void {
    const control = fixture.nativeElement.querySelector(
      selector
    ) as HTMLInputElement;
    control.value = value;
    control.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function fillValidForm(
    fixture: ReturnType<TestBed['createComponent']>
  ): void {
    input(fixture, '#speaker-name', 'Ada Lovelace');
    input(fixture, '#speaker-email', 'ada@example.com');
    input(fixture, '#talk-title', 'Computação para todas as pessoas');
  }

  it('starts idle with an invalid form and a disabled submit button', async () => {
    const fixture = TestBed.createComponent(CfpSubmissionComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;

    expect(component.speaker()).toEqual({
      id: '',
      name: '',
      email: '',
      talkTitle: '',
      isGDE: false,
    });
    expect(component.submissionStatus()).toBe('idle');
    expect(component.isValid()).toBe(false);
    expect(component.canSubmit()).toBe(false);
    expect(button.disabled).toBe(true);
  });

  it('enables submission after valid values are entered', async () => {
    const fixture = TestBed.createComponent(CfpSubmissionComponent);
    await fixture.whenStable();
    fillValidForm(fixture);

    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    expect(fixture.componentInstance.isValid()).toBe(true);
    expect(button.disabled).toBe(false);
  });

  it('keeps the form locked and prevents a second submission while pending', async () => {
    const response = new Subject<SpeakerDTO>();
    submit.mockReturnValue(response.asObservable());
    const fixture = TestBed.createComponent(CfpSubmissionComponent);
    await fixture.whenStable();
    fillValidForm(fixture);

    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        talkTitle: 'Computação para todas as pessoas',
        isGDE: false,
      })
    );
    expect(fixture.componentInstance.isSubmitting()).toBe(true);
    expect(button.disabled).toBe(true);
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

  it('announces confirmation only after a successful response', async () => {
    const response = new Subject<SpeakerDTO>();
    submit.mockReturnValue(response.asObservable());
    const fixture = TestBed.createComponent(CfpSubmissionComponent);
    await fixture.whenStable();
    fillValidForm(fixture);

    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();

    const payload = submit.mock.calls[0][0] as SpeakerDTO;
    response.next(payload);
    fixture.detectChanges();

    expect(fixture.componentInstance.isSubmitting()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent)
      .toContain('Proposta enviada com sucesso');
  });

  it('announces an accessible error and permits another attempt', async () => {
    submit.mockReturnValue(throwError(() => new Error('request failed')));
    const fixture = TestBed.createComponent(CfpSubmissionComponent);
    await fixture.whenStable();
    fillValidForm(fixture);

    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector(
      '[role="alert"]'
    ) as HTMLElement;
    expect(alert.textContent).toContain('Não foi possível enviar sua proposta');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
    expect(fixture.componentInstance.isSubmitting()).toBe(false);
    expect(button.disabled).toBe(false);
  });

  it('offers a labelled navigation link to the dashboard', async () => {
    const fixture = TestBed.createComponent(CfpSubmissionComponent);
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector(
      '.cfp-actions a'
    ) as HTMLAnchorElement | null;

    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('/');
    expect(link?.textContent?.trim()).toBe('Ver palestras submetidas');
    expect(link?.classList).toContain('cfp-button-secondary');
  });

  it('associates an invalid field error with its control', async () => {
    const fixture = TestBed.createComponent(CfpSubmissionComponent);
    await fixture.whenStable();
    input(fixture, '#speaker-email', 'invalid-email');

    const email = fixture.nativeElement.querySelector(
      '#speaker-email'
    ) as HTMLInputElement;
    email.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('speaker-email-error');
    expect(
      fixture.nativeElement.querySelector('#speaker-email-error')?.textContent
    ).toContain('Informe um email válido');
  });
});
