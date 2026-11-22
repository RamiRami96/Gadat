import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CheckInsModule } from '../check-ins/check-ins.module.js';
import { HabitsModule } from '../habits/habits.module.js';
import { ExportController } from './export.controller.js';
import { ExportService } from './export.service.js';

@Module({
  imports: [AuthModule, HabitsModule, CheckInsModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
