import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { HabitsModule } from '../habits/habits.module.js';
import { ExportController } from './export.controller.js';

@Module({ imports: [AuthModule, HabitsModule], controllers: [ExportController] })
export class ExportModule {}
