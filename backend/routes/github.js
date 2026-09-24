// backend/routes/github.js
import express from "express";
import rateLimit from "express-rate-limit";
import {
  analyzeGithubRepo,
  autoFixIssue,
  generateTestCases,
  getRepoContents,
  getFileContent,
  commentOnPR,
} from "../controllers/githubController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── Rate limiters ──────────────────────────────────────────

// These routes hit the GitHub API with the workspace's OAuth token.
// GitHub enforces 5,000 req/hour per authenticated user, shared across
// every workspace member. Cap per-IP to prevent one caller from
// exhausting the shared quota.
const repoReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many repository requests. Please slow down.",
  },
});

// ─── Analysis routes ────────────────────────────────────────
// Note: /analyze, /generate-tests and /auto-fix are also covered by the
// expensiveLimiter in index.js (10/min). No need to double-limit here.
router.post("/analyze", auth, analyzeGithubRepo);
router.post("/generate-tests", auth, generateTestCases);
router.post("/auto-fix", auth, autoFixIssue);

// ─── Repository read routes ─────────────────────────────────
router.get("/repo/contents", auth, repoReadLimiter, getRepoContents);
router.get("/repo/file", auth, repoReadLimiter, getFileContent);
router.post("/pr/comment", auth, commentOnPR);

export default router;