import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

// Runs once before the entire test suite
export default async function globalSetup() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Pass URI to tests via environment variable
  process.env.MONGO_URI = uri;
  process.env.NODE_ENV  = 'test';

  // Store instance so globalTeardown can shut it down
  (global as any).__MONGOD__ = mongod;

  console.log('\n🧪 In-memory MongoDB started:', uri);
}
