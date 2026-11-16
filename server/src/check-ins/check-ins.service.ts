import { BadRequestException, Injectable } from '@nestjs/common';
import { diffDays } from '../common/dates.js';
import { HabitsService } from '../habits/habits.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const MAX_RANGE_DAYS = 400;

@Injectable()
export class CheckInsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly habits: HabitsService,
  ) {}

  async range(userId: string, from: string, to: string) {
    if (from > to) throw new BadRequestException('from must not be after to');
    if (diffDays(from, to) + 1 > MAX_RANGE_DAYS) {
      throw new BadRequestException(`The range can cover at most ${MAX_RANGE_DAYS} days`);
    }
    return this.prisma.checkIn.findMany({
      where: { habit: { userId }, date: { gte: from, lte: to } },
      select: { habitId: true, date: true },
      orderBy: [{ date: 'asc' }, { habitId: 'asc' }],
    });
  }

  async tick(userId: string, habitId: string, date: string): Promise<void> {
    await this.habits.findOwned(userId, habitId);
    await this.prisma.checkIn.createMany({ data: [{ habitId, date }], skipDuplicates: true });
  }

  async untick(userId: string, habitId: string, date: string): Promise<void> {
    await this.habits.findOwned(userId, habitId);
    await this.prisma.checkIn.deleteMany({ where: { habitId, date, habit: { userId } } });
  }
}
