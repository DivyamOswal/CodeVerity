// backend/models/User.js
import mongoose from "mongoose";

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

// ✅ Use async hook – no `next` parameter
userSchema.pre("save", async function () {
  if (this.isNew || this.isModified("plan")) {
    this.tokensRemaining = config.tokens;
    this.scansLimit = config.scans;
  }
});

userSchema.methods.deductTokens = async function (amount) {
  if (this.tokensRemaining < amount) return false;
  this.tokensRemaining -= amount;
  this.totalTokensUsed += amount;
  await this.save();
  return true;
};

userSchema.statics.getPlanConfig = function (plan) {
  return PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
};

export default mongoose.model("User", userSchema);
