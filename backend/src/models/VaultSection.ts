import mongoose, { Document, Schema, Types } from 'mongoose';
import { SectionKey } from '../types';

// ─── Entry Schemas (one per section type) ────────────────────────────────────
// Each entry has a shared base + section-specific fields

const baseEntryFields = {
  _id: { type: String, required: true }, // We generate UUIDs in the service layer
  isPrivate: { type: Boolean, default: false },
};

// ── Singleton sections (one object, not array) ──

const PersonalInfoSchema = new Schema(
  {
    ...baseEntryFields,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zip: String,
    },
    linkedIn: String,
    github: String,
    portfolio: String,
    website: String,
  },
  { _id: false }
);

const ProfessionalSummarySchema = new Schema(
  {
    ...baseEntryFields,
    headline: String,
    bio: String,
    yearsOfExperience: Number,
    currentRole: String,
    targetRoles: [String],
    openToWork: { type: Boolean, default: false },
  },
  { _id: false }
);

const LegalComplianceSchema = new Schema(
  {
    ...baseEntryFields,
    workAuthorization: String,       // e.g. "Citizen", "H1-B", "OPT"
    visaStatus: String,
    requiresSponsorship: Boolean,
    backgroundCheckConsent: Boolean,
    willingToRelocate: Boolean,
    willingToTravel: Boolean,
  },
  { _id: false }
);

// ── Collection sections (array of entries) ──

const WorkExperienceEntrySchema = new Schema(
  {
    ...baseEntryFields,
    company: { type: String, required: true },
    title: { type: String, required: true },
    location: String,
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    },
    startDate: Date,
    endDate: Date,
    isCurrent: { type: Boolean, default: false },
    description: String,
    techUsed: [String],
    highlights: [String],
  },
  { _id: false }
);

const EducationEntrySchema = new Schema(
  {
    ...baseEntryFields,
    institution: { type: String, required: true },
    degree: String,
    field: String,
    gpa: Number,
    startDate: Date,
    endDate: Date,
    isCurrent: { type: Boolean, default: false },
    relevantCoursework: [String],
    achievements: [String],
  },
  { _id: false }
);

const ProjectEntrySchema = new Schema(
  {
    ...baseEntryFields,
    name: { type: String, required: true },
    description: String,
    techStack: [String],
    repoUrl: String,
    liveUrl: String,
    highlights: [String],
    startDate: Date,
    endDate: Date,
    isCurrent: { type: Boolean, default: false },
    category: String, // e.g. "web", "mobile", "ml"
  },
  { _id: false }
);

const SkillEntrySchema = new Schema(
  {
    ...baseEntryFields,
    name: { type: String, required: true },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    },
    category: String, // "frontend", "backend", "tools", "language", "soft"
    yearsOfExperience: Number,
  },
  { _id: false }
);

const CertificationEntrySchema = new Schema(
  {
    ...baseEntryFields,
    name: { type: String, required: true },
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String,
  },
  { _id: false }
);

const AchievementEntrySchema = new Schema(
  {
    ...baseEntryFields,
    title: { type: String, required: true },
    organization: String,
    date: Date,
    description: String,
  },
  { _id: false }
);

const PublicationEntrySchema = new Schema(
  {
    ...baseEntryFields,
    title: { type: String, required: true },
    publisher: String,
    publishedDate: Date,
    url: String,
    coAuthors: [String],
    abstract: String,
  },
  { _id: false }
);

const ReferenceEntrySchema = new Schema(
  {
    ...baseEntryFields,
    name: { type: String, required: true },
    company: String,
    relationship: String,
    email: String,
    phone: String,
    linkedIn: String,
  },
  { _id: false }
);

const ResumeDocEntrySchema = new Schema(
  {
    ...baseEntryFields,
    fileName: { type: String, required: true },
    fileType: String,
    fileUrl: String,         // URL after uploading to Cloudinary/S3
    docType: {
      type: String,
      enum: ['resume', 'cover_letter', 'portfolio', 'other'],
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AssessmentEntrySchema = new Schema(
  {
    ...baseEntryFields,
    type: String,           // "coding_challenge", "skills_test", "interview"
    platform: String,       // "HackerRank", "LeetCode", etc.
    score: Number,
    maxScore: Number,
    date: Date,
    notes: String,
    resultUrl: String,
  },
  { _id: false }
);

const ApplicationMetadataEntrySchema = new Schema(
  {
    ...baseEntryFields,
    company: { type: String, required: true },
    role: String,
    status: {
      type: String,
      enum: ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'],
      default: 'applied',
    },
    appliedAt: Date,
    jobUrl: String,
    notes: String,
    snapshotId: String,     // Which snapshot was used for this application
  },
  { _id: false }
);

// ─── Main VaultSection document ───────────────────────────────────────────────

export interface IVaultSection extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sectionKey: SectionKey;
  isPrivate: boolean;
  // For singleton sections, entries has exactly 0 or 1 item
  // For collection sections, entries has 0-N items
  entries: any[];
  createdAt: Date;
  updatedAt: Date;
}

const VaultSectionSchema = new Schema<IVaultSection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sectionKey: {
      type: String,
      required: true,
      index: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    entries: {
      type: [Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index — one section doc per user per section
VaultSectionSchema.index({ userId: 1, sectionKey: 1 }, { unique: true });

export const VaultSectionModel = mongoose.model<IVaultSection>(
  'VaultSection',
  VaultSectionSchema
);

// ─── Export entry schemas for validation in service layer ─────────────────────
export const SECTION_ENTRY_SCHEMAS: Record<SectionKey, Schema | null> = {
  personal_info: PersonalInfoSchema,
  professional_summary: ProfessionalSummarySchema,
  legal_compliance: LegalComplianceSchema,
  work_experience: WorkExperienceEntrySchema,
  education: EducationEntrySchema,
  projects: ProjectEntrySchema,
  skills: SkillEntrySchema,
  certifications: CertificationEntrySchema,
  achievements: AchievementEntrySchema,
  publications: PublicationEntrySchema,
  references: ReferenceEntrySchema,
  resume_docs: ResumeDocEntrySchema,
  assessment_data: AssessmentEntrySchema,
  application_metadata: ApplicationMetadataEntrySchema,
};
