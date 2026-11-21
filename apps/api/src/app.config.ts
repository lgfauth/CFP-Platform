import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';

export const API_GLOBAL_PREFIX = 'api';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}
