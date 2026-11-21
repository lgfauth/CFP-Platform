import { Injectable } from '@nestjs/common';
import { SpeakerDTO } from '@cfp-platform/shared-types';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  submitSpeaker(speaker: SpeakerDTO): SpeakerDTO {
    return speaker;
  }
}
