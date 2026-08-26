// backend/models/User.js
import mongoose from "mongoose";

const PLAN_CONFIG = {
  starter: { tokens: 50000, scans: 5, label: "Starter" },
  pro: { tokens: 150000, scans: 10, label: "Pro" },
  team: { tokens: 400000, scans: 15, label: "Team" },
};

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },

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

  plan: {
    type: String,
    enum: ["starter", "pro", "team"],
    default: "starter",
  },

  tokensRemaining: { type: Number, default: 50000 },
  totalTokensUsed: { type: Number, default: 0 },
  tokensLastReset: { type: Date, default: Date.now },

  scansUsedThisMonth: { type: Number, default: 0 },
  scansLimit: { type: Number, default: 5 },
  scansLastReset: { type: Date, default: Date.now },
});

// ── Pre‑save: async hook – no `next` ──────────────────────
userSchema.pre("save", async function () {
  const plan = PLAN_CONFIG[this.plan] || PLAN_CONFIG.starter;
  if (this.isNew || this.isModified("plan")) {
    this.tokensRemaining = plan.tokens;
    this.scansLimit = plan.scans;
  }
});

// ── Instance Methods ──────────────────────────────────────────

userSchema.methods.deductTokens = async function (amount) {
  if (this.tokensRemaining < amount) return false;
  this.tokensRemaining -= amount;
  this.totalTokensUsed += amount;
  await this.save();
  return true;
};

userSchema.methods.incrementScanUsage = async function () {
  const now = new Date();
  if (
    this.scansLastReset.getMonth() !== now.getMonth() ||
    this.scansLastReset.getFullYear() !== now.getFullYear()
  ) {
    this.scansUsedThisMonth = 0;
    this.scansLastReset = now;
  }
  if (this.scansUsedThisMonth >= this.scansLimit) return false;
  this.scansUsedThisMonth += 1;
  await this.save();
  return true;
};

userSchema.methods.getRemainingScans = function () {
  const now = new Date();
  if (
    this.scansLastReset.getMonth() !== now.getMonth() ||
    this.scansLastReset.getFullYear() !== now.getFullYear()
  ) {
    return this.scansLimit;
  }
  return Math.max(0, this.scansLimit - this.scansUsedThisMonth);
};

// ── Static ─────────────────────────────────────────────────────

userSchema.statics.getPlanConfig = function (plan) {
  return PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
};

export default mongoose.model("User", userSchema);