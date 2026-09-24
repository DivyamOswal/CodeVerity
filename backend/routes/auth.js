// backend/routes/auth.js
import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  googleAuth,
  googleAuthCallback,
  githubAuth,
  githubAuthCallback,
  getMe,
  disconnectGitHub,
} from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── Rate limiters ──────────────────────────────────────────

// Strict limiter for login/register  brute-force protection.
// 10 attempts per 15 minutes per IP. Successful attempts still count,
// which is intentional: an attacker can't cycle IPs fast enough to
// stay under the limit and still brute-force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
  // In production behind a proxy (Render/Cloudflare), trust X-Forwarded-For
  // so the limiter keys on the real client IP instead of the proxy's.
  // Set this only if you've also set `app.set('trust proxy', 1)` in index.js.
  // Leaving it unset here so the route doesn't silently misbehave if the
  // main app doesn't configure trust proxy.
});

// Lighter limiter for OAuth start routes  prevents someone hammering
// the auth provider through your server, but leaves headroom for real
// users who might retry a couple of times.
const oauthStartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OAuth attempts. Please try again later." },
});

// The /me endpoint gets hit on every page load by the frontend. Give it
// a generous cap so the app doesn't self-throttle during normal use.
const meLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Slow down." },
});

// ─── Normal authentication ──────────────────────────────────
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
// Logout clears the HttpOnly auth cookie. No `auth` middleware — a user
// whose JWT just expired should still be able to clear the cookie so the
// browser doesn't keep sending a stale value to /github?connect=true.
router.post("/logout", logout);

// ─── Google OAuth ───────────────────────────────────────────
router.get("/google", oauthStartLimiter, googleAuth);
router.get("/google/callback", googleAuthCallback);

// ─── GitHub OAuth ───────────────────────────────────────────
router.get("/github", oauthStartLimiter, githubAuth);
router.get("/github/callback", githubAuthCallback);
router.delete("/github", auth, disconnectGitHub);

// ─── Get current user (protected) ───────────────────────────
router.get("/me", meLimiter, auth, getMe);

export default router;