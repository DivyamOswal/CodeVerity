// backend/services/emailQueue.js
import EmailJob, { MAX_ATTEMPTS } from "../models/EmailJob.js";
import { sendInviteEmail } from "../utils/email.js";

const POLL_INTERVAL_MS = 60 * 1000; // check every minute
const BATCH_SIZE = 10;              // process up to 10 jobs per tick

let intervalHandle = null;
let isProcessing = false;

// ─────────────────────────────────────────────────────────────
// Atomically claim a job so two workers can't pick up the same one.
// findOneAndUpdate is a single atomic op — safe across instances.
// ─────────────────────────────────────────────────────────────
async function claimOne() {
  const now = new Date();
  return EmailJob.findOneAndUpdate(
    {
      status: "pending",
      nextAttemptAt: { $lte: now },
      attempts: { $lt: MAX_ATTEMPTS },
    },
    {
      $set: { status: "sending", lastAttemptAt: now },
      $inc: { attempts: 1 },
    },
    { new: true, sort: { nextAttemptAt: 1 } },
  );
}

// ─────────────────────────────────────────────────────────────
// Dispatch a single job to the appropriate sender.
// For now there's only one type; add more cases as you add jobs.
// ─────────────────────────────────────────────────────────────
async function dispatch(job) {
  switch (job.type) {
    case "invite": {
      const { workspaceName, inviteLink, role } = job.payload || {};
      return sendInviteEmail(job.to, workspaceName, inviteLink, role);
    }
    default:
      throw new Error(`Unknown email job type: ${job.type}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Process a single job, updating status based on outcome.
// ─────────────────────────────────────────────────────────────
async function processJob(job) {
  try {
    const result = await dispatch(job);

    job.status = "sent";
    job.resendId = result?.id || null;
    job.completedAt = new Date();
    job.lastError = null;
    await job.save();

    console.log(
      `✅ EmailJob ${job._id} sent to ${job.to} (attempt ${job.attempts})`,
    );
  } catch (err) {
    job.lastError = err.message || "Unknown send error";

    if (job.attempts >= MAX_ATTEMPTS) {
      job.status = "abandoned";
      job.completedAt = new Date();
      console.error(
        `❌ EmailJob ${job._id} abandoned after ${job.attempts} attempts: ${err.message}`,
      );
    } else {
      job.scheduleNextRetry();
      console.warn(
        `⚠️  EmailJob ${job._id} failed (attempt ${job.attempts}): ${err.message}. Next retry at ${job.nextAttemptAt.toISOString()}`,
      );
    }
    await job.save();
  }
}

// ─────────────────────────────────────────────────────────────
// One pass: claim and process up to BATCH_SIZE jobs.
// ─────────────────────────────────────────────────────────────
async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    let processed = 0;
    while (processed < BATCH_SIZE) {
      const job = await claimOne();
      if (!job) break;

      await processJob(job);
      processed++;
    }
  } catch (err) {
    console.error("Email queue error:", err);
  } finally {
    isProcessing = false;
  }
}

// ─────────────────────────────────────────────────────────────
// Start / stop
// ─────────────────────────────────────────────────────────────
export function startEmailQueueWorker() {
  if (intervalHandle) {
    console.warn("Email queue worker already running");
    return;
  }

  console.log(
    `📬 Email queue worker started (poll every ${POLL_INTERVAL_MS / 1000}s)`,
  );

  // Run once immediately on boot to pick up anything that was pending
  // when the process last shut down.
  processQueue().catch((err) => console.error("Initial queue drain failed:", err));

  intervalHandle = setInterval(processQueue, POLL_INTERVAL_MS);
  // Don't hold the event loop open on shutdown.
  intervalHandle.unref();
}

export function stopEmailQueueWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("📭 Email queue worker stopped");
  }
}

// ─── Exported for admin routes / debugging ──────────────────
export async function getQueueStats() {
  const [pending, sending, sent, failed, abandoned] = await Promise.all([
    EmailJob.countDocuments({ status: "pending" }),
    EmailJob.countDocuments({ status: "sending" }),
    EmailJob.countDocuments({ status: "sent" }),
    EmailJob.countDocuments({ status: "failed" }),
    EmailJob.countDocuments({ status: "abandoned" }),
  ]);
  return { pending, sending, sent, failed, abandoned };
}