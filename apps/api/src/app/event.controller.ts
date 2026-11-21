import { Body, Controller, Get, Post } from '@nestjs/common';
import type { EventDTO } from '@cfp-platform/shared-types';
import { EventRegistrationDto } from './event-registration.dto';
import { EventService } from './event.service';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  listEvents(): EventDTO[] {
    return this.eventService.listEvents();
  }

  @Post()
  registerEvent(@Body() event: EventRegistrationDto): EventDTO {
    return this.eventService.registerEvent(event);
  }
}
