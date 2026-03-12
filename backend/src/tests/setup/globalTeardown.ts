import { MongoMemoryServer } from 'mongodb-memory-server';

// Runs once after the entire test suite
export default async function globalTeardown() {
  const mongod: MongoMemoryServer = (global as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
    console.log('\n🧹 In-memory MongoDB stopped');
  }
}
