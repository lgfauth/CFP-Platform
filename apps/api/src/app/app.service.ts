import { Injectable } from '@nestjs/common';
import { SpeakerDTO } from '@cfp-platform/shared-types';

@Injectable()
export class AppService {
  /**
   * Accepted submissions, kept only for the lifetime of this provider
   * instance (volatile, no external persistence).
   */
  private readonly speakers: SpeakerDTO[] = [];

  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  submitSpeaker(speaker: SpeakerDTO): SpeakerDTO {
    const stored: SpeakerDTO = {
      id: speaker.id,
      name: speaker.name,
      email: speaker.email,
      talkTitle: speaker.talkTitle,
      isGDE: speaker.isGDE,
    };
    this.speakers.push(stored);
    return { ...stored };
  }

  listSpeakers(): SpeakerDTO[] {
    return this.speakers.map((speaker) => ({ ...speaker }));
  }
}
