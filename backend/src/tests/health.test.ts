import {
  api,
  connectTestDB,
  closeTestDB,
} from './setup/helpers';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await closeTestDB(); });

// ─── GET /api/health ──────────────────────────────────────────────────────────

describe('GET /api/health', () => {

  it('returns 200 with success status', async () => {
    const res = await api.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('running');
  });

  it('returns env and timestamp fields', async () => {
    const res = await api.get('/api/health');

    expect(res.body.data.env).toBeDefined();
    expect(res.body.data.timestamp).toBeDefined();
    expect(() => new Date(res.body.data.timestamp)).not.toThrow();
  });
});

// ─── 404 handling ─────────────────────────────────────────────────────────────

describe('404 — unknown routes', () => {

  it('returns 404 for an unknown GET route', async () => {
    const res = await api.get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('returns 404 for an unknown POST route', async () => {
    const res = await api.post('/api/does-not-exist').send({});
    expect(res.status).toBe(404);
  });

  it('returns JSON for 404 (not HTML)', async () => {
    const res = await api.get('/api/does-not-exist');
    expect(res.headers['content-type']).toContain('json');
  });
});

// ─── Response shape contract ──────────────────────────────────────────────────

describe('API response shape contract', () => {

  it('success responses always have { success: true, message, data }', async () => {
    const res = await api.get('/api/health');

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.message).toBe('string');
  });

  it('error responses always have { success: false, message }', async () => {
    const res = await api.post('/api/auth/login').send({});

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.message).toBe('string');
  });

  it('validation errors include an errors array', async () => {
    const res = await api.post('/api/auth/register').send({
      email:    'bad',
      password: 'weak',
    });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

// ─── Security headers ─────────────────────────────────────────────────────────

describe('Security headers (Helmet)', () => {

  it('includes X-Content-Type-Options header', async () => {
    const res = await api.get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('includes X-Frame-Options header', async () => {
    const res = await api.get('/api/health');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});
