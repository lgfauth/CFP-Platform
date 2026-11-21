import type { SpeakerDTO } from '@cfp-platform/shared-types';
import { Body, Controller, Post } from '@nestjs/common';
import { CreateSpeakerDto } from './create-speaker.dto';
import { SpeakersService } from './speakers.service';

@Controller('speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Post()
  submit(@Body() speaker: CreateSpeakerDto): SpeakerDTO {
    return this.speakersService.submit(speaker);
  }
}
