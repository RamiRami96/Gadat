import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { addDays } from '../common/dates.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto.js';

export const MAX_ACTIVE_HABITS = 20;
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

const SELECT = {
  id: true,
  name: true,
  note: true,
  days: true,
  startDate: true,
  endDate: true,
  createdAt: true,
} as const;

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId },
      select: SELECT,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  create(userId: string, dto: CreateHabitDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      const active = await tx.habit.count({ where: { userId, endDate: null } });
      if (active >= MAX_ACTIVE_HABITS) {
        throw new BadRequestException(`You can have at most ${MAX_ACTIVE_HABITS} active habits.`);
      }
      return tx.habit.create({
        data: {
          userId,
          name: dto.name,
          note: dto.note ?? null,
          days: [...(dto.days ?? ALL_DAYS)].sort((a, b) => a - b),
          startDate: dto.startDate,
        },
        select: SELECT,
      });
    });
  }

  async update(userId: string, id: string, dto: UpdateHabitDto) {
    await this.findOwned(userId, id);
    return this.prisma.habit.update({
      where: { id, userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.days !== undefined && { days: [...dto.days].sort((a, b) => a - b) }),
      },
      select: SELECT,
    });
  }

  async archive(userId: string, id: string, date: string): Promise<void> {
    const habit = await this.findOwned(userId, id);
    if (habit.endDate !== null) return;
    await this.prisma.habit.update({ where: { id, userId }, data: { endDate: addDays(date, -1) } });
  }

  async findOwned(userId: string, id: string) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId }, select: SELECT });
    if (!habit) throw new NotFoundException('Habit not found');
    return habit;
  }
}
