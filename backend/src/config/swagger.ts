import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ResumeX API',
      version: '1.0.0',
      description: `
## Personal Data Protocol for the Job Market

Users store professional data once, control privacy per field, and share structured access with companies.

### How to authenticate
1. **Register** or **Login** below to get an \`accessToken\`
2. Click the **Authorize 🔒** button at the top right
3. Enter: \`Bearer <your_accessToken>\`
4. All protected endpoints will now work

> **Tip:** The refresh token is set as an httpOnly cookie automatically — you don't need to handle it manually here.
      `,
      contact: {
        name: 'ResumeX',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development',
      },
    ],
    // ── Security scheme ────────────────────────────────────────────────────────
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your accessToken here. Get it from /api/auth/login or /api/auth/register',
        },
      },
      // ── Reusable schemas ────────────────────────────────────────────────────
      schemas: {
        // ── Success / Error wrappers ──
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data:    { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong' },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors:  { type: 'array', items: { type: 'string' }, example: ['email is required', 'password must be at least 8 characters'] },
          },
        },

        // ── Auth ──
        RegisterBody: {
          type: 'object',
          required: ['email', 'password', 'displayName'],
          properties: {
            email:       { type: 'string', format: 'email', example: 'john@example.com' },
            password:    { type: 'string', example: 'Password1', description: 'Min 8 chars, 1 uppercase, 1 number' },
            displayName: { type: 'string', example: 'John Doe' },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'Password1' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id:             { type: 'string', example: '663f1a2b4e1234567890abcd' },
            email:           { type: 'string', example: 'john@example.com' },
            displayName:     { type: 'string', example: 'John Doe' },
            avatar:          { type: 'string', example: 'https://example.com/avatar.jpg' },
            authProvider:    { type: 'string', enum: ['local', 'google'] },
            isEmailVerified: { type: 'boolean' },
            role:            { type: 'string', enum: ['user', 'company'] },
            createdAt:       { type: 'string', format: 'date-time' },
          },
        },

        // ── Vault ──
        SectionKey: {
          type: 'string',
          enum: [
            'personal_info', 'professional_summary', 'work_experience',
            'education', 'projects', 'skills', 'certifications',
            'achievements', 'publications', 'references', 'legal_compliance',
            'resume_docs', 'assessment_data', 'application_metadata',
          ],
        },
        SectionMeta: {
          type: 'object',
          properties: {
            isComplete:  { type: 'boolean' },
            isPrivate:   { type: 'boolean' },
            entryCount:  { type: 'number' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        VaultSection: {
          type: 'object',
          properties: {
            _id:        { type: 'string' },
            userId:     { type: 'string' },
            sectionKey: { $ref: '#/components/schemas/SectionKey' },
            isPrivate:  { type: 'boolean' },
            entries:    { type: 'array', items: { type: 'object' } },
            createdAt:  { type: 'string', format: 'date-time' },
            updatedAt:  { type: 'string', format: 'date-time' },
          },
        },
        PrivacyBody: {
          type: 'object',
          required: ['isPrivate'],
          properties: {
            isPrivate: { type: 'boolean', example: true },
          },
        },

        // ── Entry body examples per section ──
        PersonalInfoBody: {
          type: 'object',
          required: ['firstName', 'lastName', 'email'],
          properties: {
            firstName: { type: 'string', example: 'John' },
            lastName:  { type: 'string', example: 'Doe' },
            email:     { type: 'string', example: 'john@example.com' },
            phone:     { type: 'string', example: '+1-555-0100' },
            linkedIn:  { type: 'string', example: 'linkedin.com/in/johndoe' },
            github:    { type: 'string', example: 'github.com/johndoe' },
            portfolio: { type: 'string', example: 'johndoe.dev' },
          },
        },
        WorkExperienceBody: {
          type: 'object',
          required: ['company', 'title', 'startDate'],
          properties: {
            company:        { type: 'string', example: 'Google' },
            title:          { type: 'string', example: 'SWE Intern' },
            location:       { type: 'string', example: 'Mountain View, CA' },
            employmentType: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'], example: 'internship' },
            startDate:      { type: 'string', example: '2024-06-01' },
            endDate:        { type: 'string', example: '2024-08-31' },
            isCurrent:      { type: 'boolean', example: false },
            description:    { type: 'string', example: 'Built internal tooling for the Ads team' },
            techUsed:       { type: 'array', items: { type: 'string' }, example: ['React', 'TypeScript'] },
          },
        },
        SkillBody: {
          type: 'object',
          required: ['name'],
          properties: {
            name:        { type: 'string', example: 'TypeScript' },
            proficiency: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'], example: 'advanced' },
            category:    { type: 'string', example: 'language' },
          },
        },
        ProjectBody: {
          type: 'object',
          required: ['name'],
          properties: {
            name:        { type: 'string', example: 'ResumeX' },
            description: { type: 'string', example: 'Personal data protocol for the job market' },
            techStack:   { type: 'array', items: { type: 'string' }, example: ['Node.js', 'TypeScript', 'MongoDB'] },
            repoUrl:     { type: 'string', example: 'github.com/user/resumex' },
            liveUrl:     { type: 'string', example: 'resumex.app' },
          },
        },
        EducationBody: {
          type: 'object',
          required: ['institution'],
          properties: {
            institution: { type: 'string', example: 'IIT Bombay' },
            degree:      { type: 'string', example: 'B.Tech' },
            field:       { type: 'string', example: 'Computer Science' },
            gpa:         { type: 'number', example: 8.7 },
            startDate:   { type: 'string', example: '2022-07-01' },
            isCurrent:   { type: 'boolean', example: true },
          },
        },
      },

      // ── Reusable responses ────────────────────────────────────────────────
      responses: {
        Unauthorized: {
          description: 'No token provided or token is invalid/expired',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ValidationError: {
          description: 'Request body failed validation',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },

    // ── Tags (groups in the UI) ───────────────────────────────────────────────
    tags: [
      { name: 'Auth',        description: 'Register, login, token refresh, logout, Google OAuth' },
      { name: 'User',        description: 'Profile management, password change, account deletion' },
      { name: 'Vault',       description: 'Read vault overview and export' },
      { name: 'Vault CRUD',  description: 'Add, update, delete entries in any section' },
      { name: 'Privacy',     description: 'Toggle privacy on sections and individual entries' },
      { name: 'Search',      description: 'Search across all vault sections' },
      { name: 'Health',      description: 'Server health check' },
    ],

    // ── Paths (all 21 endpoints) ──────────────────────────────────────────────
    paths: {

      // ── Health ──────────────────────────────────────────────────────────────
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Server health check',
          responses: {
            200: { description: 'API is running', content: { 'application/json': { example: { success: true, message: 'ResumeX API is running 🚀', data: { env: 'development', timestamp: '2024-01-01T00:00:00.000Z' } } } } },
          },
        },
      },

      // ── Auth ─────────────────────────────────────────────────────────────────
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          description: 'Creates a user account and bootstraps a fresh vault with 14 empty sections. Returns an access token.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
          },
          responses: {
            201: { description: 'Registration successful', content: { 'application/json': { example: { success: true, message: 'Registration successful', data: { accessToken: 'eyJ...', user: { _id: '...', email: 'john@example.com', displayName: 'John Doe', role: 'user' } } } } } },
            409: { description: 'Email already registered' },
            422: { $ref: '#/components/responses/ValidationError' },
            429: { $ref: '#/components/responses/TooManyRequests' },
          },
        },
      },

      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          description: 'Returns an access token. Sets a refresh token as an httpOnly cookie.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
          },
          responses: {
            200: { description: 'Login successful', content: { 'application/json': { example: { success: true, message: 'Login successful', data: { accessToken: 'eyJ...', user: { _id: '...', email: 'john@example.com' } } } } } },
            401: { description: 'Invalid email or password' },
            422: { $ref: '#/components/responses/ValidationError' },
            429: { $ref: '#/components/responses/TooManyRequests' },
          },
        },
      },

      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          description: 'Uses the httpOnly refresh token cookie to issue a new access token. The old refresh token is rotated out and a new one is set.',
          responses: {
            200: { description: 'Token refreshed', content: { 'application/json': { example: { success: true, message: 'Token refreshed', data: { accessToken: 'eyJ...' } } } } },
            401: { description: 'No refresh token cookie / invalid / reuse detected' },
          },
        },
      },

      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout current device',
          description: 'Removes the current refresh token from the server and clears the cookie.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Logged out successfully' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/auth/logout-all': {
        post: {
          tags: ['Auth'],
          summary: 'Logout all devices',
          description: 'Wipes all stored refresh tokens for this user — every device gets logged out.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Logged out from all devices' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user from token',
          description: 'Decodes the access token and returns the payload. Does not hit the database.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Authenticated user', content: { 'application/json': { example: { success: true, message: 'Authenticated user', data: { user: { userId: '...', email: 'john@example.com', role: 'user' } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/auth/google': {
        get: {
          tags: ['Auth'],
          summary: 'Start Google OAuth flow',
          description: 'Redirects to Google\'s login page. Cannot be tested here — open this URL in a browser tab.',
          responses: {
            302: { description: 'Redirect to Google' },
          },
        },
      },

      // ── User ─────────────────────────────────────────────────────────────────
      '/api/user/profile': {
        get: {
          tags: ['User'],
          summary: 'Get user profile',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Profile retrieved', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
        patch: {
          tags: ['User'],
          summary: 'Update profile',
          description: 'Only `displayName` and `avatar` can be updated. Email and role cannot be changed here.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { displayName: { type: 'string', example: 'John Updated' }, avatar: { type: 'string', example: 'https://example.com/new-avatar.jpg' } } } } },
          },
          responses: {
            200: { description: 'Profile updated' },
            400: { description: 'No allowed fields provided' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/user/change-password': {
        patch: {
          tags: ['User'],
          summary: 'Change password',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string', example: 'Password1' }, newPassword: { type: 'string', example: 'NewPassword2' } } } } },
          },
          responses: {
            200: { description: 'Password changed successfully' },
            400: { description: 'New password same as old / too short / missing fields' },
            401: { description: 'Wrong current password or unauthenticated' },
          },
        },
      },

      '/api/user/account': {
        delete: {
          tags: ['User'],
          summary: 'Delete account',
          description: '⚠️ Permanently deletes the user account AND all vault data. Requires password confirmation.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['password'], properties: { password: { type: 'string', example: 'Password1' } } } } },
          },
          responses: {
            200: { description: 'Account and all data permanently deleted' },
            400: { description: 'Password confirmation missing' },
            401: { description: 'Wrong password or unauthenticated' },
          },
        },
      },

      // ── Vault Overview ───────────────────────────────────────────────────────
      '/api/vault/meta': {
        get: {
          tags: ['Vault'],
          summary: 'Get vault dashboard',
          description: 'Returns completion state, privacy state, and entry count for all 14 sections. Use this for the dashboard — does not load actual entry data.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Vault meta retrieved',
              content: { 'application/json': { example: { success: true, message: 'Vault meta retrieved', data: { userId: '...', sections: { personal_info: { isComplete: true, isPrivate: false, entryCount: 1, completedAt: '2024-01-01T00:00:00.000Z' }, work_experience: { isComplete: false, isPrivate: false, entryCount: 0, completedAt: null } } } } } },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/vault/export': {
        get: {
          tags: ['Vault'],
          summary: 'Export full vault as JSON',
          description: 'Returns all 14 sections with all their entries. Useful for debugging or exporting data.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Full vault exported' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // ── Search ───────────────────────────────────────────────────────────────
      '/api/vault/search': {
        get: {
          tags: ['Search'],
          summary: 'Search across all vault sections',
          description: 'Case-insensitive substring search across all string fields in all sections. Returns matching entry IDs, section keys, and matched field snippets.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 }, example: 'react', description: 'Search query (min 2 characters)' },
            { name: 'includePrivate', in: 'query', required: false, schema: { type: 'boolean', default: true }, description: 'Set false to exclude private sections and entries' },
          ],
          responses: {
            200: { description: 'Search results', content: { 'application/json': { example: { success: true, data: { query: 'react', count: 2, results: [{ sectionKey: 'skills', entryId: 'uuid', matchedFields: [{ field: 'name', value: 'React' }] }] } } } } },
            400: { description: 'Query missing or too short' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // ── Vault CRUD ───────────────────────────────────────────────────────────
      '/api/vault/section/{sectionKey}': {
        get: {
          tags: ['Vault CRUD'],
          summary: 'Get a section and all its entries',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'sectionKey', in: 'path', required: true, schema: { $ref: '#/components/schemas/SectionKey' } },
          ],
          responses: {
            200: { description: 'Section retrieved', content: { 'application/json': { schema: { $ref: '#/components/schemas/VaultSection' } } } },
            400: { description: 'Invalid section key' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/vault/section/{sectionKey}/entry': {
        post: {
          tags: ['Vault CRUD'],
          summary: 'Add entry (collection) or set data (singleton)',
          description: `**Collection sections** (work_experience, skills, projects, education, etc.): pushes a new entry to the array.

**Singleton sections** (personal_info, professional_summary, legal_compliance): replaces the entire data — always keeps exactly 1 entry.

**Required fields per section:**
- \`personal_info\`: firstName, lastName, email
- \`professional_summary\`: headline
- \`work_experience\`: company, title, startDate (+ endDate if isCurrent is false)
- \`education\`: institution
- \`projects\`: name
- \`skills\`: name
- \`certifications\`: name
- \`achievements\`: title
- \`publications\`: title
- \`references\`: name
- \`resume_docs\`: fileName, fileUrl
- \`assessment_data\`: type
- \`application_metadata\`: company`,
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'sectionKey', in: 'path', required: true, schema: { $ref: '#/components/schemas/SectionKey' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
                examples: {
                  personal_info:        { summary: 'personal_info',        value: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+1-555-0100', linkedIn: 'linkedin.com/in/johndoe', github: 'github.com/johndoe' } },
                  professional_summary: { summary: 'professional_summary', value: { headline: 'Full Stack Developer | MERN + TypeScript', bio: 'CS student building scalable web apps', openToWork: true, targetRoles: ['SWE Intern', 'Full Stack Engineer'] } },
                  work_experience:      { summary: 'work_experience',       value: { company: 'Google', title: 'SWE Intern', startDate: '2024-06-01', endDate: '2024-08-31', isCurrent: false, description: 'Built internal tooling', techUsed: ['React', 'TypeScript'] } },
                  education:            { summary: 'education',             value: { institution: 'IIT Bombay', degree: 'B.Tech', field: 'Computer Science', gpa: 8.7, startDate: '2022-07-01', isCurrent: true } },
                  projects:             { summary: 'projects',              value: { name: 'ResumeX', description: 'Personal data protocol', techStack: ['Node.js', 'TypeScript', 'MongoDB'], repoUrl: 'github.com/user/resumex' } },
                  skills:               { summary: 'skills',                value: { name: 'TypeScript', proficiency: 'advanced', category: 'language' } },
                  certifications:       { summary: 'certifications',        value: { name: 'AWS Certified Developer', issuer: 'Amazon Web Services', issueDate: '2024-01-15' } },
                  achievements:         { summary: 'achievements',          value: { title: '1st Place Hackathon', organization: 'IIT Bombay', date: '2024-03-01' } },
                  legal_compliance:     { summary: 'legal_compliance',      value: { workAuthorization: 'Citizen', requiresSponsorship: false, willingToRelocate: true } },
                  application_metadata: { summary: 'application_metadata',  value: { company: 'Stripe', role: 'SWE Intern', status: 'applied', appliedAt: '2025-03-01' } },
                },
              },
            },
          },
          responses: {
            201: { description: 'Entry saved', content: { 'application/json': { schema: { $ref: '#/components/schemas/VaultSection' } } } },
            400: { description: 'Invalid section key' },
            401: { $ref: '#/components/responses/Unauthorized' },
            422: { $ref: '#/components/responses/ValidationError' },
          },
        },
      },

      '/api/vault/section/{sectionKey}/entry/{entryId}': {
        patch: {
          tags: ['Vault CRUD'],
          summary: 'Update an entry',
          description: 'Partial update — only the fields you send get updated. `_id` and `isPrivate` are ignored (use the privacy endpoint for privacy).',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'sectionKey', in: 'path', required: true, schema: { $ref: '#/components/schemas/SectionKey' } },
            { name: 'entryId', in: 'path', required: true, schema: { type: 'string' }, description: 'The _id of the entry (UUID)' },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' }, example: { description: 'Updated description', highlights: ['20% latency reduction'] } } },
          },
          responses: {
            200: { description: 'Entry updated' },
            400: { description: 'Invalid section key or empty update body' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Vault CRUD'],
          summary: 'Delete an entry',
          description: 'Only works on collection sections. Singleton sections (personal_info, professional_summary, legal_compliance) cannot have entries deleted — use POST to overwrite instead.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'sectionKey', in: 'path', required: true, schema: { $ref: '#/components/schemas/SectionKey' } },
            { name: 'entryId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Entry deleted' },
            400: { description: 'Cannot delete from singleton section' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // ── Privacy ──────────────────────────────────────────────────────────────
      '/api/vault/section/{sectionKey}/privacy': {
        patch: {
          tags: ['Privacy'],
          summary: 'Toggle section privacy',
          description: 'Marks the entire section as private or public. Private sections are excluded from company access and search (when includePrivate=false).',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'sectionKey', in: 'path', required: true, schema: { $ref: '#/components/schemas/SectionKey' } },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PrivacyBody' } } },
          },
          responses: {
            200: { description: 'Section privacy updated' },
            400: { description: 'isPrivate must be a boolean' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/vault/section/{sectionKey}/entry/{entryId}/privacy': {
        patch: {
          tags: ['Privacy'],
          summary: 'Toggle entry privacy',
          description: 'Marks a single entry as private or public without affecting the rest of the section.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'sectionKey', in: 'path', required: true, schema: { $ref: '#/components/schemas/SectionKey' } },
            { name: 'entryId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PrivacyBody' } } },
          },
          responses: {
            200: { description: 'Entry privacy updated' },
            400: { description: 'isPrivate must be a boolean' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
    },
  },
  apis: [], // all docs are inline above, not in JSDoc comments
};

export const swaggerSpec = swaggerJsdoc(options);
