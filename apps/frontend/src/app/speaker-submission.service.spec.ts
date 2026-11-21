import {
  provideHttpClient,
  withNoXsrfProtection,
} from '@angular/common/http';
import {
  HttpErrorResponse,
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SpeakerDTO } from '@cfp-platform/shared-types';
import { SpeakerSubmissionService } from './speaker-submission.service';

describe('SpeakerSubmissionService', () => {
  let service: SpeakerSubmissionService;
  let httpTesting: HttpTestingController;

  const speaker: SpeakerDTO = {
    id: 'proposal-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    talkTitle: 'Computação para todas as pessoas',
    isGDE: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withNoXsrfProtection()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SpeakerSubmissionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('posts the shared SpeakerDTO contract and propagates success', () => {
    let received: SpeakerDTO | undefined;
    service.submit(speaker).subscribe((response) => {
      received = response;
    });

    const request = httpTesting.expectOne('/api/speakers');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(speaker);
    request.flush(speaker);

    expect(received).toEqual(speaker);
  });

  it('propagates HTTP errors to the caller', () => {
    let received: HttpErrorResponse | undefined;
    service.submit(speaker).subscribe({
      next: () => fail('expected an HTTP error'),
      error: (error: HttpErrorResponse) => {
        received = error;
      },
    });

    const request = httpTesting.expectOne('/api/speakers');
    request.flush(
      { message: 'Invalid proposal' },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(received?.status).toBe(400);
    expect(received?.error).toEqual({ message: 'Invalid proposal' });
  });
});
