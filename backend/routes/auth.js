import express from "express";

import {
  register,
  login,
  googleAuth,
  googleAuthCallback,
  githubAuth,
  githubAuthCallback,
} from "../controllers/authController.js";

const router = express.Router();

// Normal authentication
router.post("/register", register);
router.post("/login", login);

// Google OAuth
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

// GitHub OAuth
router.get("/github", githubAuth);
router.get("/github/callback", githubAuthCallback);

export default router;