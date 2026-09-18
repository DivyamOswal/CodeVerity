import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { jest } from "@jest/globals";

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) await c.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

// Keep real email out of tests.
jest.unstable_mockModule("../utils/email.js", () => ({
  sendEmail: jest.fn().mockResolvedValue({ id: "test-email-id" }),
}));