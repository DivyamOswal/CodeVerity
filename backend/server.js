// backend/index.js
import dotenv from "dotenv";
dotenv.config();

// ─── Sentry init (must be BEFORE express) ──────────────
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN_BACKEND,
  environment: process.env.NODE_ENV || "development",
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.2,
  enabled: process.env.NODE_ENV === "production",
});

// ─── Express & middleware ──────────────────────────────
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
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

connectDB();

// ─── Start cleanup cron ────────────────────────────────
startCleanupCron();

const app = express();

// ─── CORS ──────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL || "https://codeverity.pages.dev",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length"],
    maxAge: 86400,
  })
);

// ─── Security headers ──────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

// ─── Body parsing (Stripe webhook needs raw body first) ─
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// ─── Trust proxy (needed for Render / Cloudflare) ──────
app.set("trust proxy", 1);

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

// ─── Health check ──────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Routes ────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);

// ─── Sentry error handler (AFTER routes) ───────────────
Sentry.setupExpressErrorHandler(app);

// ─── Optional: custom fallback error handler ───────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ─── Start server ──────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));