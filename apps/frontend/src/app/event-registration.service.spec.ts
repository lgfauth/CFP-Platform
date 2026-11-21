import {
  HttpErrorResponse,
  provideHttpClient,
  withNoXsrfProtection,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EventDTO } from '@cfp-platform/shared-types';
import { EventRegistrationService } from './event-registration.service';

describe('EventRegistrationService', () => {
  let service: EventRegistrationService;
  let httpTesting: HttpTestingController;

  const event: EventDTO = {
    id: 'event-1',
    name: 'DevFest Sul',
    address: 'Av. Ipiranga, 6681 - Porto Alegre, RS',
    date: '2027-03-05',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withNoXsrfProtection()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EventRegistrationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('posts the shared EventDTO contract and propagates success', () => {
    let received: EventDTO | undefined;
    service.register(event).subscribe((response) => {
      received = response;
    });

    const request = httpTesting.expectOne('/api/events');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(event);
    request.flush(event);

    expect(received).toEqual(event);
  });

  it('propagates HTTP errors to the caller', () => {
    let received: HttpErrorResponse | undefined;
    service.register(event).subscribe({
      next: () => fail('expected an HTTP error'),
      error: (error: HttpErrorResponse) => {
        received = error;
      },
    });

    httpTesting
      .expectOne('/api/events')
      .flush(
        { message: ['date must be a future date in YYYY-MM-DD format'] },
        { status: 400, statusText: 'Bad Request' }
      );

    expect(received?.status).toBe(400);
  });
});
