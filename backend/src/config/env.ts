/**
 * Validates all required environment variables on startup.
 * The app will crash immediately with a clear message rather than
 * failing silently at runtime when a var is missing.
 */

interface EnvConfig {
  NODE_ENV: string;
  PORT: string;
  MONGO_URI: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  CLIENT_URL: string;
  COOKIE_SECRET: string;
}

const REQUIRED_VARS: (keyof EnvConfig)[] = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'CLIENT_URL',
  'COOKIE_SECRET',
];

export const validateEnv = (): void => {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nCopy .env.example to .env and fill in the values.');
    process.exit(1);
  }

  // Warn if using weak secrets in production
  if (process.env.NODE_ENV === 'production') {
    const weakSecrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET'];
    for (const key of weakSecrets) {
      const val = process.env[key] || '';
      if (val.length < 32) {
        console.error(`❌ ${key} must be at least 32 characters in production`);
        process.exit(1);
      }
    }
  }

  console.log('✅ Environment variables validated');
};

// Typed access to env vars — use this instead of process.env throughout the app
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI: process.env.MONGO_URI!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL!,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  COOKIE_SECRET: process.env.COOKIE_SECRET!,
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',
};
