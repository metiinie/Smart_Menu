import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TelemetryController } from './telemetry.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformController, TelemetryController],
  providers: [PlatformService],
})
export class PlatformModule {}
