// backend/utils/email.js
import { Resend } from "resend";
import EmailJob from "../models/EmailJob.js";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─────────────────────────────────────────────────────────────
// Template builder (pure function — no I/O)
// ─────────────────────────────────────────────────────────────
function buildInviteEmail({ workspaceName, inviteLink, role }) {
  const subject = `You're invited to join "${workspaceName}" on CodeVerity`;
  const html = `
    <h2>You've been invited to CodeVerity!</h2>
    <p><strong>${workspaceName}</strong> has invited you to join as a <strong>${role}</strong>.</p>
    <p>Click the link below to accept the invitation:</p>
    <p><a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#22d3ee;color:#000;border-radius:8px;text-decoration:none;font-weight:bold;">Accept Invitation</a></p>
    <p>This link expires in 7 days.</p>
    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    <hr />
    <p style="color:#666;font-size:12px;">CodeVerity – AI‑powered code intelligence</p>
  `;
  return { subject, html };
}

// ─────────────────────────────────────────────────────────────
// Raw sender — the only function that talks to Resend.
// Called by the queue worker (and by scripts/tests).
// Throws on failure so the caller can decide what to do.
// ─────────────────────────────────────────────────────────────
export async function sendInviteEmail(to, workspaceName, inviteLink, role) {
  const { subject, html } = buildInviteEmail({
    workspaceName,
    inviteLink,
    role,
  });

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || "onboarding@resend.dev",
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Resend rejected the send");
  }

  console.log(`✅ Invite email sent to ${to} (id: ${data?.id})`);
  return data;
}

// ─────────────────────────────────────────────────────────────
// Queue-aware entry point. Creates a job, then attempts the first
// send inline so the caller gets immediate feedback. If the send
// fails, the job stays "pending" and the worker retries.
//
// Returns { success, status, jobId, error? }.
// ─────────────────────────────────────────────────────────────
export async function enqueueInviteEmail(
  to,
  workspaceName,
  inviteLink,
  role,
  { workspaceId = null, triggeredBy = null } = {},
) {
  const normalizedTo = String(to || "").trim().toLowerCase();

  const job = await EmailJob.create({
    type: "invite",
    to: normalizedTo,
    payload: { workspaceName, inviteLink, role },
    status: "pending",
    attempts: 0,
    nextAttemptAt: new Date(),
    workspaceId,
    triggeredBy,
  });

  // Best-effort immediate send
  try {
    job.status = "sending";
    job.attempts = 1;
    job.lastAttemptAt = new Date();
    await job.save();

    const result = await sendInviteEmail(normalizedTo, workspaceName, inviteLink, role);

    job.status = "sent";
    job.resendId = result?.id || null;
    job.completedAt = new Date();
    job.lastError = null;
    await job.save();

    return { success: true, status: "sent", jobId: job._id };
  } catch (err) {
    job.attempts = 1;
    job.lastError = err.message || "Unknown send error";
    job.scheduleNextRetry();
    await job.save();

    console.error(
      `⚠️  Invite email to ${normalizedTo} failed (attempt 1): ${err.message}. Queued for retry.`,
    );

    return {
      success: false,
      status: "pending",
      jobId: job._id,
      error: err.message,
    };
  }
}