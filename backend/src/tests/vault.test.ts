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

// ─── GET /api/vault/meta ──────────────────────────────────────────────────────

describe('GET /api/vault/meta', () => {

  it('returns all 14 sections in initial incomplete state', async () => {
    const res = await api
      .get('/api/vault/meta')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(200);
    const sections = res.body.data.sections;
    expect(Object.keys(sections)).toHaveLength(14);

    const expectedKeys = [
      'personal_info', 'professional_summary', 'work_experience',
      'education', 'projects', 'skills', 'certifications',
      'achievements', 'publications', 'references', 'legal_compliance',
      'resume_docs', 'assessment_data', 'application_metadata',
    ];
    expectedKeys.forEach(key => expect(sections[key]).toBeDefined());
  });

  it('requires authentication', async () => {
    const res = await api.get('/api/vault/meta');
    expect(res.status).toBe(401);
  });

  it('updates isComplete after adding an entry', async () => {
    await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send(factories.workExperience());

    const meta = await api
      .get('/api/vault/meta')
      .set(authHeader(user.accessToken));

    const sections = meta.body.data.sections;
    expect(sections.work_experience.isComplete).toBe(true);
    expect(sections.work_experience.entryCount).toBe(1);
    // Untouched section should still be incomplete
    expect(sections.education.isComplete).toBe(false);
  });
});

// ─── GET /api/vault/section/:key ─────────────────────────────────────────────

describe('GET /api/vault/section/:key', () => {

  it('returns a section with empty entries initially', async () => {
    const res = await api
      .get('/api/vault/section/work_experience')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.entries).toEqual([]);
    expect(res.body.data.isPrivate).toBe(false);
  });

  it('rejects invalid section key with 400', async () => {
    const res = await api
      .get('/api/vault/section/fake_section')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await api.get('/api/vault/section/skills');
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/vault/section/:key/entry — SINGLETON ──────────────────────────

describe('POST /api/vault/section/personal_info/entry (singleton)', () => {

  it('saves personal info and returns section with 1 entry', async () => {
    const res = await api
      .post('/api/vault/section/personal_info/entry')
      .set(authHeader(user.accessToken))
      .send(factories.personalInfo());

    expect(res.status).toBe(201);
    expect(res.body.data.entries).toHaveLength(1);
    expect(res.body.data.entries[0].firstName).toBe('John');
    expect(res.body.data.entries[0]._id).toBeDefined();
  });

  it('overwrites existing singleton — always exactly 1 entry', async () => {
    await api
      .post('/api/vault/section/personal_info/entry')
      .set(authHeader(user.accessToken))
      .send(factories.personalInfo());

    // Post again with different data
    await api
      .post('/api/vault/section/personal_info/entry')
      .set(authHeader(user.accessToken))
      .send({ ...factories.personalInfo(), firstName: 'Jane' });

    const section = await api
      .get('/api/vault/section/personal_info')
      .set(authHeader(user.accessToken));

    expect(section.body.data.entries).toHaveLength(1);
    expect(section.body.data.entries[0].firstName).toBe('Jane');
  });

  it('rejects missing required fields (firstName, lastName, email)', async () => {
    const res = await api
      .post('/api/vault/section/personal_info/entry')
      .set(authHeader(user.accessToken))
      .send({ phone: '+1-555-0100' }); // missing firstName, lastName, email

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('marks section as complete in meta after saving', async () => {
    await api
      .post('/api/vault/section/personal_info/entry')
      .set(authHeader(user.accessToken))
      .send(factories.personalInfo());

    const meta = await api
      .get('/api/vault/meta')
      .set(authHeader(user.accessToken));

    const sections = meta.body.data.sections;
    expect(sections.personal_info.isComplete).toBe(true);
    expect(sections.personal_info.entryCount).toBe(1);
  });
});

// ─── POST /api/vault/section/:key/entry — COLLECTION ─────────────────────────

describe('POST /api/vault/section/work_experience/entry (collection)', () => {

  it('adds an entry and returns the section', async () => {
    const res = await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send(factories.workExperience());

    expect(res.status).toBe(201);
    expect(res.body.data.entries).toHaveLength(1);
    expect(res.body.data.entries[0].company).toBe('Google');
    expect(res.body.data.entries[0]._id).toBeDefined();
  });

  it('appends multiple entries — each gets a unique _id', async () => {
    await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send(factories.workExperience({ company: 'Google' }));

    await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send(factories.workExperience({ company: 'Stripe' }));

    const section = await api
      .get('/api/vault/section/work_experience')
      .set(authHeader(user.accessToken));

    expect(section.body.data.entries).toHaveLength(2);
    const ids = section.body.data.entries.map((e: any) => e._id);
    expect(ids[0]).not.toBe(ids[1]); // UUIDs must be unique
  });

  it('rejects missing required fields (company, title, startDate)', async () => {
    const res = await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send({ description: 'Missing required fields' });

    expect(res.status).toBe(422);
    expect(res.body.errors.some((e: string) => e.includes('company'))).toBe(true);
    expect(res.body.errors.some((e: string) => e.includes('title'))).toBe(true);
  });

  it('requires endDate when isCurrent is false', async () => {
    const res = await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send({
        company:   'Google',
        title:     'Intern',
        startDate: '2024-06-01',
        isCurrent: false,
        // no endDate
      });

    expect(res.status).toBe(422);
  });

  it('updates entryCount in meta after each add', async () => {
    await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send(factories.workExperience({ company: 'A' }));

    await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send(factories.workExperience({ company: 'B' }));

    const meta = await api
      .get('/api/vault/meta')
      .set(authHeader(user.accessToken));

    const sections = meta.body.data.sections;
    expect(sections.work_experience.entryCount).toBe(2);
  });
});

// ─── PATCH /api/vault/section/:key/entry/:id ─────────────────────────────────

describe('PATCH /api/vault/section/:key/entry/:id', () => {

  it('updates specific fields in an entry', async () => {
    const addRes = await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send(factories.workExperience());

    const entryId = addRes.body.data.entries[0]._id;

    const updateRes = await api
      .patch(`/api/vault/section/work_experience/entry/${entryId}`)
      .set(authHeader(user.accessToken))
      .send({ description: 'Updated description', highlights: ['20% speed improvement'] });

    expect(updateRes.status).toBe(200);
    const updated = updateRes.body.data.entries.find((e: any) => e._id === entryId);
    expect(updated.description).toBe('Updated description');
    expect(updated.highlights).toContain('20% speed improvement');
    // Untouched fields should be preserved
    expect(updated.company).toBe('Google');
  });

  it('cannot overwrite _id via update', async () => {
    const addRes = await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send(factories.workExperience());

    const originalId = addRes.body.data.entries[0]._id;

    await api
      .patch(`/api/vault/section/work_experience/entry/${originalId}`)
      .set(authHeader(user.accessToken))
      .send({ _id: 'hacked-id', company: 'Evil Corp' });

    const section = await api
      .get('/api/vault/section/work_experience')
      .set(authHeader(user.accessToken));

    const entry = section.body.data.entries[0];
    expect(entry._id).toBe(originalId); // _id unchanged
    expect(entry.company).toBe('Evil Corp'); // other field updated fine
  });

  it('returns 400 when update body is empty', async () => {
    const addRes = await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send(factories.workExperience());

    const entryId = addRes.body.data.entries[0]._id;

    const res = await api
      .patch(`/api/vault/section/work_experience/entry/${entryId}`)
      .set(authHeader(user.accessToken))
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/vault/section/:key/entry/:id ─────────────────────────────────

describe('DELETE /api/vault/section/:key/entry/:id', () => {

  it('removes the entry and decrements entryCount in meta', async () => {
    const addRes = await api
      .post('/api/vault/section/work_experience/entry')
      .set(authHeader(user.accessToken))
      .send(factories.workExperience());

    const entryId = addRes.body.data.entries[0]._id;

    const delRes = await api
      .delete(`/api/vault/section/work_experience/entry/${entryId}`)
      .set(authHeader(user.accessToken));

    expect(delRes.status).toBe(200);
    expect(delRes.body.data.entries).toHaveLength(0);

    const meta = await api
      .get('/api/vault/meta')
      .set(authHeader(user.accessToken));

    const sections = meta.body.data.sections;
    expect(sections.work_experience.isComplete).toBe(false);
    expect(sections.work_experience.entryCount).toBe(0);
  });

  it('deleting one entry keeps others intact', async () => {
    const add1 = await api
      .post('/api/vault/section/projects/entry')
      .set(authHeader(user.accessToken))
      .send(factories.project({ name: 'Project A' }));

    await api
      .post('/api/vault/section/projects/entry')
      .set(authHeader(user.accessToken))
      .send(factories.project({ name: 'Project B' }));

    const idToDelete = add1.body.data.entries[0]._id;

    await api
      .delete(`/api/vault/section/projects/entry/${idToDelete}`)
      .set(authHeader(user.accessToken));

    const section = await api
      .get('/api/vault/section/projects')
      .set(authHeader(user.accessToken));

    expect(section.body.data.entries).toHaveLength(1);
    expect(section.body.data.entries[0].name).toBe('Project B');
  });

  it('blocks deleting singleton section entry with 400', async () => {
    // First set personal info
    await api
      .post('/api/vault/section/personal_info/entry')
      .set(authHeader(user.accessToken))
      .send(factories.personalInfo());

    const section = await api
      .get('/api/vault/section/personal_info')
      .set(authHeader(user.accessToken));

    const entryId = section.body.data.entries[0]._id;

    const res = await api
      .delete(`/api/vault/section/personal_info/entry/${entryId}`)
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/vault/section/:key/privacy ────────────────────────────────────

describe('PATCH /api/vault/section/:key/privacy', () => {

  it('sets section isPrivate to true', async () => {
    const res = await api
      .patch('/api/vault/section/education/privacy')
      .set(authHeader(user.accessToken))
      .send({ isPrivate: true });

    expect(res.status).toBe(200);
    expect(res.body.data.isPrivate).toBe(true);
  });

  it('sets section isPrivate back to false', async () => {
    await api
      .patch('/api/vault/section/education/privacy')
      .set(authHeader(user.accessToken))
      .send({ isPrivate: true });

    const res = await api
      .patch('/api/vault/section/education/privacy')
      .set(authHeader(user.accessToken))
      .send({ isPrivate: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isPrivate).toBe(false);
  });

  it('rejects non-boolean isPrivate value', async () => {
    const res = await api
      .patch('/api/vault/section/education/privacy')
      .set(authHeader(user.accessToken))
      .send({ isPrivate: 'yes' });

    expect(res.status).toBe(400);
  });

  it('reflects updated privacy in vault meta', async () => {
    await api
      .patch('/api/vault/section/skills/privacy')
      .set(authHeader(user.accessToken))
      .send({ isPrivate: true });

    const meta = await api
      .get('/api/vault/meta')
      .set(authHeader(user.accessToken));

    const sections = meta.body.data.sections;
    expect(sections.skills.isPrivate).toBe(true);
  });
});

// ─── PATCH /api/vault/section/:key/entry/:id/privacy ─────────────────────────

describe('PATCH entry-level privacy', () => {

  it('toggles a single entry to private without affecting others', async () => {
    await api
      .post('/api/vault/section/skills/entry')
      .set(authHeader(user.accessToken))
      .send(factories.skill('TypeScript'));

    const add2 = await api
      .post('/api/vault/section/skills/entry')
      .set(authHeader(user.accessToken))
      .send(factories.skill('Python'));

    const entryId = add2.body.data.entries[1]._id;

    const res = await api
      .patch(`/api/vault/section/skills/entry/${entryId}/privacy`)
      .set(authHeader(user.accessToken))
      .send({ isPrivate: true });

    expect(res.status).toBe(200);

    const section = await api
      .get('/api/vault/section/skills')
      .set(authHeader(user.accessToken));

    const entries = section.body.data.entries;
    const tsEntry = entries.find((e: any) => e.name === 'TypeScript');
    const pyEntry = entries.find((e: any) => e.name === 'Python');

    expect(tsEntry.isPrivate).toBe(false); // unchanged
    expect(pyEntry.isPrivate).toBe(true);  // toggled
  });
});

// ─── GET /api/vault/export ────────────────────────────────────────────────────

describe('GET /api/vault/export', () => {

  it('exports full vault as structured JSON', async () => {
    // Add data to a couple sections
    await api
      .post('/api/vault/section/personal_info/entry')
      .set(authHeader(user.accessToken))
      .send(factories.personalInfo());

    await api
      .post('/api/vault/section/skills/entry')
      .set(authHeader(user.accessToken))
      .send(factories.skill('TypeScript'));

    const res = await api
      .get('/api/vault/export')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.vault).toBeDefined();
    expect(res.body.data.meta).toBeDefined();
    expect(res.body.data.vault.personal_info).toBeDefined();
    expect(res.body.data.vault.skills.entries).toHaveLength(1);
  });
});

// ─── Data isolation between users ────────────────────────────────────────────

describe('Vault isolation between users', () => {

  it("user A cannot read user B's vault data", async () => {
    const userB = await registerAndLogin('userb@example.com', 'Password1', 'User B');

    // User B adds a skill
    await api
      .post('/api/vault/section/skills/entry')
      .set(authHeader(userB.accessToken))
      .send(factories.skill('Python'));

    // User A's vault should be empty
    const res = await api
      .get('/api/vault/section/skills')
      .set(authHeader(user.accessToken));

    expect(res.body.data.entries).toHaveLength(0);
  });
});
