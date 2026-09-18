import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { jest } from "@jest/globals";

// Rate limiters would trip on supertest's shared 127.0.0.1 origin.
// Replace the middleware with a passthrough.
jest.unstable_mockModule("express-rate-limit", () => ({
  default: () => (_req, _res, next) => next(),
}));

// Env the controller reads at module load.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "x".repeat(64);
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_test_dummy";

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

// Silence expected console.error output from error-path tests.
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
});