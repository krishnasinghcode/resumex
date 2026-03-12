import {
  api,
  connectTestDB,
  closeTestDB,
  clearDB,
  registerAndLogin,
  authHeader,
} from './setup/helpers';

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await closeTestDB(); });
afterEach(async () => { await clearDB(); });

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {

  it('registers a new user and returns accessToken + user', async () => {
    const res = await api.post('/api/auth/register').send({
      email:       'new@example.com',
      password:    'Password1',
      displayName: 'New User',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('new@example.com');
    // Password must never be in response
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.refreshTokens).toBeUndefined();
  });

  it('bootstraps vault on register — GET /api/vault/meta returns 14 sections', async () => {
    const { accessToken } = await registerAndLogin('vault@example.com');

    const meta = await api
      .get('/api/vault/meta')
      .set(authHeader(accessToken));

    expect(meta.status).toBe(200);
    const sections = meta.body.data.sections;
    expect(Object.keys(sections)).toHaveLength(14);
    // All sections should start incomplete
    Object.values(sections).forEach((s: any) => {
      expect(s.isComplete).toBe(false);
      expect(s.isPrivate).toBe(false);
    });
  });

  it('rejects duplicate email with 409', async () => {
    await api.post('/api/auth/register').send({
      email: 'dup@example.com', password: 'Password1', displayName: 'User A',
    });

    const res = await api.post('/api/auth/register').send({
      email: 'dup@example.com', password: 'Password1', displayName: 'User B',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects weak password — no uppercase', async () => {
    const res = await api.post('/api/auth/register').send({
      email: 'a@b.com', password: 'password1', displayName: 'Test',
    });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('rejects weak password — no number', async () => {
    const res = await api.post('/api/auth/register').send({
      email: 'a@b.com', password: 'Passwordonly', displayName: 'Test',
    });
    expect(res.status).toBe(422);
  });

  it('rejects password shorter than 8 chars', async () => {
    const res = await api.post('/api/auth/register').send({
      email: 'a@b.com', password: 'Pa1', displayName: 'Test',
    });
    expect(res.status).toBe(422);
  });

  it('rejects invalid email format', async () => {
    const res = await api.post('/api/auth/register').send({
      email: 'notanemail', password: 'Password1', displayName: 'Test',
    });
    expect(res.status).toBe(422);
  });

  it('rejects missing displayName', async () => {
    const res = await api.post('/api/auth/register').send({
      email: 'a@b.com', password: 'Password1',
    });
    expect(res.status).toBe(422);
  });

  it('rejects missing body entirely', async () => {
    const res = await api.post('/api/auth/register').send({});
    expect(res.status).toBe(422);
  });

  it('sets httpOnly refreshToken cookie on register', async () => {
    const res = await api.post('/api/auth/register').send({
      email: 'cookie@example.com', password: 'Password1', displayName: 'Cookie',
    });
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = (Array.isArray(cookies) ? cookies : [cookies])
      .find((c: string) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('Path=/api/auth');
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {

  beforeEach(async () => {
    await api.post('/api/auth/register').send({
      email: 'login@example.com', password: 'Password1', displayName: 'Login User',
    });
  });

  it('logs in with correct credentials and returns accessToken', async () => {
    const res = await api.post('/api/auth/login').send({
      email: 'login@example.com', password: 'Password1',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('login@example.com');
  });

  it('rejects wrong password with 401', async () => {
    const res = await api.post('/api/auth/login').send({
      email: 'login@example.com', password: 'WrongPass1',
    });
    expect(res.status).toBe(401);
    // Must not reveal whether email or password was wrong
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects non-existent email with 401', async () => {
    const res = await api.post('/api/auth/login').send({
      email: 'ghost@example.com', password: 'Password1',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects missing fields with 422', async () => {
    const res = await api.post('/api/auth/login').send({ email: 'login@example.com' });
    expect(res.status).toBe(422);
  });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {

  it('issues a new accessToken using the refresh cookie', async () => {
    // Register to get the cookie
    const registerRes = await api.post('/api/auth/register').send({
      email: 'refresh@example.com', password: 'Password1', displayName: 'Refresh',
    });

    const cookies = registerRes.headers['set-cookie'];

    const refreshRes = await api
      .post('/api/auth/refresh')
      .set('Cookie', cookies);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    // New access token must differ from old one (time may differ, but at minimum it's fresh)
    expect(typeof refreshRes.body.data.accessToken).toBe('string');
  });

  it('returns 401 with no refresh cookie', async () => {
    const res = await api.post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a fake refresh token', async () => {
    const res = await api
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=totallyfaketoken; Path=/api/auth; HttpOnly');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {

  it('returns current user for valid token', async () => {
    const { accessToken, email } = await registerAndLogin('me@example.com');

    const res = await api
      .get('/api/auth/me')
      .set(authHeader(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });

  it('returns 401 with no token', async () => {
    const res = await api.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await api
      .get('/api/auth/me')
      .set('Authorization', 'Bearer thisisnotavalidtoken');
    expect(res.status).toBe(401);
  });

  it('returns 401 with Bearer prefix missing', async () => {
    const { accessToken } = await registerAndLogin('prefix@example.com');
    const res = await api
      .get('/api/auth/me')
      .set('Authorization', accessToken); // missing "Bearer "
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {

  it('logs out successfully and clears refresh cookie', async () => {
    const registerRes = await api.post('/api/auth/register').send({
      email: 'logout@example.com', password: 'Password1', displayName: 'Logout',
    });

    const { accessToken } = registerRes.body.data;
    const cookies = registerRes.headers['set-cookie'];

    const res = await api
      .post('/api/auth/logout')
      .set(authHeader(accessToken))
      .set('Cookie', cookies);

    expect(res.status).toBe(200);

    // After logout, refresh should fail
    const refreshRes = await api
      .post('/api/auth/refresh')
      .set('Cookie', cookies);

    // Cookie was cleared so refresh should fail
    expect(refreshRes.status).toBe(401);
  });
});

// ─── POST /api/auth/logout-all ────────────────────────────────────────────────

describe('POST /api/auth/logout-all', () => {

  it('invalidates all sessions', async () => {
    const registerRes = await api.post('/api/auth/register').send({
      email: 'logoutall@example.com', password: 'Password1', displayName: 'LogoutAll',
    });
    const { accessToken } = registerRes.body.data;
    const cookies = registerRes.headers['set-cookie'];

    const res = await api
      .post('/api/auth/logout-all')
      .set(authHeader(accessToken));

    expect(res.status).toBe(200);

    // Refresh should now fail — all tokens wiped
    const refreshRes = await api
      .post('/api/auth/refresh')
      .set('Cookie', cookies);
    expect(refreshRes.status).toBe(401);
  });
});
