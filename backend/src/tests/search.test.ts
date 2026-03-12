import {
  api,
  connectTestDB,
  closeTestDB,
  clearDB,
  registerAndLogin,
  authHeader,
  factories,
  TestUser,
} from './setup/helpers';

// ─── Setup ────────────────────────────────────────────────────────────────────

let user: TestUser;

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await closeTestDB(); });
beforeEach(async () => {
  await clearDB();
  user = await registerAndLogin();
});

// ─── Seed helper ──────────────────────────────────────────────────────────────

const seedVault = async (token: string) => {
  // Skills
  await api
    .post('/api/vault/section/skills/entry')
    .set(authHeader(token))
    .send(factories.skill('TypeScript', 'advanced'));

  await api
    .post('/api/vault/section/skills/entry')
    .set(authHeader(token))
    .send(factories.skill('Python', 'intermediate'));

  // Work experience mentioning React
  await api
    .post('/api/vault/section/work_experience/entry')
    .set(authHeader(token))
    .send(factories.workExperience({
      company:     'Google',
      description: 'Built dashboards with React and TypeScript',
    }));

  // Project mentioning MongoDB
  await api
    .post('/api/vault/section/projects/entry')
    .set(authHeader(token))
    .send(factories.project({
      name:        'ResumeX',
      description: 'Built with MongoDB, Node.js and TypeScript',
    }));

  // Personal info
  await api
    .post('/api/vault/section/personal_info/entry')
    .set(authHeader(token))
    .send(factories.personalInfo({ firstName: 'SearchTest' }));
};

// ─── GET /api/vault/search?q= ─────────────────────────────────────────────────

describe('GET /api/vault/search', () => {

  it('finds results across multiple sections for a common term', async () => {
    await seedVault(user.accessToken);

    const res = await api
      .get('/api/vault/search?q=typescript')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBeGreaterThanOrEqual(2); // skills + work_experience
    expect(res.body.data.results.length).toBeGreaterThanOrEqual(2);

    const sectionKeys = res.body.data.results.map((r: any) => r.sectionKey);
    expect(sectionKeys).toContain('skills');
    expect(sectionKeys).toContain('work_experience');
  });

  it('returns correct result structure (sectionKey, entryId, matchedFields)', async () => {
    await seedVault(user.accessToken);

    const res = await api
      .get('/api/vault/search?q=python')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(200);
    const result = res.body.data.results[0];
    expect(result.sectionKey).toBeDefined();
    expect(result.entryId).toBeDefined();
    expect(result.matchedFields).toBeDefined();
    expect(Array.isArray(result.matchedFields)).toBe(true);
    expect(result.matchedFields[0].field).toBeDefined();
    expect(result.matchedFields[0].value).toBeDefined();
  });

  it('is case-insensitive', async () => {
    await seedVault(user.accessToken);

    const lowerRes = await api
      .get('/api/vault/search?q=typescript')
      .set(authHeader(user.accessToken));

    const upperRes = await api
      .get('/api/vault/search?q=TypeScript')
      .set(authHeader(user.accessToken));

    expect(lowerRes.body.data.count).toBe(upperRes.body.data.count);
  });

  it('returns 0 results for a term that does not exist', async () => {
    await seedVault(user.accessToken);

    const res = await api
      .get('/api/vault/search?q=xyznotexist')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(0);
    expect(res.body.data.results).toHaveLength(0);
  });

  it('returns 0 results on empty vault', async () => {
    // No seedVault — vault is empty
    const res = await api
      .get('/api/vault/search?q=react')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(0);
  });

  it('excludes private entries when includePrivate=false', async () => {
    await seedVault(user.accessToken);

    // Get skill entry id for Python
    const skillsSection = await api
      .get('/api/vault/section/skills')
      .set(authHeader(user.accessToken));

    const pythonEntry = skillsSection.body.data.entries.find(
      (e: any) => e.name === 'Python'
    );

    // Make Python skill private
    await api
      .patch(`/api/vault/section/skills/entry/${pythonEntry._id}/privacy`)
      .set(authHeader(user.accessToken))
      .send({ isPrivate: true });

    // Search with private entries included (default)
    const withPrivate = await api
      .get('/api/vault/search?q=python&includePrivate=true')
      .set(authHeader(user.accessToken));

    // Search excluding private entries
    const withoutPrivate = await api
      .get('/api/vault/search?q=python&includePrivate=false')
      .set(authHeader(user.accessToken));

    expect(withPrivate.body.data.count).toBeGreaterThan(0);
    expect(withoutPrivate.body.data.count).toBe(0);
  });

  it('excludes entire private sections when includePrivate=false', async () => {
    await seedVault(user.accessToken);

    // Make entire work_experience section private
    await api
      .patch('/api/vault/section/work_experience/privacy')
      .set(authHeader(user.accessToken))
      .send({ isPrivate: true });

    // Search for 'google' — it's in work_experience description
    const withPrivate = await api
      .get('/api/vault/search?q=google&includePrivate=true')
      .set(authHeader(user.accessToken));

    const withoutPrivate = await api
      .get('/api/vault/search?q=google&includePrivate=false')
      .set(authHeader(user.accessToken));

    expect(withPrivate.body.data.count).toBeGreaterThan(0);
    expect(withoutPrivate.body.data.count).toBe(0);
  });

  it('returns 400 for empty query string', async () => {
    const res = await api
      .get('/api/vault/search?q=')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(400);
  });

  it('returns 400 for single character query', async () => {
    const res = await api
      .get('/api/vault/search?q=a')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(400);
  });

  it('returns 400 when q param is missing entirely', async () => {
    const res = await api
      .get('/api/vault/search')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await api.get('/api/vault/search?q=react');
    expect(res.status).toBe(401);
  });

  it('results are isolated per user — user A does not see user B results', async () => {
    await seedVault(user.accessToken);

    const userB = await registerAndLogin('b@example.com', 'Password1', 'User B');
    // User B has empty vault

    const res = await api
      .get('/api/vault/search?q=typescript')
      .set(authHeader(userB.accessToken));

    expect(res.body.data.count).toBe(0);
  });
});
