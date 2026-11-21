import { Module } from '@nestjs/common';
import { CfpController } from './cfp.controller';
import { AppService } from './app.service';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  imports: [],
  controllers: [CfpController, EventController],
  providers: [AppService, EventService],
})
export class AppModule {}
