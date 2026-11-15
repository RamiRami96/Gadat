import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard.js';
import { CurrentUser, SessionUser } from '../common/current-user.decorator.js';
import { ArchiveHabitQuery, CreateHabitDto, UpdateHabitDto } from './dto/habit.dto.js';
import { HabitsService } from './habits.service.js';

@Controller('habits')
@UseGuards(SessionGuard)
export class HabitsController {
  constructor(private readonly habits: HabitsService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.habits.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: SessionUser, @Body() dto: CreateHabitDto) {
    return this.habits.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: SessionUser, @Param('id') id: string, @Body() dto: UpdateHabitDto) {
    return this.habits.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async archive(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Query() query: ArchiveHabitQuery,
  ): Promise<void> {
    await this.habits.archive(user.id, id, query.date);
  }
}
