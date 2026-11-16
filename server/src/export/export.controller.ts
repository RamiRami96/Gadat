import { Controller, Get, Header, Res, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard.js';
import { CurrentUser, SessionUser } from '../common/current-user.decorator.js';
import { formatDate } from '../common/dates.js';
import { HabitsService } from '../habits/habits.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Response } from 'express';

@Controller('export')
@UseGuards(SessionGuard)
export class ExportController {
  constructor(
    private readonly habits: HabitsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async download(@CurrentUser() user: SessionUser, @Res({ passthrough: true }) res: Response) {
    const [habits, checkIns] = await Promise.all([
      this.habits.list(user.id),
      this.prisma.checkIn.findMany({
        where: { habit: { userId: user.id } },
        select: { habitId: true, date: true },
        orderBy: [{ date: 'asc' }, { habitId: 'asc' }],
      }),
    ]);
    const now = new Date();
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="gadat-export-${formatDate(now.getTime())}.json"`,
    );
    return { app: 'gadat', version: 1, exportedAt: now.toISOString(), habits, checkIns };
  }
}
