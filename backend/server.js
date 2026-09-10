import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import analyzeRoutes from "./routes/analyze.js";
import reportRoutes from "./routes/report.js";
import githubRoutes from "./routes/github.js";
import dashboardRoutes from "./routes/dashboard.js";
import billingRoutes from "./routes/billing.js";
import workspaceRoutes from "./routes/workspace.js";
import statsRoutes from "./routes/stats.js";
import adminRoutes from "./routes/admin.js";
import { startCleanupCron } from './services/cleanupService.js';

connectDB();
// ─── Start cleanup cron ──────────────────────────
startCleanupCron();

const app = express();

// ─── CORS ────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL || "https://codeverity.pages.dev"
];
app.use(cors({ origin: allowedOrigins }));

// ─── Body parsing (Stripe webhook needs raw body first) ──
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// ─── Trust proxy (needed for Render / Cloudflare) ────────
app.set("trust proxy", 1);

// ─── Rate Limiting ───────────────────────────────
// Global limiter: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for expensive endpoints (analysis, test gen)
const expensiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: "Analysis limit exceeded. Please wait a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global limiter to all API routes
app.use("/api", globalLimiter);

// Apply strict limiter to heavy endpoints
app.use("/api/github/analyze", expensiveLimiter);
app.use("/api/github/generate-tests", expensiveLimiter);
app.use("/api/github/auto-fix", expensiveLimiter);

// ─── Health check (for Render monitoring) ────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Routes ──────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);

// ─── Start server ────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);