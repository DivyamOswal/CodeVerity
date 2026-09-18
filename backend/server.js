// backend/index.js
import dotenv from "dotenv";
dotenv.config();

// ═══════════════════════════════════════════════════════════════
//  ENV VALIDATION — must run before anything else
// ═══════════════════════════════════════════════════════════════
// Fails fast on boot if critical config is missing. Without this,
// the app starts and then throws cryptic errors at runtime (e.g.
// "ENCRYPTION_KEY must be a 64-character hex string" on the first
// GitHub OAuth callback instead of at deploy time).

const IS_PROD = process.env.NODE_ENV === "production";

// Each entry: [name, validatorFn, requiredInProd]
const ENV_RULES = [
  // ── Core ────────────────────────────────────────────────
  ["NODE_ENV", (v) => ["development", "production", "test"].includes(v), false],
  ["PORT", (v) => /^\d+$/.test(v), false],

  // ── Security ────────────────────────────────────────────
  ["JWT_SECRET", (v) => typeof v === "string" && v.length >= 32, true],
  [
    "ENCRYPTION_KEY",
    (v) => typeof v === "string" && /^[a-f0-9]{64}$/i.test(v),
    true,
  ],

  // ── Database ────────────────────────────────────────────
  ["MONGO_URI", (v) => typeof v === "string" && v.startsWith("mongodb"), true],

  // ── Frontend / CORS ─────────────────────────────────────
  [
    "FRONTEND_URL",
    (v) => {
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    },
    true,
  ],

  // ── Stripe ──────────────────────────────────────────────
  [
    "STRIPE_SECRET_KEY",
    (v) => typeof v === "string" && /^sk_(test|live)_/.test(v),
    true,
  ],
  [
    "STRIPE_WEBHOOK_SECRET",
    (v) => typeof v === "string" && v.startsWith("whsec_"),
    true,
  ],

  // ── AI ──────────────────────────────────────────────────
  ["GROQ_API_KEY", (v) => typeof v === "string" && v.length > 20, true],

  // ── Optional (recommended in prod) ─────────────────────
  ["GITHUB_TOKEN", (v) => typeof v === "string" && v.length > 20, false],
  [
    "SENTRY_DSN_BACKEND",
    (v) => typeof v === "string" && v.startsWith("https://"),
    false,
  ],
];

function validateEnv() {
  const errors = [];
  const warnings = [];
  const missingRequired = [];

  for (const [name, validate, requiredInProd] of ENV_RULES) {
    const value = process.env[name];
    const isRequired = requiredInProd && IS_PROD;

    if (value === undefined || value === "") {
      if (isRequired) {
        missingRequired.push(name);
      } else if (requiredInProd) {
        warnings.push(`${name} is not set (required in production)`);
      }
      continue;
    }

    if (!validate(value)) {
      errors.push(
        `${name} is set but invalid (length ${value.length}, first 3 chars "${value.slice(0, 3)}…")`,
      );
    }
  }

  if (missingRequired.length > 0) {
    console.error("❌ FATAL: Missing required environment variables:");
    for (const name of missingRequired) {
      console.error(`   - ${name}`);
    }
    console.error("\nSet these in your deployment environment and redeploy.");
    process.exit(1);
  }

  if (errors.length > 0) {
    console.error("❌ FATAL: Invalid environment variables:");
    for (const msg of errors) {
      console.error(`   - ${msg}`);
    }
    console.error("\nFix these values and redeploy.");
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn("⚠️  Environment warnings:");
    for (const msg of warnings) {
      console.warn(`   - ${msg}`);
    }
  }

  console.log(
    `✅ Environment validated (${ENV_RULES.length} rules, mode=${process.env.NODE_ENV || "development"})`,
  );
}

validateEnv();

// ═══════════════════════════════════════════════════════════════
//  SENTRY (must be after env validation, before express)
// ═══════════════════════════════════════════════════════════════
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN_BACKEND,
  environment: process.env.NODE_ENV || "development",
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.2,
  enabled:
    process.env.NODE_ENV === "production" && !!process.env.SENTRY_DSN_BACKEND,
  release: process.env.RENDER_GIT_COMMIT || undefined,
});

// ═══════════════════════════════════════════════════════════════
//  EXPRESS
// ═══════════════════════════════════════════════════════════════
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import connectDB from "./config/db.js";

// ─── Routes ────────────────────────────────────────────
import authRoutes from "./routes/auth.js";
import analyzeRoutes from "./routes/analyze.js";
import reportRoutes from "./routes/report.js";
import githubRoutes from "./routes/github.js";
import dashboardRoutes from "./routes/dashboard.js";
import billingRoutes from "./routes/billing.js";
import workspaceRoutes from "./routes/workspace.js";
import statsRoutes from "./routes/stats.js";
import adminRoutes from "./routes/admin.js";

import { startCleanupCron } from "./services/cleanupService.js";
import {
  startEmailQueueWorker,
  stopEmailQueueWorker,
} from "./services/emailQueue.js";

const app = express();

// ─── Trust proxy (before CORS / rate limiters) ────────
app.set("trust proxy", 1);

// ─── CORS ──────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length"],
    maxAge: 86400,
  }),
);

// ─── Security headers ──────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);

// ─── Body parsing (Stripe webhook needs raw body first) ─
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));

// ─── Request logging (dev only) ────────────────────────
if (!IS_PROD) {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── Rate Limiting ─────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const expensiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Analysis limit exceeded. Please wait a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", globalLimiter);
app.use("/api/github/analyze", expensiveLimiter);
app.use("/api/github/generate-tests", expensiveLimiter);
app.use("/api/github/auto-fix", expensiveLimiter);

// ═══════════════════════════════════════════════════════════════
//  HEALTH CHECK — richer info for monitoring and debugging
// ═══════════════════════════════════════════════════════════════
const MONGO_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

app.get("/health", (req, res) => {
  const mongoState = MONGO_STATES[mongoose.connection.readyState] || "unknown";
  const healthy = mongoState === "connected";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    version: process.env.RENDER_GIT_COMMIT?.slice(0, 7) || "dev",
    mongo: {
      state: mongoState,
      database: mongoose.connection.name || null,
    },
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + " MB",
      heapUsed:
        Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
    },
  });
});

// ─── Readiness probe (for Render/k8s health checks) ────
app.get("/ready", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    return res.status(200).send("ready");
  }
  res.status(503).send("not ready");
});

// ═══════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════
app.use("/api/auth", authRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/billing", billingRoutes);
// NOTE: if the frontend calls /api/workspaces/* (plural), change this to
// app.use("/api/workspaces", workspaceRoutes) and keep it consistent.
app.use("/api/workspace", workspaceRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);

// ─── 404 for unmatched routes (JSON) ───────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// ─── Sentry error handler (after routes) ───────────────
Sentry.setupExpressErrorHandler(app);

// ─── Fallback error handler ────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: IS_PROD
      ? "Internal server error"
      : err.message || "Internal server error",
  });
});

// ═══════════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;

let httpServer = null;

async function start() {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    // Log connection lifecycle events so Render logs show disconnects/reconnects
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });
    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });

    startCleanupCron();
    console.log("✅ Cleanup cron scheduled");

    startEmailQueueWorker();

    httpServer = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`   Health:      http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
//  GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════
// Render sends SIGTERM on every deploy. Without a handler, in-flight
// requests get cut off mid-response. This lets them finish, then
// closes the Mongo connection cleanly.

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n📴 Received ${signal}, shutting down gracefully…`);

  const forceExit = setTimeout(() => {
    console.error("⏱️  Forced exit after 10s timeout");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
        if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
      console.log("✅ HTTP server closed");
    }

    stopEmailQueueWorker();

    await mongoose.connection.close(false);if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
      console.log("✅ HTTP server closed");
    }

    await mongoose.connection.close(false);
    console.log("✅ MongoDB connection closed");

    console.log("👋 Shutdown complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Catch unhandled rejections and uncaught exceptions so Sentry reports them
// and the process exits with the correct code rather than hanging.
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled rejection:", reason);
  Sentry.captureException(reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err);
  Sentry.captureException(err);
  // Uncaught exceptions leave the process in an undefined state — exit.
  shutdown("uncaughtException");
});

// ─── GO ─────────────────────────────────────────────────
start();
