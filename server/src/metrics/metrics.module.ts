import { Global, Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller.js';
import { MetricsService } from './metrics.service.js';
import { MetricsTokenGuard } from './metrics-token.guard.js';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService, MetricsTokenGuard],
  exports: [MetricsService],
})
export class MetricsModule {}
