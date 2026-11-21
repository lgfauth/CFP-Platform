import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { SpeakerSubmissionDto } from './speaker-submission.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('speakers')
  submitSpeaker(@Body() speaker: SpeakerSubmissionDto) {
    return this.appService.submitSpeaker(speaker);
  }
}
