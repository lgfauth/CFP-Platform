import { EventDTO, isFutureIsoDate } from '@cfp-platform/shared-types';
import {
  IsNotEmpty,
  IsString,
  Matches,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

const NON_WHITESPACE_TEXT = /\S/;

/** Accepts only a valid `YYYY-MM-DD` day after the server's current day. */
function IsFutureIsoDate(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isFutureIsoDate',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: {
        message: '$property must be a future date in YYYY-MM-DD format',
        ...options,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isFutureIsoDate(value),
      },
    });
  };
}

export class EventRegistrationDto implements EventDTO {
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
  @Matches(NON_WHITESPACE_TEXT)
  address!: string;

  @IsString()
  @IsFutureIsoDate()
  date!: string;
}
