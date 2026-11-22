import { Injectable } from '@nestjs/common';
import { CheckInsService } from '../check-ins/check-ins.service.js';
import { HabitsService } from '../habits/habits.service.js';

@Injectable()
export class ExportService {
  constructor(
    private readonly habits: HabitsService,
    private readonly checkIns: CheckInsService,
  ) {}

  public async build(userId: string, now: Date) {
    const [habits, checkIns] = await Promise.all([
      this.habits.list(userId),
      this.checkIns.listAll(userId),
    ]);
    return { app: 'gadat', version: 1, exportedAt: now.toISOString(), habits, checkIns };
  }
}
