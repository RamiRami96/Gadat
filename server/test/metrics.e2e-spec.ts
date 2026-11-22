import request from 'supertest';
import { api, createTestApp, TestContext } from './helpers.js';

describe('Metrics (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(() => ctx.close());

  const scrape = (token?: string) => {
    const req = request(ctx.app.getHttpServer()).get('/api/metrics');
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  it('rejects scrapes without the bearer token', async () => {
    await scrape().expect(401);
    await scrape('wrong-token').expect(401);
  });

  it('exposes request, auth and process metrics to Prometheus', async () => {
    const user = await ctx.signIn();
    await api(ctx, user.cookie).get('/api/habits').expect(200);
    await api(ctx).get('/api/habits').expect(401);

    const res = await scrape('e2e-metrics-token').expect(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.text).toContain(
      'gadat_http_request_duration_seconds_count{method="GET",route="/api/habits",status="200"}',
    );
    expect(res.text).toContain(
      'gadat_http_request_duration_seconds_count{method="GET",route="/api/habits",status="401"}',
    );
    expect(res.text).toContain('# TYPE gadat_recovery_code_uses_total counter');
    expect(res.text).toContain('process_cpu_seconds_total');
  });

  it('keeps ids out of the route label', async () => {
    const user = await ctx.signIn();
    await api(ctx, user.cookie)
      .patch('/api/habits/some-made-up-id')
      .send({ name: 'x' })
      .expect(404);
    const res = await scrape('e2e-metrics-token').expect(200);
    expect(res.text).toContain('route="/api/habits/:id"');
    expect(res.text).not.toContain('some-made-up-id');
  });
});
