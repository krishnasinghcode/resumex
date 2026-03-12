import type { SectionKey } from '@/types/vault.types';

// ─── Section metadata (labels, icons, descriptions) ──────────────────────────

export interface SectionConfig {
  label:       string;
  icon:        string;
  description: string;
  singleton:   boolean;
}

export const SECTION_CONFIG: Record<SectionKey, SectionConfig> = {
  personal_info:        { label: 'Personal Info',        icon: '👤', description: 'Name, contact details, social links', singleton: true },
  professional_summary: { label: 'Professional Summary', icon: '📝', description: 'Headline, bio, career goals',          singleton: true },
  work_experience:      { label: 'Work Experience',      icon: '💼', description: 'Jobs, internships, freelance work',    singleton: false },
  education:            { label: 'Education',            icon: '🎓', description: 'Degrees, courses, certifications',    singleton: false },
  projects:             { label: 'Projects',             icon: '🚀', description: 'Personal and team projects',          singleton: false },
  skills:               { label: 'Skills',               icon: '⚡', description: 'Technical and soft skills',          singleton: false },
  certifications:       { label: 'Certifications',       icon: '🏆', description: 'Courses and certificates',           singleton: false },
  achievements:         { label: 'Achievements',         icon: '🥇', description: 'Awards and recognition',            singleton: false },
  publications:         { label: 'Publications',         icon: '📄', description: 'Papers, articles, blog posts',       singleton: false },
  references:           { label: 'References',           icon: '🤝', description: 'Professional references',            singleton: false },
  legal_compliance:     { label: 'Legal & Compliance',   icon: '📋', description: 'Work authorisation, visa status',    singleton: true },
  resume_docs:          { label: 'Resume Documents',     icon: '📁', description: 'Uploaded resume and cover letter files', singleton: false },
  assessment_data:      { label: 'Assessments',          icon: '📊', description: 'Test scores and coding challenges',  singleton: false },
  application_metadata: { label: 'Applications',         icon: '📨', description: 'Job application tracker',           singleton: false },
};

// ─── Field definitions ────────────────────────────────────────────────────────

export type FieldType = 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea' | 'select' | 'checkbox' | 'tags' | 'url';

export interface FieldConfig {
  name:         string;
  label:        string;
  type:         FieldType;
  required?:    boolean;
  placeholder?: string;
  options?:     string[];                              // for select
  requiredWhen?: (values: Record<string, unknown>) => boolean; // conditional required
  helperText?:  string;
}

export const SECTION_FIELDS: Record<SectionKey, FieldConfig[]> = {

  personal_info: [
    { name: 'firstName', label: 'First Name',   type: 'text',  required: true,  placeholder: 'John' },
    { name: 'lastName',  label: 'Last Name',    type: 'text',  required: true,  placeholder: 'Doe' },
    { name: 'email',     label: 'Email',        type: 'email', required: true,  placeholder: 'john@example.com' },
    { name: 'phone',     label: 'Phone',        type: 'tel',   placeholder: '+1-555-0100' },
    { name: 'linkedIn',  label: 'LinkedIn URL', type: 'url',   placeholder: 'linkedin.com/in/johndoe' },
    { name: 'github',    label: 'GitHub URL',   type: 'url',   placeholder: 'github.com/johndoe' },
    { name: 'portfolio', label: 'Portfolio',    type: 'url',   placeholder: 'johndoe.dev' },
    { name: 'website',   label: 'Website',      type: 'url',   placeholder: 'example.com' },
  ],

  professional_summary: [
    { name: 'headline',          label: 'Headline',            type: 'text',     required: true, placeholder: 'Full Stack Developer | MERN + TypeScript' },
    { name: 'bio',               label: 'Bio',                 type: 'textarea', placeholder: 'A short paragraph about you...' },
    { name: 'currentRole',       label: 'Current Role',        type: 'text',     placeholder: 'SWE Intern at Google' },
    { name: 'yearsOfExperience', label: 'Years of Experience', type: 'number',   placeholder: '2' },
    { name: 'targetRoles',       label: 'Target Roles',        type: 'tags',     placeholder: 'e.g. SWE Intern, Full Stack Engineer' },
    { name: 'openToWork',        label: 'Open to Work',        type: 'checkbox' },
  ],

  work_experience: [
    { name: 'company',        label: 'Company',         type: 'text',    required: true, placeholder: 'Google' },
    { name: 'title',          label: 'Job Title',       type: 'text',    required: true, placeholder: 'SWE Intern' },
    { name: 'location',       label: 'Location',        type: 'text',    placeholder: 'Mountain View, CA' },
    { name: 'employmentType', label: 'Employment Type', type: 'select',  options: ['full-time', 'part-time', 'contract', 'internship', 'freelance'] },
    { name: 'startDate',      label: 'Start Date',      type: 'date',    required: true },
    { name: 'isCurrent',      label: 'Currently working here', type: 'checkbox' },
    { name: 'endDate',        label: 'End Date',        type: 'date',    requiredWhen: (v) => !v.isCurrent },
    { name: 'description',    label: 'Description',     type: 'textarea', placeholder: 'What did you build or achieve?' },
    { name: 'techUsed',       label: 'Technologies Used', type: 'tags',  placeholder: 'e.g. React, TypeScript' },
    { name: 'highlights',     label: 'Highlights',      type: 'tags',    placeholder: 'e.g. Reduced latency by 20%' },
  ],

  education: [
    { name: 'institution',       label: 'Institution',         type: 'text',     required: true, placeholder: 'IIT Bombay' },
    { name: 'degree',            label: 'Degree',              type: 'text',     placeholder: 'B.Tech' },
    { name: 'field',             label: 'Field of Study',      type: 'text',     placeholder: 'Computer Science' },
    { name: 'gpa',               label: 'GPA / CGPA',          type: 'number',   placeholder: '8.7' },
    { name: 'startDate',         label: 'Start Date',          type: 'date' },
    { name: 'isCurrent',         label: 'Currently studying',  type: 'checkbox' },
    { name: 'endDate',           label: 'End Date',            type: 'date',     requiredWhen: (v) => !v.isCurrent },
    { name: 'relevantCoursework', label: 'Relevant Coursework', type: 'tags',   placeholder: 'e.g. Data Structures, OS' },
    { name: 'achievements',      label: 'Achievements',        type: 'tags',     placeholder: 'e.g. Dean\'s List' },
  ],

  projects: [
    { name: 'name',        label: 'Project Name',  type: 'text',     required: true, placeholder: 'ResumeX' },
    { name: 'description', label: 'Description',   type: 'textarea', placeholder: 'What does it do?' },
    { name: 'techStack',   label: 'Tech Stack',    type: 'tags',     placeholder: 'e.g. Node.js, TypeScript' },
    { name: 'repoUrl',     label: 'Repo URL',      type: 'url',      placeholder: 'github.com/user/project' },
    { name: 'liveUrl',     label: 'Live URL',      type: 'url',      placeholder: 'myproject.com' },
    { name: 'isCurrent',   label: 'Ongoing project', type: 'checkbox' },
    { name: 'startDate',   label: 'Start Date',    type: 'date' },
    { name: 'endDate',     label: 'End Date',      type: 'date',     requiredWhen: (v) => !v.isCurrent },
    { name: 'highlights',  label: 'Highlights',    type: 'tags',     placeholder: 'e.g. 500+ GitHub stars' },
    { name: 'category',    label: 'Category',      type: 'select',   options: ['web', 'mobile', 'ml', 'devtools', 'other'] },
  ],

  skills: [
    { name: 'name',              label: 'Skill Name',          type: 'text',   required: true, placeholder: 'TypeScript' },
    { name: 'proficiency',       label: 'Proficiency',         type: 'select', options: ['beginner', 'intermediate', 'advanced', 'expert'] },
    { name: 'category',          label: 'Category',            type: 'text',   placeholder: 'language, framework, tool, soft skill' },
    { name: 'yearsOfExperience', label: 'Years of Experience', type: 'number', placeholder: '2' },
  ],

  certifications: [
    { name: 'name',          label: 'Certificate Name', type: 'text', required: true, placeholder: 'AWS Certified Developer' },
    { name: 'issuer',        label: 'Issuer',           type: 'text', placeholder: 'Amazon Web Services' },
    { name: 'issueDate',     label: 'Issue Date',       type: 'date' },
    { name: 'expiryDate',    label: 'Expiry Date',      type: 'date' },
    { name: 'credentialId',  label: 'Credential ID',    type: 'text', placeholder: 'ABC-123' },
    { name: 'credentialUrl', label: 'Credential URL',   type: 'url',  placeholder: 'verify.example.com/abc' },
  ],

  achievements: [
    { name: 'title',        label: 'Achievement Title', type: 'text',     required: true, placeholder: '1st Place Hackathon' },
    { name: 'organization', label: 'Organisation',      type: 'text',     placeholder: 'IIT Bombay' },
    { name: 'date',         label: 'Date',              type: 'date' },
    { name: 'description',  label: 'Description',       type: 'textarea', placeholder: 'What did you achieve?' },
  ],

  publications: [
    { name: 'title',         label: 'Title',          type: 'text',     required: true, placeholder: 'Research paper title' },
    { name: 'publisher',     label: 'Publisher',      type: 'text',     placeholder: 'IEEE' },
    { name: 'publishedDate', label: 'Published Date', type: 'date' },
    { name: 'url',           label: 'URL',            type: 'url',      placeholder: 'doi.org/...' },
    { name: 'coAuthors',     label: 'Co-Authors',     type: 'tags',     placeholder: 'e.g. Jane Smith' },
    { name: 'abstract',      label: 'Abstract',       type: 'textarea', placeholder: 'Brief summary...' },
  ],

  references: [
    { name: 'name',         label: 'Full Name',    type: 'text',  required: true, placeholder: 'Dr. Jane Smith' },
    { name: 'company',      label: 'Company',      type: 'text',  placeholder: 'Google' },
    { name: 'relationship', label: 'Relationship', type: 'text',  placeholder: 'Manager, Professor' },
    { name: 'email',        label: 'Email',        type: 'email', placeholder: 'jane@example.com' },
    { name: 'phone',        label: 'Phone',        type: 'tel',   placeholder: '+1-555-0100' },
    { name: 'linkedIn',     label: 'LinkedIn',     type: 'url',   placeholder: 'linkedin.com/in/jane' },
  ],

  legal_compliance: [
    { name: 'workAuthorization',     label: 'Work Authorisation', type: 'select', options: ['Citizen', 'Permanent Resident', 'H1-B', 'OPT', 'CPT', 'Other'] },
    { name: 'visaStatus',            label: 'Visa Status',        type: 'text',   placeholder: 'Optional details' },
    { name: 'requiresSponsorship',   label: 'Requires Sponsorship',      type: 'checkbox' },
    { name: 'willingToRelocate',     label: 'Willing to Relocate',       type: 'checkbox' },
    { name: 'willingToTravel',       label: 'Willing to Travel',         type: 'checkbox' },
    { name: 'backgroundCheckConsent', label: 'Background Check Consent', type: 'checkbox' },
  ],

  resume_docs: [
    { name: 'fileName', label: 'File Name', type: 'text', required: true, placeholder: 'Resume_JohnDoe_2024.pdf' },
    { name: 'fileUrl',  label: 'File URL',  type: 'url',  required: true, placeholder: 'https://drive.google.com/...' },
    { name: 'docType',  label: 'Document Type', type: 'select', options: ['resume', 'cover_letter', 'portfolio', 'other'] },
    { name: 'fileType', label: 'File Type', type: 'text', placeholder: 'PDF' },
  ],

  assessment_data: [
    { name: 'type',      label: 'Assessment Type', type: 'select',   required: true, options: ['coding_challenge', 'skills_test', 'interview', 'other'] },
    { name: 'platform',  label: 'Platform',        type: 'text',     placeholder: 'HackerRank, LeetCode' },
    { name: 'score',     label: 'Score',           type: 'number',   placeholder: '85' },
    { name: 'maxScore',  label: 'Max Score',       type: 'number',   placeholder: '100' },
    { name: 'date',      label: 'Date',            type: 'date' },
    { name: 'resultUrl', label: 'Result URL',      type: 'url',      placeholder: 'https://...' },
    { name: 'notes',     label: 'Notes',           type: 'textarea', placeholder: 'Any additional notes' },
  ],

  application_metadata: [
    { name: 'company',   label: 'Company',      type: 'text',   required: true, placeholder: 'Stripe' },
    { name: 'role',      label: 'Role',         type: 'text',   placeholder: 'SWE Intern' },
    { name: 'status',    label: 'Status',       type: 'select', options: ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'] },
    { name: 'appliedAt', label: 'Applied Date', type: 'date' },
    { name: 'jobUrl',    label: 'Job Posting',  type: 'url',    placeholder: 'https://...' },
    { name: 'notes',     label: 'Notes',        type: 'textarea', placeholder: 'Any notes about this application' },
  ],
};
