import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SpeakerDTO } from '@cfp-platform/shared-types';
import { SpeakerSubmissionService } from '../speaker-submission.service';

type TextField = 'name' | 'email' | 'talkTitle';
type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';
type TouchedFields = Record<TextField, boolean>;

@Component({
  standalone: true,
  selector: 'app-cfp-submission',
  imports: [RouterLink],
  templateUrl: './cfp-submission.html',
  styleUrl: './cfp-submission.css',
})
export class CfpSubmissionComponent {
  private readonly speakerService = inject(SpeakerSubmissionService);

  readonly speaker = signal<SpeakerDTO>({
    id: '',
    name: '',
    email: '',
    talkTitle: '',
    isGDE: false,
  });
  readonly submissionStatus = signal<SubmissionStatus>('idle');
  readonly successMessage = signal('');
  readonly errorMessage = signal('');
  readonly touched = signal<TouchedFields>({
    name: false,
    email: false,
    talkTitle: false,
  });

  readonly isValid = computed(() => {
    const speaker = this.speaker();
    return (
      speaker.name.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(speaker.email.trim()) &&
      speaker.talkTitle.trim().length > 0 &&
      typeof speaker.isGDE === 'boolean'
    );
  });
  readonly isSubmitting = computed(
    () => this.submissionStatus() === 'submitting'
  );
  readonly canSubmit = computed(() => this.isValid() && !this.isSubmitting());

  updateText(field: TextField, event: Event): void {
    if (this.isSubmitting()) {
      return;
    }

    const value = (event.target as HTMLInputElement).value;
    this.speaker.update((speaker) => ({ ...speaker, [field]: value }));
    this.clearFeedback();
  }

  updateIsGDE(event: Event): void {
    if (this.isSubmitting()) {
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;
    this.speaker.update((speaker) => ({ ...speaker, isGDE: checked }));
    this.clearFeedback();
  }

  markTouched(field: TextField): void {
    this.touched.update((touched) => ({ ...touched, [field]: true }));
  }

  isFieldInvalid(field: TextField): boolean {
    return this.touched()[field] && this.fieldError(field).length > 0;
  }

  fieldError(field: TextField): string {
    const value = this.speaker()[field].trim();

    if (value.length === 0) {
      return field === 'talkTitle'
        ? 'Informe o título da palestra.'
        : field === 'email'
          ? 'Informe seu email.'
          : 'Informe seu nome.';
    }

    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Informe um email válido.';
    }

    return '';
  }

  submit(): void {
    if (!this.isValid()) {
      // An invalid submission (e.g. Enter in a field) reveals every error,
      // including fields the user has not visited yet.
      this.touched.set({ name: true, email: true, talkTitle: true });
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    const payload: SpeakerDTO = {
      ...this.speaker(),
      id: globalThis.crypto.randomUUID(),
      name: this.speaker().name.trim(),
      email: this.speaker().email.trim(),
      talkTitle: this.speaker().talkTitle.trim(),
    };

    this.speaker.set(payload);
    this.submissionStatus.set('submitting');
    this.successMessage.set('');
    this.errorMessage.set('');

    this.speakerService.submit(payload).subscribe({
      next: () => {
        this.submissionStatus.set('success');
        this.successMessage.set(
          'Proposta enviada com sucesso. Obrigado por contribuir!'
        );
      },
      error: () => {
        this.submissionStatus.set('error');
        this.errorMessage.set(
          'Não foi possível enviar sua proposta. Revise os dados e tente novamente.'
        );
      },
      complete: () => {
        if (this.submissionStatus() === 'submitting') {
          this.submissionStatus.set('idle');
        }
      },
    });
  }

  private clearFeedback(): void {
    if (this.submissionStatus() !== 'submitting') {
      this.submissionStatus.set('idle');
      this.successMessage.set('');
      this.errorMessage.set('');
    }
  }
}
