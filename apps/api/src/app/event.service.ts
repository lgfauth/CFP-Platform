import { Injectable } from '@nestjs/common';
import { EventDTO } from '@cfp-platform/shared-types';

@Injectable()
export class EventService {
  /**
   * Accepted events, kept only for the lifetime of this provider instance
   * (volatile, no external persistence).
   */
  private readonly events: EventDTO[] = [];

  registerEvent(event: EventDTO): EventDTO {
    const stored: EventDTO = {
      id: event.id,
      name: event.name,
      address: event.address,
      date: event.date,
    };
    this.events.push(stored);
    return { ...stored };
  }

  listEvents(): EventDTO[] {
    return this.events.map((event) => ({ ...event }));
  }
}
