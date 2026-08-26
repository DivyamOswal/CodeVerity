// backend/models/User.js
import mongoose from "mongoose";

// ── Plan configuration ──────────────────────────────────────────
const PLAN_CONFIG = {
  starter: { tokens: 50000, scans: 5, label: "Starter" },
  pro: { tokens: 150000, scans: 10, label: "Pro" },
  team: { tokens: 400000, scans: 15, label: "Team" },
};

const userSchema = new mongoose.Schema({
  // ── Basic info ──────────────────────────────────────────────
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },

  // ── Workspace & Roles (Phase 4) ─────────────────────────────
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    default: null,
  },
  role: {
    type: String,
    enum: ["owner", "admin", "member", "viewer"],
    default: "member",
  },

  // ── Subscription & Token Usage ──────────────────────────────
  plan: {
    type: String,
    enum: ["starter", "pro", "team"],
    default: "starter",
  },

  tokensRemaining: {
    type: Number,
    default: 50000,
  },
  totalTokensUsed: {
    type: Number,
    default: 0,
  },
  tokensLastReset: {
    type: Date,
    default: Date.now,
  },

  // ── Monthly Scan Tracking ────────────────────────────────────
  scansUsedThisMonth: {
    type: Number,
    default: 0,
  },
  scansLimit: {
    type: Number,
    default: 5,
  },
  scansLastReset: {
    type: Date,
    default: Date.now,
  },
});

// ── Pre‑save: set tokens & scan limit from plan ──────────────
userSchema.pre("save", function (next) {
  const config = PLAN_CONFIG[this.plan] || PLAN_CONFIG.starter;
  if (this.isNew || this.isModified("plan")) {
    this.tokensRemaining = config.tokens;
    this.scansLimit = config.scans;
  }
  next();
});

// ── Instance Methods ──────────────────────────────────────────

// Deduct AI tokens, return true if sufficient
userSchema.methods.deductTokens = async function (amount) {
  if (this.tokensRemaining < amount) return false;
  this.tokensRemaining -= amount;
  this.totalTokensUsed += amount;
  await this.save();
  return true;
};

// Increment scan usage, return true if under limit
userSchema.methods.incrementScanUsage = async function () {
  const now = new Date();
  // Reset monthly if new month
  if (
    this.scansLastReset.getMonth() !== now.getMonth() ||
    this.scansLastReset.getFullYear() !== now.getFullYear()
  ) {
    this.scansUsedThisMonth = 0;
    this.scansLastReset = now;
  }
  if (this.scansUsedThisMonth >= this.scansLimit) {
    return false; // limit exceeded
  }
  this.scansUsedThisMonth += 1;
  await this.save();
  return true;
};

// Get remaining scans for this month
userSchema.methods.getRemainingScans = function () {
  const now = new Date();
  // Reset if needed (but don't modify DB here)
  if (
    this.scansLastReset.getMonth() !== now.getMonth() ||
    this.scansLastReset.getFullYear() !== now.getFullYear()
  ) {
    return this.scansLimit; // would be reset on next increment
  }
  return Math.max(0, this.scansLimit - this.scansUsedThisMonth);
};

// ── Static Methods ─────────────────────────────────────────────

userSchema.statics.getPlanConfig = function (plan) {
  return PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
};

export default mongoose.model("User", userSchema);
