import { Component, computed, inject, signal } from '@angular/core';
import {
  EventDTO,
  isFutureIsoDate,
  minFutureIsoDate,
} from '@cfp-platform/shared-types';
import { EventRegistrationService } from '../event-registration.service';

type EventField = 'name' | 'address' | 'date';
type EventDraft = Omit<EventDTO, 'id'>;
type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';
type TouchedFields = Record<EventField, boolean>;

@Component({
  standalone: true,
  selector: 'app-cfp-event',
  templateUrl: './cfp-event.html',
  styleUrl: './cfp-event.css',
})
export class CfpEventComponent {
  private readonly eventService = inject(EventRegistrationService);

  /** First selectable day in the datepicker: tomorrow, in local time. */
  readonly minDate = minFutureIsoDate();

  readonly event = signal<EventDraft>({ name: '', address: '', date: '' });
  readonly submissionStatus = signal<SubmissionStatus>('idle');
  readonly successMessage = signal('');
  readonly errorMessage = signal('');
  readonly touched = signal<TouchedFields>({
    name: false,
    address: false,
    date: false,
  });

  readonly isValid = computed(() =>
    (['name', 'address', 'date'] as const).every(
      (field) => this.errorFor(field, this.event()) === ''
    )
  );
  readonly isSubmitting = computed(
    () => this.submissionStatus() === 'submitting'
  );
  readonly canSubmit = computed(() => this.isValid() && !this.isSubmitting());

  update(field: EventField, event: Event): void {
    if (this.isSubmitting()) {
      return;
    }

    const value = (event.target as HTMLInputElement).value;
    this.event.update((draft) => ({ ...draft, [field]: value }));
    this.clearFeedback();
  }

  markTouched(field: EventField): void {
    this.touched.update((touched) => ({ ...touched, [field]: true }));
  }

  isFieldInvalid(field: EventField): boolean {
    return this.touched()[field] && this.fieldError(field).length > 0;
  }

  fieldError(field: EventField): string {
    return this.errorFor(field, this.event());
  }

  submit(): void {
    const draft = this.event();
    // Re-check the date against the clock at submission time, in case the
    // page stayed open past midnight.
    if (!this.canSubmit() || !isFutureIsoDate(draft.date)) {
      this.touched.set({ name: true, address: true, date: true });
      return;
    }

    const payload: EventDTO = {
      id: globalThis.crypto.randomUUID(),
      name: draft.name.trim(),
      address: draft.address.trim(),
      date: draft.date,
    };

    this.event.set({
      name: payload.name,
      address: payload.address,
      date: payload.date,
    });
    this.submissionStatus.set('submitting');
    this.successMessage.set('');
    this.errorMessage.set('');

    this.eventService.register(payload).subscribe({
      next: () => {
        this.submissionStatus.set('success');
        this.successMessage.set('Evento cadastrado com sucesso.');
      },
      error: () => {
        this.submissionStatus.set('error');
        this.errorMessage.set(
          'Não foi possível cadastrar o evento. Revise os dados e tente novamente.'
        );
      },
      complete: () => {
        if (this.submissionStatus() === 'submitting') {
          this.submissionStatus.set('idle');
        }
      },
    });
  }

  private errorFor(field: EventField, draft: EventDraft): string {
    const value = draft[field].trim();

    if (value.length === 0) {
      return field === 'name'
        ? 'Informe o nome do evento.'
        : field === 'address'
          ? 'Informe o endereço do evento.'
          : 'Informe a data do evento.';
    }

    if (field === 'date' && !isFutureIsoDate(value)) {
      return 'Escolha uma data a partir de amanhã.';
    }

    return '';
  }

  private clearFeedback(): void {
    if (this.submissionStatus() !== 'submitting') {
      this.submissionStatus.set('idle');
      this.successMessage.set('');
      this.errorMessage.set('');
    }
  }
}
