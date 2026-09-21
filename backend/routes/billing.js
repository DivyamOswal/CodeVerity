// backend/routes/billing.js
import express from "express";
import rateLimit from "express-rate-limit";
import auth from "../middleware/authMiddleware.js";
import {
  createCheckoutSession,
  getSubscription,
  cancelSubscription,
  handleWebhook,
} from "../controllers/billingController.js";

const router = express.Router();

// ─── Rate limiters ──────────────────────────────────────────

// Checkout creation calls Stripe on every request. Cap it per IP to
// prevent a runaway script from exhausting our Stripe API quota.
const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many checkout attempts. Please try again later.",
  },
});

// Cancel is rare  one per subscription lifetime. Very permissive.
const cancelLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many cancel attempts. Please try again later." },
});

// ─── Public webhook (raw body is set at the app level in index.js) ───
// NOTE: index.js applies `express.raw({ type: "application/json" })` to
// /api/billing/webhook BEFORE `express.json()`. Do not add express.raw
// here  the body is already a Buffer by the time this route runs. If
// you need to move the raw middleware, it MUST stay ahead of express.json
// in the app chain or Stripe signature verification will fail.
router.post("/webhook", handleWebhook);

// ─── Protected routes ────────────────────────────────────────────────
router.post("/create-checkout-session", auth, checkoutLimiter, createCheckoutSession);
router.get("/subscription", auth, getSubscription);
router.post("/cancel-subscription", auth, cancelLimiter, cancelSubscription);

export default router;