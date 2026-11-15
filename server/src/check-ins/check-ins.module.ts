import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { HabitsModule } from '../habits/habits.module.js';
import { CheckInsController } from './check-ins.controller.js';
import { CheckInsService } from './check-ins.service.js';

@Module({
  imports: [AuthModule, HabitsModule],
  controllers: [CheckInsController],
  providers: [CheckInsService],
})
export class CheckInsModule {}
