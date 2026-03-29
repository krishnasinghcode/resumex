# ResumeX API

Personal Data Protocol for the job market. Users store profile data once, control privacy per field, and companies request structured JSON access via a consent flow.

---

## Tech Stack

- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (access + refresh tokens) + Google OAuth 2.0
- **Security**: Helmet, CORS, bcrypt, rate limiting, httpOnly cookies

---

## Setup

### 1. Prerequisites

- Node.js v18+
- MongoDB running locally (`mongod`) OR a MongoDB Atlas URI

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/resumex

JWT_ACCESS_SECRET=some_long_random_string_min_32_chars
JWT_REFRESH_SECRET=another_long_random_string_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=get_from_google_cloud_console
GOOGLE_CLIENT_SECRET=get_from_google_cloud_console
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

CLIENT_URL=http://localhost:3000
COOKIE_SECRET=yet_another_random_string
```

> For `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`:
> Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID
> Add `http://localhost:5000/api/auth/google/callback` as an authorized redirect URI.
> If you just want to test JWT auth, you can put dummy values for Google vars — Google OAuth simply won't work but everything else will.

### 4. Run in development

```bash
npm run dev
```

Server starts at `http://localhost:5000`

### 5. Verify it's running

```
GET http://localhost:5000/api/health
```

Expected:
```json
{
  "success": true,
  "message": "ResumeX API is running 🚀",
  "data": { "env": "development", "timestamp": "..." }
}
```

---

## Testing with Postman

### Import the collection

Import `ResumeX.postman_collection.json` from the project root into Postman.

The collection has a `base_url` variable set to `http://localhost:5000` and an `access_token` variable that gets auto-set after login/register.

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get access token |
| POST | `/api/auth/refresh` | ❌ (cookie) | Refresh access token |
| POST | `/api/auth/logout` | ✅ | Logout current session |
| POST | `/api/auth/logout-all` | ✅ | Logout all devices |
| GET | `/api/auth/me` | ✅ | Get current user from token |
| GET | `/api/auth/google` | ❌ | Start Google OAuth flow |
| GET | `/api/auth/google/callback` | ❌ | Google OAuth callback |

### User

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/user/profile` | ✅ | Get full user profile |
| PATCH | `/api/user/profile` | ✅ | Update displayName or avatar |
| PATCH | `/api/user/change-password` | ✅ | Change password |
| DELETE | `/api/user/account` | ✅ | Delete account + all vault data |

### Vault

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/vault/meta` | ✅ | Dashboard overview (completion status of all 14 sections) |
| GET | `/api/vault/export` | ✅ | Full vault as structured JSON |
| GET | `/api/vault/search?q=react` | ✅ | Search across all sections |
| GET | `/api/vault/section/:key` | ✅ | Get one section's data |
| POST | `/api/vault/section/:key/entry` | ✅ | Add entry (or set data for singletons) |
| PATCH | `/api/vault/section/:key/entry/:id` | ✅ | Update an entry |
| DELETE | `/api/vault/section/:key/entry/:id` | ✅ | Delete an entry |
| PATCH | `/api/vault/section/:key/privacy` | ✅ | Toggle section privacy |
| PATCH | `/api/vault/section/:key/entry/:id/privacy` | ✅ | Toggle entry privacy |

### Valid section keys

```
personal_info        professional_summary   work_experience
education            projects               skills
certifications       achievements           publications
references           legal_compliance       resume_docs
assessment_data      application_metadata
```

---

## Testing Flow (Manual — step by step)

### Step 1: Register

```
POST /api/auth/register
Body: {
  "email": "test@example.com",
  "password": "Password1",
  "displayName": "Test User"
}
```

Save the `accessToken` from the response.

### Step 2: Check vault meta (all 14 sections should be empty)

```
GET /api/vault/meta
Authorization: Bearer <accessToken>
```

### Step 3: Fill personal info (singleton section)

```
POST /api/vault/section/personal_info/entry
Authorization: Bearer <accessToken>
Body: {
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "linkedIn": "linkedin.com/in/johndoe",
  "github": "github.com/johndoe"
}
```

### Step 4: Add a work experience entry (collection section)

```
POST /api/vault/section/work_experience/entry
Authorization: Bearer <accessToken>
Body: {
  "company": "Google",
  "title": "Software Engineer Intern",
  "startDate": "2024-06-01",
  "endDate": "2024-08-31",
  "isCurrent": false,
  "description": "Built internal tooling for the Ads team",
  "techUsed": ["React", "TypeScript", "Python"]
}
```

### Step 5: Add another work experience entry

```
POST /api/vault/section/work_experience/entry
Body: {
  "company": "Startup XYZ",
  "title": "Full Stack Dev",
  "startDate": "2024-09-01",
  "isCurrent": true,
  "techUsed": ["Next.js", "MongoDB"]
}
```

### Step 6: Check vault meta again (work_experience should now be complete)

```
GET /api/vault/meta
```

### Step 7: Add a project

```
POST /api/vault/section/projects/entry
Body: {
  "name": "ResumeX",
  "description": "Personal data protocol for the job market",
  "techStack": ["Node.js", "TypeScript", "MongoDB", "React"],
  "repoUrl": "github.com/you/resumex"
}
```

### Step 8: Add skills

```
POST /api/vault/section/skills/entry
Body: { "name": "TypeScript", "proficiency": "advanced", "category": "language" }

POST /api/vault/section/skills/entry
Body: { "name": "React", "proficiency": "intermediate", "category": "frontend" }
```

### Step 9: Search across the vault

```
GET /api/vault/search?q=typescript
```

Should return hits from both skills and work_experience sections.

### Step 10: Make one entry private

Get the `_id` of the Startup XYZ work experience entry from Step 5's response, then:

```
PATCH /api/vault/section/work_experience/entry/<entryId>/privacy
Body: { "isPrivate": true }
```

### Step 11: Make entire education section private

```
PATCH /api/vault/section/education/privacy
Body: { "isPrivate": true }
```

### Step 12: Export the full vault

```
GET /api/vault/export
```

### Step 13: Update an entry

Get the `_id` of the Google work experience entry, then:

```
PATCH /api/vault/section/work_experience/entry/<entryId>
Body: {
  "description": "Built internal tooling that reduced ad serving latency by 20%"
}
```

### Step 14: Delete an entry

```
DELETE /api/vault/section/work_experience/entry/<entryId>
```

### Step 15: Test token refresh

```
POST /api/auth/refresh
(no body — uses the refreshToken httpOnly cookie automatically)
```

### Step 16: Logout

```
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

### Step 17: Verify token is invalid after logout

```
GET /api/vault/meta
Authorization: Bearer <accessToken>
```
Should still work (access token is stateless — it expires in 15min).
After 15 min it will return 401. This is expected JWT behaviour.

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot connect to MongoDB` | MongoDB not running | Run `mongod` or check Atlas URI |
| `Missing required environment variables` | .env not filled | Copy .env.example, fill all values |
| `Email already registered` | Duplicate register | Use a different email |
| `Invalid email or password` | Wrong credentials | Check email/password |
| `No token provided` | Missing Authorization header | Add `Bearer <token>` header |
| `Access token expired` | Token is >15min old | Call POST /api/auth/refresh |
| `Invalid sectionKey` | Typo in section name | Check valid keys list above |
| `Entry validation failed` | Missing required fields | Check the required fields per section below |

### Required fields per section

- `personal_info`: firstName, lastName, email
- `professional_summary`: headline
- `work_experience`: company, title, startDate (+ endDate if isCurrent is false)
- `education`: institution
- `projects`: name
- `skills`: name
- `certifications`: name
- `achievements`: title
- `publications`: title
- `references`: name
- `resume_docs`: fileName, fileUrl
- `assessment_data`: type
- `application_metadata`: company
- `legal_compliance`: no required fields

---

## Scripts

```bash
npm run dev      # Development with hot reload (ts-node-dev)
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled JS (production)
```
