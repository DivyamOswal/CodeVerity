// backend/routes/billing.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  createCheckoutSession,
  getSubscription,
  cancelSubscription,
  handleWebhook,
} from "../controllers/billingController.js";

const router = express.Router();

// ─── Public webhook (must use raw body) ───────────────────────
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

// ─── Protected routes ──────────────────────────────────────────
router.post("/create-checkout-session", auth, createCheckoutSession);
router.get("/subscription", auth, getSubscription);
router.post("/cancel-subscription", auth, cancelSubscription);

export default router;