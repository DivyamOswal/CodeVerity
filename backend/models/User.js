// backend/models/User.js
import mongoose from "mongoose";
import crypto from "crypto";

const PLAN_CONFIG = {
  starter: { tokens: 15000, label: "Starter" },
  pro: { tokens: 25000, label: "Pro" },
  team: { tokens: 50000, label: "Team" },
};

// ─── Encryption helpers ──────────────────────────────────────
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return text;
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  if (!text) return text;
  try {
    const parts = text.split(":");
    if (parts.length !== 2) return text;
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY, "hex"),
      iv
    );
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err.message);
    return null;
  }
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  role: {
    type: String,
    enum: ["owner", "admin", "member", "viewer"],
    default: "member",
  },
  plan: { type: String, enum: ["starter", "pro", "team"], default: "starter" },
  isGlobalAdmin: { type: Boolean, default: false },
  githubId: { type: String },
  githubAccessToken: { type: String, select: false },

  // Billing / Stripe
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  subscriptionStatus: String,
  subscriptionEndsAt: Date,

  // ── Token system ──────────────────────────────────────────
  tokensRemaining: { type: Number, default: 15000 },
  totalTokensUsed: { type: Number, default: 0 },
  tokensLastReset: { type: Date, default: Date.now },
});

// ─── Pre-save: encryption only. Token grants are explicit
// wherever `plan` changes (see setPlan / setPlanWithRollover).
userSchema.pre("save", async function () {
  if (this.isModified("githubAccessToken") && this.githubAccessToken) {
    const looksEncrypted = /^[a-f0-9]{32}:[a-f0-9]+$/i.test(
      this.githubAccessToken
    );
    if (!looksEncrypted) {
      this.githubAccessToken = encrypt(this.githubAccessToken);
    }
  }
});

// ─── Instance methods ───────────────────────────────────────

/**
 * Atomic token deduction. Only touches tokensRemaining and
 * totalTokensUsed via $inc, so it can never rewrite plan /
 * subscription fields from a stale in-memory document.
 */
userSchema.methods.deductTokens = async function (amount) {
  const result = await this.constructor.updateOne(
    { _id: this._id, tokensRemaining: { $gte: amount } },
    { $inc: { tokensRemaining: -amount, totalTokensUsed: amount } }
  );

  if (result.modifiedCount === 0) return false;

  // Keep the in-memory doc consistent for callers that read after.
  this.tokensRemaining -= amount;
  this.totalTokensUsed += amount;
  return true;
};

userSchema.methods.getGithubToken = function () {
  return decrypt(this.githubAccessToken);
};

/**
 * Reset plan and grant the plan's full allowance.
 * Use on new subscriptions and renewals (same plan).
 */
userSchema.methods.setPlan = function (planName) {
  const config = PLAN_CONFIG[planName] || PLAN_CONFIG.starter;
  this.plan = planName;
  this.tokensRemaining = config.tokens;
  this.totalTokensUsed = 0;
  this.tokensLastReset = new Date();
};

/**
 * Upgrade/downgrade: carry unused tokens forward and add the
 * new plan's allowance.
 *   e.g. 500 remaining + upgrade to Pro (25,000) => 25,500
 *
 * Call this ONLY when the plan actually changes. For same-plan
 * renewals use setPlan() — otherwise a user can buy the same
 * plan twice and stack allowances.
 */
userSchema.methods.setPlanWithRollover = function (planName) {
  const config = PLAN_CONFIG[planName] || PLAN_CONFIG.starter;
  const carried = Math.max(this.tokensRemaining || 0, 0);
  this.plan = planName;
  this.tokensRemaining = carried + config.tokens;
  this.tokensLastReset = new Date();
  // totalTokensUsed is preserved — it tracks usage across upgrades.
};

// ─── Static methods ─────────────────────────────────────────
userSchema.statics.getPlanConfig = function (plan) {
  return PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
};

// ─── Indexes ────────────────────────────────────────────────
userSchema.index({ workspaceId: 1 });

userSchema.index(
  { githubId: 1 },
  {
    unique: true,
    partialFilterExpression: { githubId: { $type: "string" } },
    name: "githubId_unique_when_string",
  }
);

export default mongoose.model("User", userSchema);