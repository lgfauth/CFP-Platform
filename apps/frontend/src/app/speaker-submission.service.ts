import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SpeakerDTO } from '@cfp-platform/shared-types';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SpeakerSubmissionService {
  private readonly http = inject(HttpClient);

  submit(speaker: SpeakerDTO): Observable<SpeakerDTO> {
    return this.http.post<SpeakerDTO>('/api/speakers', speaker);
  }
}
