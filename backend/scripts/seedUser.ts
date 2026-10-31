import 'dotenv/config';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { UserModel } from '../src/models/User';
import { VaultMetaModel } from '../src/models/VaultMeta';
import { VaultSectionModel } from '../src/models/VaultSection';
import { ALL_SECTION_KEYS, SectionKey } from '../src/types';

const email = 'maya.shah@example.test';
const password = 'DemoUser123!';

const demoSections: Partial<Record<SectionKey, Record<string, unknown>[]>> = {
  personal_info: [{
    _id: randomUUID(), firstName: 'Maya', lastName: 'Shah', email,
    phone: '+1-202-555-0147', address: { city: 'Seattle', state: 'Washington', country: 'United States' },
    linkedIn: 'https://www.linkedin.com/in/maya-shah-demo',
    github: 'https://github.com/maya-shah-demo', portfolio: 'https://maya-shah.example.test',
    isPrivate: false,
  }],
  professional_summary: [{
    _id: randomUUID(), headline: 'Full Stack Software Engineer',
    bio: 'Software engineer focused on building reliable, accessible web products. Experienced across React, TypeScript, Node.js, and cloud services, with a strong interest in developer tools and privacy-minded applications.',
    yearsOfExperience: 4, currentRole: 'Software Engineer at Northstar Labs',
    targetRoles: ['Senior Software Engineer', 'Full Stack Engineer'], openToWork: true, isPrivate: false,
  }],
  work_experience: [
    { _id: randomUUID(), company: 'Northstar Labs', title: 'Software Engineer', location: 'Seattle, WA', employmentType: 'full-time', startDate: new Date('2023-04-01'), isCurrent: true, description: 'Builds customer-facing collaboration products and internal platform services.', techUsed: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'], highlights: ['Reduced dashboard load time by 38% through query and rendering improvements.', 'Built accessible shared UI components adopted by four product teams.'], isPrivate: false },
    { _id: randomUUID(), company: 'Brightside Digital', title: 'Software Engineering Intern', location: 'Remote', employmentType: 'internship', startDate: new Date('2022-05-01'), endDate: new Date('2022-12-01'), isCurrent: false, description: 'Helped deliver features for a small-business analytics platform.', techUsed: ['React', 'JavaScript', 'Express', 'MongoDB'], highlights: ['Shipped interactive reporting filters used by over 200 pilot customers.'], isPrivate: false },
  ],
  education: [{ _id: randomUUID(), institution: 'University of Washington', degree: 'B.S.', field: 'Computer Science', gpa: 3.8, startDate: new Date('2018-09-01'), endDate: new Date('2022-06-15'), isCurrent: false, relevantCoursework: ['Data Structures and Algorithms', 'Database Systems', 'Human-Computer Interaction', 'Distributed Systems'], achievements: ['Dean’s List, 2020–2022'], isPrivate: false }],
  projects: [
    { _id: randomUUID(), name: 'OpenTrail', description: 'A community platform for discovering accessible hiking trails, with route notes and conditions shared by local visitors.', techStack: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Mapbox'], repoUrl: 'https://github.com/maya-shah-demo/opentrail', liveUrl: 'https://opentrail.example.test', highlights: ['Designed a mobile-first map and trail detail experience.', 'Added moderation tools and cached search results.'], startDate: new Date('2024-01-01'), isCurrent: true, category: 'web', isPrivate: false },
    { _id: randomUUID(), name: 'FocusFlow', description: 'A lightweight team planning app that turns project goals into weekly check-ins and progress summaries.', techStack: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL'], repoUrl: 'https://github.com/maya-shah-demo/focusflow', highlights: ['Implemented role-based workspaces and email reminders.'], startDate: new Date('2023-02-01'), endDate: new Date('2023-08-01'), isCurrent: false, category: 'web', isPrivate: false },
  ],
  skills: [
    { _id: randomUUID(), name: 'TypeScript', proficiency: 'advanced', category: 'language', yearsOfExperience: 4, isPrivate: false },
    { _id: randomUUID(), name: 'React', proficiency: 'advanced', category: 'frontend', yearsOfExperience: 4, isPrivate: false },
    { _id: randomUUID(), name: 'Node.js', proficiency: 'advanced', category: 'backend', yearsOfExperience: 3, isPrivate: false },
    { _id: randomUUID(), name: 'MongoDB', proficiency: 'intermediate', category: 'backend', yearsOfExperience: 2, isPrivate: false },
    { _id: randomUUID(), name: 'AWS', proficiency: 'intermediate', category: 'tools', yearsOfExperience: 2, isPrivate: false },
  ],
  certifications: [{ _id: randomUUID(), name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', issueDate: new Date('2023-11-01'), expiryDate: new Date('2026-11-01'), credentialId: 'DEMO-CCP-1042', credentialUrl: 'https://www.credly.com/users/maya-shah-demo', isPrivate: false }],
  achievements: [{ _id: randomUUID(), title: 'Northstar Engineering Impact Award', organization: 'Northstar Labs', date: new Date('2024-12-01'), description: 'Recognized for improving performance and accessibility across the customer dashboard.', isPrivate: false }],
  legal_compliance: [{ _id: randomUUID(), workAuthorization: 'Authorized to work in the United States', requiresSponsorship: false, backgroundCheckConsent: true, willingToRelocate: true, willingToTravel: true, isPrivate: true }],
};

const seedUser = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined. Set it in backend/.env.');
  await mongoose.connect(uri);

  let user = await UserModel.findOne({ email }).select('+password');
  if (!user) user = new UserModel({ email });
  user.displayName = 'Maya Shah';
  user.password = password;
  user.authProvider = 'local';
  user.isEmailVerified = true;
  user.role = 'user';
  await user.save();

  await VaultSectionModel.deleteMany({ userId: user._id });
  await VaultSectionModel.insertMany(ALL_SECTION_KEYS.map((sectionKey) => ({
    userId: user._id,
    sectionKey,
    isPrivate: sectionKey === 'legal_compliance',
    entries: demoSections[sectionKey] ?? [],
  })));

  const populatedSections = Object.fromEntries(ALL_SECTION_KEYS.map((key) => {
    const count = demoSections[key]?.length ?? 0;
    return [key, { isComplete: count > 0, isPrivate: key === 'legal_compliance', completedAt: count ? new Date() : null, entryCount: count }];
  }));
  await VaultMetaModel.findOneAndUpdate(
    { userId: user._id },
    { $set: { sections: populatedSections } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Seeded demo user: ${email} (password: ${password})`);
};

void seedUser()
  .catch((error: unknown) => { console.error('User seed failed:', error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
