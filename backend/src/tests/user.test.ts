import {
  api,
  connectTestDB,
  closeTestDB,
  clearDB,
  registerAndLogin,
  authHeader,
  TestUser,
} from './setup/helpers';

// ─── Setup ────────────────────────────────────────────────────────────────────

let user: TestUser;

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await closeTestDB(); });
beforeEach(async () => {
  await clearDB();
  user = await registerAndLogin('user@example.com', 'Password1', 'Original Name');
});

// ─── GET /api/user/profile ────────────────────────────────────────────────────

describe('GET /api/user/profile', () => {

  it('returns the user profile', async () => {
    const res = await api
      .get('/api/user/profile')
      .set(authHeader(user.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('user@example.com');
    expect(res.body.data.displayName).toBe('Original Name');
  });

  it('never returns password or refreshTokens fields', async () => {
    const res = await api
      .get('/api/user/profile')
      .set(authHeader(user.accessToken));

    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.refreshTokens).toBeUndefined();
  });

  it('returns 401 without a token', async () => {
    const res = await api.get('/api/user/profile');
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /api/user/profile ──────────────────────────────────────────────────

describe('PATCH /api/user/profile', () => {

  it('updates displayName successfully', async () => {
    const res = await api
      .patch('/api/user/profile')
      .set(authHeader(user.accessToken))
      .send({ displayName: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe('Updated Name');
  });

  it('updates avatar successfully', async () => {
    const res = await api
      .patch('/api/user/profile')
      .set(authHeader(user.accessToken))
      .send({ avatar: 'https://example.com/avatar.jpg' });

    expect(res.status).toBe(200);
    expect(res.body.data.avatar).toBe('https://example.com/avatar.jpg');
  });

  it('ignores non-allowed fields (email, role)', async () => {
    const res = await api
      .patch('/api/user/profile')
      .set(authHeader(user.accessToken))
      .send({ email: 'hacker@evil.com', role: 'company', displayName: 'Safe' });

    expect(res.status).toBe(200);
    // email must remain unchanged
    expect(res.body.data.email).toBe('user@example.com');
    // role must remain unchanged
    expect(res.body.data.role).toBe('user');
    // allowed field did update
    expect(res.body.data.displayName).toBe('Safe');
  });

  it('returns 400 when no allowed fields provided', async () => {
    const res = await api
      .patch('/api/user/profile')
      .set(authHeader(user.accessToken))
      .send({ email: 'hacker@evil.com' }); // only non-allowed field

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Nothing to update');
  });

  it('returns 401 without a token', async () => {
    const res = await api
      .patch('/api/user/profile')
      .send({ displayName: 'No Auth' });

    expect(res.status).toBe(401);
  });
});

// ─── PATCH /api/user/change-password ─────────────────────────────────────────

describe('PATCH /api/user/change-password', () => {

  it('changes password successfully with correct current password', async () => {
    const res = await api
      .patch('/api/user/change-password')
      .set(authHeader(user.accessToken))
      .send({ currentPassword: 'Password1', newPassword: 'NewPassword2' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('changed');
  });

  it('can login with new password after change', async () => {
    await api
      .patch('/api/user/change-password')
      .set(authHeader(user.accessToken))
      .send({ currentPassword: 'Password1', newPassword: 'NewPassword2' });

    const loginRes = await api
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'NewPassword2' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();
  });

  it('cannot login with old password after change', async () => {
    await api
      .patch('/api/user/change-password')
      .set(authHeader(user.accessToken))
      .send({ currentPassword: 'Password1', newPassword: 'NewPassword2' });

    const loginRes = await api
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password1' });

    expect(loginRes.status).toBe(401);
  });

  it('rejects wrong current password with 401', async () => {
    const res = await api
      .patch('/api/user/change-password')
      .set(authHeader(user.accessToken))
      .send({ currentPassword: 'WrongPass1', newPassword: 'NewPassword2' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('incorrect');
  });

  it('rejects new password same as current', async () => {
    const res = await api
      .patch('/api/user/change-password')
      .set(authHeader(user.accessToken))
      .send({ currentPassword: 'Password1', newPassword: 'Password1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('differ');
  });

  it('rejects new password shorter than 8 chars', async () => {
    const res = await api
      .patch('/api/user/change-password')
      .set(authHeader(user.accessToken))
      .send({ currentPassword: 'Password1', newPassword: 'Ab1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('8 characters');
  });

  it('rejects request with missing fields', async () => {
    const res = await api
      .patch('/api/user/change-password')
      .set(authHeader(user.accessToken))
      .send({ currentPassword: 'Password1' }); // missing newPassword

    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await api
      .patch('/api/user/change-password')
      .send({ currentPassword: 'Password1', newPassword: 'NewPassword2' });

    expect(res.status).toBe(401);
  });
});

// ─── DELETE /api/user/account ─────────────────────────────────────────────────

describe('DELETE /api/user/account', () => {

  it('deletes account with correct password confirmation', async () => {
    const res = await api
      .delete('/api/user/account')
      .set(authHeader(user.accessToken))
      .send({ password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');
  });

  it('cannot login after account deletion', async () => {
    await api
      .delete('/api/user/account')
      .set(authHeader(user.accessToken))
      .send({ password: 'Password1' });

    const loginRes = await api
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password1' });

    expect(loginRes.status).toBe(401);
  });

  it('deletes vault data along with account', async () => {
    // Add some vault data first
    await api
      .post('/api/vault/section/skills/entry')
      .set(authHeader(user.accessToken))
      .send({ name: 'TypeScript', proficiency: 'advanced' });

    // Delete account
    await api
      .delete('/api/user/account')
      .set(authHeader(user.accessToken))
      .send({ password: 'Password1' });

    // Re-register with same email — should work cleanly
    const newReg = await api.post('/api/auth/register').send({
      email:       'user@example.com',
      password:    'Password1',
      displayName: 'Fresh Start',
    });

    expect(newReg.status).toBe(201);

    // New user's vault should be empty
    const meta = await api
      .get('/api/vault/meta')
      .set(authHeader(newReg.body.data.accessToken));

    const sections = meta.body.data.sections;
    Object.values(sections).forEach((s: any) => {
      expect(s.isComplete).toBe(false);
    });
  });

  it('rejects wrong password confirmation', async () => {
    const res = await api
      .delete('/api/user/account')
      .set(authHeader(user.accessToken))
      .send({ password: 'WrongPass1' });

    expect(res.status).toBe(401);
  });

  it('rejects missing password confirmation', async () => {
    const res = await api
      .delete('/api/user/account')
      .set(authHeader(user.accessToken))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('required');
  });

  it('returns 401 without a token', async () => {
    const res = await api
      .delete('/api/user/account')
      .send({ password: 'Password1' });

    expect(res.status).toBe(401);
  });
});
