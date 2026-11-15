import { addDays } from '../src/common/dates.js';
import { api, createTestApp, TestContext, today } from './helpers.js';

describe('Check-ins (e2e)', () => {
  let ctx: TestContext;
  let alice: { id: string; cookie: string };
  let bob: { id: string; cookie: string };
  let habitId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    alice = await ctx.signIn();
    bob = await ctx.signIn();
    const res = await api(ctx, alice.cookie)
      .post('/api/habits')
      .send({ name: 'Read 20 pages', startDate: addDays(today(), -30) })
      .expect(201);
    habitId = res.body.id;
  });

  afterAll(() => ctx.close());

  const tickUrl = (date: string, id = habitId) => `/api/habits/${id}/check-ins/${date}`;

  it('ticks a day and returns 204', async () => {
    await api(ctx, alice.cookie).put(tickUrl(today())).expect(204);
    const res = await api(ctx, alice.cookie)
      .get(`/api/check-ins?from=${today()}&to=${today()}`)
      .expect(200);
    expect(res.body).toEqual([{ habitId, date: today() }]);
  });

  it('is idempotent: repeating a tick, even at the same instant, creates one check-in', async () => {
    const date = addDays(today(), -2);
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => api(ctx, alice.cookie).put(tickUrl(date))),
    );
    expect(responses.map((r) => r.status)).toEqual([204, 204, 204, 204, 204]);
    expect(await ctx.prisma.checkIn.count({ where: { habitId, date } })).toBe(1);
  });

  it('is idempotent when unticking too', async () => {
    const date = addDays(today(), -3);
    await api(ctx, alice.cookie).put(tickUrl(date)).expect(204);
    await api(ctx, alice.cookie).delete(tickUrl(date)).expect(204);
    await api(ctx, alice.cookie).delete(tickUrl(date)).expect(204);
    expect(await ctx.prisma.checkIn.count({ where: { habitId, date } })).toBe(0);
  });

  it('rejects a date in the future with 400, but accepts UTC today + 1', async () => {
    await api(ctx, alice.cookie)
      .put(tickUrl(addDays(today(), 2)))
      .expect(400);
    await api(ctx, alice.cookie)
      .delete(tickUrl(addDays(today(), 2)))
      .expect(400);
    await api(ctx, alice.cookie)
      .put(tickUrl(addDays(today(), 1)))
      .expect(204);
    await api(ctx, alice.cookie)
      .delete(tickUrl(addDays(today(), 1)))
      .expect(204);
  });

  it.each(['2025-1-1', '2025-02-30', 'yesterday', '2025-13-01', '20250101'])(
    'rejects the malformed date %s with 400',
    async (date) => {
      await api(ctx, alice.cookie).put(tickUrl(date)).expect(400);
    },
  );

  it('answers 404 when the habit belongs to someone else', async () => {
    await api(ctx, bob.cookie).put(tickUrl(today())).expect(404);
    await api(ctx, bob.cookie).delete(tickUrl(today())).expect(404);
    const list = await api(ctx, bob.cookie)
      .get(`/api/check-ins?from=${addDays(today(), -30)}&to=${today()}`)
      .expect(200);
    expect(list.body).toEqual([]);
  });

  describe('GET /api/check-ins range', () => {
    it('requires valid from and to', async () => {
      await api(ctx, alice.cookie).get('/api/check-ins').expect(400);
      await api(ctx, alice.cookie).get('/api/check-ins?from=2025-01-01').expect(400);
      await api(ctx, alice.cookie).get('/api/check-ins?from=bad&to=2025-01-02').expect(400);
    });

    it('rejects from after to', async () => {
      await api(ctx, alice.cookie).get('/api/check-ins?from=2025-02-01&to=2025-01-01').expect(400);
    });

    it('allows 400 days and rejects 401', async () => {
      const to = '2025-12-31';
      const ok = addDays(to, -399);
      const tooFar = addDays(to, -400);
      await api(ctx, alice.cookie).get(`/api/check-ins?from=${ok}&to=${to}`).expect(200);
      await api(ctx, alice.cookie).get(`/api/check-ins?from=${tooFar}&to=${to}`).expect(400);
    });

    it('only returns days inside the range', async () => {
      await api(ctx, alice.cookie)
        .put(tickUrl(addDays(today(), -10)))
        .expect(204);
      const res = await api(ctx, alice.cookie)
        .get(`/api/check-ins?from=${addDays(today(), -9)}&to=${today()}`)
        .expect(200);
      expect(res.body.map((c: { date: string }) => c.date)).not.toContain(addDays(today(), -10));
    });
  });
});
