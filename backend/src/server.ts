import 'dotenv/config';
import { validateEnv } from './config/env';

// Validate all env vars before doing anything else
validateEnv();

import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const start = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`\n🚀 ResumeX API running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`📋 Health:  http://localhost:${env.PORT}/api/health`);
    console.log(`🔐 Auth:    http://localhost:${env.PORT}/api/auth`);
    console.log(`🗄️  Vault:   http://localhost:${env.PORT}/api/vault\n`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err: Error) => {
    console.error('💥 Unhandled rejection:', err.message);
    server.close(() => process.exit(1));
  });
};

start();
