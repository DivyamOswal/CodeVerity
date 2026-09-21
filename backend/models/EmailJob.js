// backend/models/EmailJob.js
import mongoose from "mongoose";

// Retry schedule (ms from previous attempt). Attempt 1 is the initial try,
// so these are the delays BEFORE attempts 2-6. Five retries after the first
// attempt gives ~8.6 hours of total retry coverage  plenty to ride out a
// Resend outage without holding a job forever.
const RETRY_DELAYS_MS = [
  1 * 60 * 1000,        // 1 min
  5 * 60 * 1000,        // 5 min
  30 * 60 * 1000,       // 30 min
  2 * 60 * 60 * 1000,   // 2 hr
  6 * 60 * 60 * 1000,   // 6 hr
];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1; // initial + retries

const emailJobSchema = new mongoose.Schema(
  {
    // ─── Job identity ──────────────────────────────────────
    type: {
      type: String,
      enum: ["invite"],
      required: true,
      index: true,
    },

    // ─── Recipient ─────────────────────────────────────────
    to: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // ─── Payload (kept small and JSON-safe) ────────────────
    // Structured so the worker can reconstruct the email body fresh
    // at send time. Never store rendered HTML  templates may change.
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ─── Status ────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "sending", "sent", "failed", "abandoned"],
      default: "pending",
      index: true,
    },

    // ─── Retry bookkeeping ─────────────────────────────────
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    nextAttemptAt: { type: Date, default: () => new Date(), index: true },
    completedAt: { type: Date, default: null },

    // ─── Provider response ─────────────────────────────────
    resendId: { type: String, default: null },
    lastError: { type: String, default: null },

    // ─── Context (for support / audit) ─────────────────────
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// Worker query: find pending jobs whose nextAttemptAt has arrived.
// Compound index for the hot path.
emailJobSchema.index({ status: 1, nextAttemptAt: 1 });

// TTL: auto-delete sent/abandoned jobs after 30 days so the collection
// doesn't grow forever. Failed and abandoned are kept longer for debugging
//  actually, let's keep everything for 30 days.
emailJobSchema.index(
  { completedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);

// ─── Instance helper: compute next retry delay ─────────────
emailJobSchema.methods.scheduleNextRetry = function () {
  const idx = this.attempts - 1; // attempts=1 → idx=0 (after 1st try)
  if (idx >= RETRY_DELAYS_MS.length) {
    this.status = "abandoned";
    this.completedAt = new Date();
    return;
  }
  this.status = "pending";
  this.nextAttemptAt = new Date(Date.now() + RETRY_DELAYS_MS[idx]);
};

export default mongoose.model("EmailJob", emailJobSchema);