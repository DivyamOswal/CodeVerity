// backend/models/User.js
import mongoose from "mongoose";
import crypto from "crypto"; // ✅ built-in, no install needed

const PLAN_CONFIG = {
  starter: { tokens: 5000, label: "Starter" },
  pro: { tokens: 150000, label: "Pro" },
  team: { tokens: 400000, label: "Team" },
};

// ─── Encryption helpers ──────────────────────────────────────
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte hex (64 chars)
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
    if (parts.length !== 2) return text; // Not encrypted (legacy plain-text token)
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
    return null; // Return null on failure so the user is prompted to reconnect
  }
}
// ────────────────────────────────────────────────────────────

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
  githubId: { type: String, unique: true, sparse: true },
  githubAccessToken: { type: String, select: false },

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

// ─── Pre-save: tokens + encryption ──────────────────────────
userSchema.pre("save", async function () {
  // Reset tokens on plan change / new user
  const plan = PLAN_CONFIG[this.plan] || PLAN_CONFIG.starter;
  if (this.isNew || this.isModified("plan")) {
    this.tokensRemaining = plan.tokens;
  }

  // Encrypt GitHub token only if it changed AND isn't already encrypted
  if (this.isModified("githubAccessToken") && this.githubAccessToken) {
    // Detect if already encrypted (hex:hex format)
    const looksEncrypted = /^[a-f0-9]{32}:[a-f0-9]+$/i.test(
      this.githubAccessToken
    );
    if (!looksEncrypted) {
      this.githubAccessToken = encrypt(this.githubAccessToken);
    }
  }
});

// ─── Instance methods ───────────────────────────────────────
userSchema.methods.deductTokens = async function (amount) {
  if (this.tokensRemaining < amount) return false;
  this.tokensRemaining -= amount;
  this.totalTokensUsed += amount;
  await this.save();
  return true;
};

// ✅ Returns the decrypted GitHub token for API calls
userSchema.methods.getGithubToken = function () {
  return decrypt(this.githubAccessToken);
};

// ─── Static methods ─────────────────────────────────────────
userSchema.statics.getPlanConfig = function (plan) {
  return PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
};

// ─── Indexes ────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ workspaceId: 1 });

export default mongoose.model("User", userSchema);