import type { SpeakerDTO } from '@cfp-platform/shared-types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SpeakersService {
  submit(speaker: SpeakerDTO): SpeakerDTO {
    return speaker;
  }
}
