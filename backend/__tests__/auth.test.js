import express from "express";
import request from "supertest";

// Dynamic import so the limiter mock in setup.js is active first.
const { default: authRoutes } = await import("../routes/auth.js");

// Minimal app — boots only the auth router, no cron/worker/Mongo.
const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

const user = {
  name: "Test User",
  email: "test@example.com",
  password: "CorrectHorse1!",
};

describe("POST /api/auth/register", () => {
  it("creates a user and returns token + safe user shape", async () => {
    const res = await request(app).post("/api/auth/register").send(user);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      name: user.name,
      email: user.email,
      role: "owner",
    });
    expect(res.body.user.id).toEqual(expect.any(String));
    expect(res.body.user.workspaceId).toEqual(expect.any(String));
    expect(res.body.user.hasGithubConnected).toBe(false);
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("rejects a duplicate email with 400", async () => {
    await request(app).post("/api/auth/register").send(user);
    const res = await request(app).post("/api/auth/register").send(user);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it("rejects a password under 8 chars", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...user, password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });

  it("rejects a name under 2 chars", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...user, name: "A" });

    expect(res.status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...user, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email/i);
  });

  it("normalizes email casing and trims whitespace", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...user, email: "  Test@EXAMPLE.com  " });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("test@example.com");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(user);
  });

  it("returns a token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(user.email);
  });

  it("accepts case-insensitive email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "TEST@EXAMPLE.COM", password: user.password });

    expect(res.status).toBe(200);
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "WrongPassword1!" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it("rejects an unknown email with 401 (same message as wrong password)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "anything" });

    expect(res.status).toBe(401);
    // Same message for both cases — prevents user enumeration.
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it("rejects a missing email or password with 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email });

    expect(res.status).toBe(400);
  });
});