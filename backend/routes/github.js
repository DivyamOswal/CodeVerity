import express from "express";
import {
  analyzeGithubRepo,
  autoFixIssue,
  generateTestCases,
} from "../controllers/githubController.js";
import protect from "../middleware/authMiddleware.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/github/analyze
router.post("/analyze", protect, analyzeGithubRepo);

// POST /api/github/generate-tests
router.post("/generate-tests", protect, generateTestCases);
router.post("/auto-fix", auth, autoFixIssue);

export default router;