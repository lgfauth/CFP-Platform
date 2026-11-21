import { Body, Controller, Get, Post } from '@nestjs/common';
import type { SpeakerDTO } from '@cfp-platform/shared-types';
import { AppService } from './app.service';
import { SpeakerSubmissionDto } from './speaker-submission.dto';

@Controller()
export class CfpController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('speakers')
  listSpeakers(): SpeakerDTO[] {
    return this.appService.listSpeakers();
  }

  @Post('speakers')
  submitSpeaker(@Body() speaker: SpeakerSubmissionDto): SpeakerDTO {
    return this.appService.submitSpeaker(speaker);
  }
}
