import 'dotenv/config';
import mongoose from 'mongoose';
import { CompanyModel } from '../src/models/Company';
import { RefIDModel } from '../src/models/RefID';
import { generateRefIDCode } from '../src/utils/refid';

const email = 'talent@nimbuslabs.example.test';
const password = 'DemoCompany123!';
const jobTitle = 'Full Stack Engineer';

const seedCompany = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined. Set it in backend/.env.');
  await mongoose.connect(uri);

  let company = await CompanyModel.findOne({ email }).select('+password');
  if (!company) company = new CompanyModel({ email });
  company.name = 'Nimbus Labs';
  company.password = password;
  company.slug = 'nmb';
  company.website = 'https://nimbuslabs.example.test';
  company.industry = 'Software Development';
  company.isVerified = true;
  await company.save();

  let refID = await RefIDModel.findOne({ companyId: company._id, jobTitle });
  if (!refID) {
    refID = new RefIDModel({
      code: generateRefIDCode(company.slug, jobTitle),
      companyId: company._id,
      jobTitle,
    });
  }
  refID.requestedFields = [
    { section: 'professional_summary' },
    { section: 'work_experience' },
    { section: 'education' },
    { section: 'projects' },
    { section: 'skills' },
  ];
  refID.accessDuration = 30;
  refID.isActive = true;
  await refID.save();

  console.log(`Seeded demo company: Nimbus Labs`);
  console.log(`Login: ${email} (password: ${password})`);
  console.log(`Demo job access code: ${refID.code}`);
};

void seedCompany()
  .catch((error: unknown) => { console.error('Company seed failed:', error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
