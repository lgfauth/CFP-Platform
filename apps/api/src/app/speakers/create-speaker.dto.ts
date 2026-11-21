import type { SpeakerDTO } from '@cfp-platform/shared-types';
import {
  IsBoolean,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

const NON_WHITESPACE_TEXT = /\S/;

export class CreateSpeakerDto implements SpeakerDTO {
  @IsString()
  @IsNotEmpty()
  @Matches(NON_WHITESPACE_TEXT)
  id!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(NON_WHITESPACE_TEXT)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(NON_WHITESPACE_TEXT)
  talkTitle!: string;

  @IsDefined()
  @IsBoolean()
  isGDE!: boolean;
}
