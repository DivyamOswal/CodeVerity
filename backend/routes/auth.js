// backend/routes/auth.js
import express from "express";
import {
  register,
  login,
  googleAuth,
  googleAuthCallback,
  githubAuth,
  githubAuthCallback,
  getMe,                    
} from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";  
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

// ─── Get current user (protected) ──────────────────────────
router.get("/me", auth, getMe);   

export default router;