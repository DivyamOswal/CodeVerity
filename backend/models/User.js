// backend/models/User.js
import mongoose from "mongoose";

// Plan configuration
const PLAN_CONFIG = {
  starter: { tokens: 50000, label: "Starter" },
  pro: { tokens: 150000, label: "Pro" },
  team: { tokens: 400000, label: "Team" },
};

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  plan: {
    type: String,
    enum: ["starter", "pro", "team"],
    default: "starter",
  },
  tokensRemaining: {
    type: Number,
    default: 50000, // will be set based on plan in pre-save
  },
  totalTokensUsed: {
    type: Number,
    default: 0,
  },
  // Optional: track when tokens were last reset (e.g., monthly)
  tokensLastReset: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware: set tokensRemaining based on plan
userSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("plan")) {
    this.tokensRemaining = PLAN_CONFIG[this.plan]?.tokens || 50000;
  }
  next();
});

// Instance method: deduct tokens, return boolean if sufficient
userSchema.methods.deductTokens = async function (amount) {
  if (this.tokensRemaining < amount) {
    return false;
  }
  this.tokensRemaining -= amount;
  this.totalTokensUsed += amount;
  await this.save();
  return true;
};

// Static method: get plan config
userSchema.statics.getPlanConfig = function (plan) {
  return PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
};

export default mongoose.model("User", userSchema);