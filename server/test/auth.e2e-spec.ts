import request from 'supertest';
import { api, createTestApp, TestContext } from './helpers.js';

function cookiesOf(res: request.Response): string[] {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined;
  return header ?? [];
}

describe('Auth (e2e)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestApp();
  });

  afterEach(() => ctx.close());

  it('GET /api/auth/me needs a session, then returns the id', async () => {
    await api(ctx).get('/api/auth/me').expect(401);
    const user = await ctx.signIn();
    const res = await api(ctx, user.cookie).get('/api/auth/me').expect(200);
    expect(res.body).toEqual({ id: user.id });
  });

  it('login/options returns a discoverable-credential challenge in a signed HttpOnly cookie', async () => {
    const res = await api(ctx).post('/api/auth/login/options').send({}).expect(200);
    expect(res.body.challenge).toEqual(expect.any(String));
    expect(res.body.allowCredentials).toBeUndefined();
    expect(res.body.userVerification).toBe('required');
    const chal = cookiesOf(res).find((c) => c.startsWith('chal='));
    expect(chal).toMatch(/HttpOnly/);
    expect(chal).toMatch(/SameSite=Lax/);
    expect(chal).toMatch(/Max-Age=300/);
  });

  it('register/options creates a user and asks for a platform passkey with user verification', async () => {
    const res = await api(ctx).post('/api/auth/register/options').send({}).expect(200);
    expect(res.body.rp).toEqual({ name: 'Gӓdӓt', id: 'localhost' });
    expect(res.body.attestation).toBe('none');
    expect(res.body.authenticatorSelection).toMatchObject({
      authenticatorAttachment: 'platform',
      residentKey: 'required',
      userVerification: 'required',
    });
    const userId = Buffer.from(res.body.user.id, 'base64url').toString();
    ctx.userIds.push(userId);
    expect(await ctx.prisma.user.count({ where: { id: userId } })).toBe(1);
  });

  it('verify endpoints reject a missing or tampered challenge cookie with 400', async () => {
    await api(ctx)
      .post('/api/auth/login/verify')
      .send({ response: { id: 'x' } })
      .expect(400);
    await api(ctx, 'chal=s%3A%7B%7D.forged')
      .post('/api/auth/register/verify')
      .send({ response: { id: 'x' } })
      .expect(400);
  });

  it('validates bodies', async () => {
    await api(ctx).post('/api/auth/login/verify').send({}).expect(400);
    await api(ctx).post('/api/auth/recovery').send({ code: 'abc' }).expect(400);
    await api(ctx)
      .post('/api/auth/recovery')
      .send({ code: 'ABCD-EFGH-JKLM-NPQR', extra: 1 })
      .expect(400);
  });

  it('logout clears the session cookie and ends the session on the server', async () => {
    const user = await ctx.signIn();
    const res = await api(ctx, user.cookie).post('/api/auth/logout').send({}).expect(204);
    expect(cookiesOf(res).find((c) => c.startsWith('session='))).toMatch(/session=;/);
    await api(ctx).post('/api/auth/logout').send({}).expect(401);
    await api(ctx, user.cookie).get('/api/auth/me').expect(401);
  });

  it('the recovery code works once, and the reply carries a new one', async () => {
    const user = await ctx.signIn();
    const first = await api(ctx)
      .post('/api/auth/recovery')
      .send({ code: user.recoveryCode })
      .expect(200);
    expect(first.body.recoveryCode).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
    expect(first.body.recoveryCode).not.toBe(user.recoveryCode);
    const session = cookiesOf(first).find((c) => c.startsWith('session='))!;
    expect(session).toMatch(/HttpOnly/);
    expect(session).toMatch(/SameSite=Lax/);

    await api(ctx).post('/api/auth/recovery').send({ code: user.recoveryCode }).expect(401);
    const loose = first.body.recoveryCode.toLowerCase().replaceAll('-', ' ');
    const second = await api(ctx).post('/api/auth/recovery').send({ code: loose }).expect(200);
    expect(second.body.recoveryCode).not.toBe(first.body.recoveryCode);
  });

  it('rate limits /api/auth/* at 10 requests per minute per IP, across all auth routes', async () => {
    const limited = await createTestApp();
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 12; i++) {
        const path = i % 2 === 0 ? '/api/auth/login/options' : '/api/auth/recovery';
        const res = await api(limited)
          .post(path)
          .send(i % 2 === 0 ? {} : { code: 'AAAA-BBBB-CCCC-DDDD' });
        statuses.push(res.status);
      }
      expect(statuses.slice(0, 10).every((s) => s !== 429)).toBe(true);
      expect(statuses.slice(10)).toEqual([429, 429]);
      const blocked = await api(limited).post('/api/auth/login/options').send({});
      expect(blocked.body).toEqual({
        statusCode: 429,
        message: 'Too many requests. Please wait a minute and try again.',
      });
      await api(limited).get('/api/health').expect(200);
    } finally {
      await limited.close();
    }
  });
});
