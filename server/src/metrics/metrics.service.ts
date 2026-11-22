import { Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  public readonly registry = new Registry();

  private readonly httpDuration: Histogram<'method' | 'route' | 'status'>;

  private readonly recoveryUses: Counter;

  constructor() {
    collectDefaultMetrics({ register: this.registry });
    this.httpDuration = new Histogram({
      name: 'gadat_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });
    this.recoveryUses = new Counter({
      name: 'gadat_recovery_code_uses_total',
      help: 'Sign-ins with a recovery code',
      registers: [this.registry],
    });
  }

  // Express middleware. The route label is the matched pattern (/api/habits/:id), never the raw
  // URL, so ids and query strings cannot blow up the number of time series.
  public readonly middleware = (req: Request, res: Response, next: NextFunction): void => {
    const stop = this.httpDuration.startTimer();
    res.on('finish', () => {
      const route = req.route ? `${req.baseUrl}${String(req.route.path)}` : 'unmatched';
      stop({ method: req.method, route, status: res.statusCode });
    });
    next();
  };

  public countRecoveryUse(): void {
    this.recoveryUses.inc();
  }
}
