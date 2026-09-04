// backend/models/User.js
import mongoose from "mongoose";

const PLAN_CONFIG = {
  starter: { tokens: 5000, label: "Starter" },
  pro:     { tokens: 150000, label: "Pro" },
  team:    { tokens: 400000, label: "Team" },
};

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  role: { type: String, enum: ["owner","admin","member","viewer"], default: "member" },
  plan: { type: String, enum: ["starter","pro","team"], default: "starter" },
  isGlobalAdmin: {type: Boolean, default: false},
  githubAccessToken: { type: String, default: null },

  // Billing / Stripe
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  subscriptionStatus: String,
  subscriptionEndsAt: Date,

  // ── Token system ──────────────────────────────────────────
  tokensRemaining: { type: Number, default: 5000 },
  totalTokensUsed: { type: Number, default: 0 },
  tokensLastReset: { type: Date, default: Date.now },
});

userSchema.pre("save", async function () {
  const plan = PLAN_CONFIG[this.plan] || PLAN_CONFIG.starter;
  if (this.isNew || this.isModified("plan")) {
    this.tokensRemaining = plan.tokens;
  }
});

// Deduct tokens – returns true if enough, else false
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