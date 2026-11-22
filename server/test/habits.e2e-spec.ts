import { addDays } from '../src/common/dates.js';
import { api, createTestApp, TestContext, today } from './helpers.js';

describe('Habits (e2e)', () => {
  let ctx: TestContext;
  let alice: { id: string; cookie: string };
  let bob: { id: string; cookie: string };

  beforeAll(async () => {
    ctx = await createTestApp();
    alice = await ctx.signIn();
    bob = await ctx.signIn();
  });

  afterAll(() => ctx.close());

  it('GET /api/health is public', async () => {
    const res = await api(ctx).get('/api/health').expect(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('requires a session', async () => {
    await api(ctx).get('/api/habits').expect(401);
    await api(ctx, 'session=not-a-token').get('/api/habits').expect(401);
  });

  it('creates a habit with every weekday by default and trims the name', async () => {
    const res = await api(ctx, alice.cookie)
      .post('/api/habits')
      .send({ name: '  Read 20 pages  ', startDate: today() })
      .expect(201);
    expect(res.body).toMatchObject({
      name: 'Read 20 pages',
      note: null,
      days: [1, 2, 3, 4, 5, 6, 7],
      startDate: today(),
      endDate: null,
    });
    expect(res.body.userId).toBeUndefined();
  });

  it.each([
    ['an empty name', { name: '   ', startDate: today() }],
    ['a name over 40 characters', { name: 'x'.repeat(41), startDate: today() }],
    ['a note over 60 characters', { name: 'Ok', note: 'n'.repeat(61), startDate: today() }],
    ['empty days', { name: 'Ok', days: [], startDate: today() }],
    ['a weekday of 0', { name: 'Ok', days: [0, 1], startDate: today() }],
    ['a weekday of 8', { name: 'Ok', days: [8], startDate: today() }],
    ['duplicate weekdays', { name: 'Ok', days: [1, 1], startDate: today() }],
    ['a malformed date', { name: 'Ok', startDate: '2025-1-1' }],
    ['an impossible date', { name: 'Ok', startDate: '2025-02-30' }],
    ['a start date in the future', { name: 'Ok', startDate: addDays(today(), 5) }],
    ['an unknown field', { name: 'Ok', startDate: today(), userId: 'someone-else' }],
    ['a missing start date', { name: 'Ok' }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await api(ctx, alice.cookie).post('/api/habits').send(body).expect(400);
    expect(res.body.statusCode).toBe(400);
    expect(typeof res.body.message).toBe('string');
  });

  it('returns errors in one shape and never a stack trace', async () => {
    const res = await api(ctx, alice.cookie).post('/api/habits').send({ name: '' }).expect(400);
    expect(Object.keys(res.body).sort()).toEqual(['errors', 'message', 'statusCode']);
    expect(res.body.stack).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/\.(ts|js):\d+/);
  });

  it('rejects mutating requests that are not JSON with 415', async () => {
    const res = await api(ctx, alice.cookie)
      .post('/api/habits')
      .set('Content-Type', 'text/plain')
      .send('name=x')
      .expect(415);
    expect(res.body.statusCode).toBe(415);
  });

  it("only lists the signed-in user's habits and answers 404 for other people's ids", async () => {
    const mine = await api(ctx, alice.cookie)
      .post('/api/habits')
      .send({ name: 'Alice only', startDate: today(), days: [1, 3] })
      .expect(201);

    const bobList = await api(ctx, bob.cookie).get('/api/habits').expect(200);
    expect(bobList.body).toEqual([]);

    await api(ctx, bob.cookie)
      .patch(`/api/habits/${mine.body.id}`)
      .send({ name: 'Hacked' })
      .expect(404);
    await api(ctx, bob.cookie).delete(`/api/habits/${mine.body.id}?date=${today()}`).expect(404);

    const aliceList = await api(ctx, alice.cookie).get('/api/habits').expect(200);
    expect(aliceList.body.find((h: { id: string }) => h.id === mine.body.id).name).toBe(
      'Alice only',
    );
  });

  it('answers 404, not 403 or 500, for ids that do not exist', async () => {
    await api(ctx, alice.cookie).patch('/api/habits/not-a-real-id').send({ name: 'x' }).expect(404);
  });

  it('updates name, note and days; an empty note clears it', async () => {
    const created = await api(ctx, alice.cookie)
      .post('/api/habits')
      .send({ name: 'Walk', note: 'Outside', startDate: today() })
      .expect(201);
    const res = await api(ctx, alice.cookie)
      .patch(`/api/habits/${created.body.id}`)
      .send({ name: 'Walk 30 min', note: '', days: [5, 1] })
      .expect(200);
    expect(res.body).toMatchObject({ name: 'Walk 30 min', note: null, days: [1, 5] });
    await api(ctx, alice.cookie)
      .patch(`/api/habits/${created.body.id}`)
      .send({ days: [] })
      .expect(400);
  });

  it('archives instead of deleting: endDate is the day before the given date, check-ins stay', async () => {
    const habit = await api(ctx, alice.cookie)
      .post('/api/habits')
      .send({ name: 'Archive me', startDate: addDays(today(), -3) })
      .expect(201);
    await api(ctx, alice.cookie)
      .put(`/api/habits/${habit.body.id}/check-ins/${addDays(today(), -1)}`)
      .expect(204);

    await api(ctx, alice.cookie).delete(`/api/habits/${habit.body.id}`).expect(400);
    await api(ctx, alice.cookie).delete(`/api/habits/${habit.body.id}?date=${today()}`).expect(204);
    await api(ctx, alice.cookie)
      .delete(`/api/habits/${habit.body.id}?date=${addDays(today(), 1)}`)
      .expect(204);

    const list = await api(ctx, alice.cookie).get('/api/habits').expect(200);
    const archived = list.body.find((h: { id: string }) => h.id === habit.body.id);
    expect(archived.endDate).toBe(addDays(today(), -1));

    const checkIns = await api(ctx, alice.cookie)
      .get(`/api/check-ins?from=${addDays(today(), -5)}&to=${today()}`)
      .expect(200);
    expect(checkIns.body).toContainEqual({ habitId: habit.body.id, date: addDays(today(), -1) });
  });

  it('allows at most 20 active habits, but archived ones do not count', async () => {
    const carol = await ctx.signIn();
    for (let i = 0; i < 20; i++) {
      await api(ctx, carol.cookie)
        .post('/api/habits')
        .send({ name: `Habit ${i}`, startDate: today() })
        .expect(201);
    }
    const res = await api(ctx, carol.cookie)
      .post('/api/habits')
      .send({ name: 'One too many', startDate: today() })
      .expect(400);
    expect(res.body.message).toMatch(/at most 20/);

    const list = await api(ctx, carol.cookie).get('/api/habits').expect(200);
    await api(ctx, carol.cookie)
      .delete(`/api/habits/${list.body[0].id}?date=${today()}`)
      .expect(204);
    await api(ctx, carol.cookie)
      .post('/api/habits')
      .send({ name: 'Fits now', startDate: today() })
      .expect(201);
  });
});
