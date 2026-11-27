import 'dotenv/config';
import mongoose from 'mongoose';

const clearDatabase = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined. Set it in backend/.env.');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to clear a database when NODE_ENV=production.');
  }

  await mongoose.connect(uri);
  const databaseName = mongoose.connection.name;
  if (!databaseName.includes('resumex')) {
    throw new Error(`Refusing to clear database "${databaseName}". Database name must include "resumex".`);
  }

  await mongoose.connection.dropDatabase();
  console.log(`Cleared database: ${databaseName}`);
};

void clearDatabase()
  .catch((error: unknown) => { console.error('Database clear failed:', error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
