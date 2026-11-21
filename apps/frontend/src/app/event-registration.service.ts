import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EventDTO } from '@cfp-platform/shared-types';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventRegistrationService {
  private readonly http = inject(HttpClient);

  register(event: EventDTO): Observable<EventDTO> {
    return this.http.post<EventDTO>('/api/events', event);
  }
}
