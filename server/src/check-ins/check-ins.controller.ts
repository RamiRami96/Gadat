import { Controller, Delete, Get, HttpCode, Param, Put, Query, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard.js';
import { CurrentUser, SessionUser } from '../common/current-user.decorator.js';
import { CheckInParams, RangeQuery } from './dto/check-in.dto.js';
import { CheckInsService } from './check-ins.service.js';

@Controller()
@UseGuards(SessionGuard)
export class CheckInsController {
  constructor(private readonly checkIns: CheckInsService) {}

  @Get('check-ins')
  public range(@CurrentUser() user: SessionUser, @Query() query: RangeQuery) {
    return this.checkIns.range(user.id, query.from, query.to);
  }

  @Put('habits/:id/check-ins/:date')
  @HttpCode(204)
  public async tick(
    @CurrentUser() user: SessionUser,
    @Param() params: CheckInParams,
  ): Promise<void> {
    await this.checkIns.tick(user.id, params.id, params.date);
  }

  @Delete('habits/:id/check-ins/:date')
  @HttpCode(204)
  public async untick(
    @CurrentUser() user: SessionUser,
    @Param() params: CheckInParams,
  ): Promise<void> {
    await this.checkIns.untick(user.id, params.id, params.date);
  }
}
