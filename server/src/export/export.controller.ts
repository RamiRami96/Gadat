import { Controller, Get, Header, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SessionGuard } from '../auth/session.guard.js';
import { CurrentUser, SessionUser } from '../common/current-user.decorator.js';
import { formatDate } from '../common/dates.js';
import { ExportService } from './export.service.js';

@Controller('export')
@UseGuards(SessionGuard)
export class ExportController {
  constructor(private readonly exporter: ExportService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  public async download(
    @CurrentUser() user: SessionUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const now = new Date();
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="gadat-export-${formatDate(now.getTime())}.json"`,
    );
    return this.exporter.build(user.id, now);
  }
}
