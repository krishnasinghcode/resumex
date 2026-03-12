import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test env vars BEFORE app.ts or env.ts are imported
// This prevents validateEnv() from calling process.exit(1) during tests
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
