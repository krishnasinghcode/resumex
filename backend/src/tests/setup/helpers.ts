import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../../app';

// ─── DB helpers ───────────────────────────────────────────────────────────────

export const connectTestDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI!);
  }
};

/**
 * Only drops collections — does NOT disconnect.
 * Disconnecting in each test file causes issues when jest runs multiple
 * suites in the same process (--runInBand). globalTeardown handles disconnect.
 */
export const closeTestDB = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
};

export const clearDB = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((col) => col.deleteMany({}))
  );
};

// ─── Supertest agent ──────────────────────────────────────────────────────────

export const api = supertest(app);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export interface TestUser {
  accessToken: string;
  userId:      string;
  email:       string;
}

export const registerAndLogin = async (
  email       = 'test@example.com',
  password    = 'Password1',
  displayName = 'Test User'
): Promise<TestUser> => {
  const res = await api
    .post('/api/auth/register')
    .send({ email, password, displayName });

  if (res.status !== 201) {
    throw new Error(`registerAndLogin failed: ${JSON.stringify(res.body)}`);
  }

  return {
    accessToken: res.body.data.accessToken,
    userId:      res.body.data.user._id,
    email:       res.body.data.user.email,
  };
};

export const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

// ─── Data factories ───────────────────────────────────────────────────────────

export const factories = {
  personalInfo: (override: Record<string, any> = {}) => ({
    firstName: 'John',
    lastName:  'Doe',
    email:     'john@example.com',
    phone:     '+1-555-0100',
    linkedIn:  'linkedin.com/in/johndoe',
    github:    'github.com/johndoe',
    ...override,
  }),

  workExperience: (override: Record<string, any> = {}) => ({
    company:     'Google',
    title:       'SWE Intern',
    startDate:   '2024-06-01',
    endDate:     '2024-08-31',
    isCurrent:   false,
    description: 'Built internal tooling',
    techUsed:    ['React', 'TypeScript'],
    ...override,
  }),

  education: (override: Record<string, any> = {}) => ({
    institution: 'IIT Bombay',
    degree:      'B.Tech',
    field:       'Computer Science',
    gpa:         8.7,
    startDate:   '2022-07-01',
    isCurrent:   true,
    ...override,
  }),

  project: (override: Record<string, any> = {}) => ({
    name:        'ResumeX',
    description: 'Personal data protocol for the job market',
    techStack:   ['Node.js', 'TypeScript', 'MongoDB'],
    repoUrl:     'github.com/user/resumex',
    ...override,
  }),

  skill: (name = 'TypeScript', proficiency = 'advanced', override: Record<string, any> = {}) => ({
    name,
    proficiency,
    category: 'language',
    ...override,
  }),

  certification: (override: Record<string, any> = {}) => ({
    name:      'AWS Certified Developer',
    issuer:    'Amazon Web Services',
    issueDate: '2024-01-15',
    ...override,
  }),

  achievement: (override: Record<string, any> = {}) => ({
    title:        '1st Place Hackathon',
    organization: 'IIT Bombay',
    date:         '2024-03-01',
    description:  'Won with real-time code editor',
    ...override,
  }),
};
