import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EventDTO, SpeakerDTO } from '@cfp-platform/shared-types';

export type DashboardStatus = 'loading' | 'ready' | 'error';

/**
 * Formats an ISO calendar day (`YYYY-MM-DD`) as `DD/MM/AAAA` by rearranging
 * the string, so no time zone conversion can shift the day.
 */
export function formatEventDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${day}/${month}/${year}` : isoDate;
}

@Component({
  standalone: true,
  selector: 'app-cfp-dashboard',
  imports: [RouterLink],
  templateUrl: './cfp-dashboard.html',
  styleUrl: './cfp-dashboard.css',
})
export class CfpDashboardComponent {
  private readonly http = inject(HttpClient);

  readonly formatEventDate = formatEventDate;

  readonly speakers: WritableSignal<SpeakerDTO[]> = signal<SpeakerDTO[]>([]);
  readonly status: WritableSignal<DashboardStatus> =
    signal<DashboardStatus>('loading');

  readonly isLoading = computed(() => this.status() === 'loading');
  readonly hasError = computed(() => this.status() === 'error');
  readonly isEmpty = computed(
    () => this.status() === 'ready' && this.speakers().length === 0
  );

  readonly events: WritableSignal<EventDTO[]> = signal<EventDTO[]>([]);
  readonly eventsStatus: WritableSignal<DashboardStatus> =
    signal<DashboardStatus>('loading');

  readonly eventsLoading = computed(() => this.eventsStatus() === 'loading');
  readonly eventsError = computed(() => this.eventsStatus() === 'error');
  readonly eventsEmpty = computed(
    () => this.eventsStatus() === 'ready' && this.events().length === 0
  );

  constructor() {
    // Each section loads independently: a failure in one never hides the other.
    this.http
      .get<SpeakerDTO[]>('/api/speakers')
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (speakers) => {
          this.speakers.set(speakers);
          this.status.set('ready');
        },
        error: () => {
          this.speakers.set([]);
          this.status.set('error');
        },
      });

    this.http
      .get<EventDTO[]>('/api/events')
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (events) => {
          this.events.set(events);
          this.eventsStatus.set('ready');
        },
        error: () => {
          this.events.set([]);
          this.eventsStatus.set('error');
        },
      });
  }
}
