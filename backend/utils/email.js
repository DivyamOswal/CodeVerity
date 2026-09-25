// backend/utils/email.js
import EmailJob from "../models/EmailJob.js";

// ─────────────────────────────────────────────────────────────
// Brevo (Sendinblue) transactional email client.
//
// Auth is a single API key sent as the `api-key` header. The
// sender must be a verified Brevo "Sender" — add it at
// app.brevo.com → Senders, Domains & Dedicated IPs → Senders.
// Free tier sends up to 300 emails/day from a verified email
// address, no custom domain required.
//
// Required env vars:
//   BREVO_API_KEY      xkeysib-...
//   BREVO_FROM_EMAIL   a verified sender (e.g. you@gmail.com)
//   BREVO_FROM_NAME    display name (optional, defaults to CodeVerity)
// ─────────────────────────────────────────────────────────────

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

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
// Raw sender — the only function that talks to Brevo.
// Called by the queue worker (and by scripts/tests).
// Throws on failure so the caller can decide what to do.
// ─────────────────────────────────────────────────────────────
export async function sendInviteEmail(to, workspaceName, inviteLink, role) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set");
  }

  const fromEmail = process.env.BREVO_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error(
      "BREVO_FROM_EMAIL is not set — must be a verified Brevo sender",
    );
  }

  const fromName = process.env.BREVO_FROM_NAME || "CodeVerity";

  const { subject, html } = buildInviteEmail({
    workspaceName,
    inviteLink,
    role,
  });

  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  // Brevo returns 201/200 with { messageId } on success.
  // On failure it returns 4xx/5xx with { code, message }.
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      detail = errBody.message || errBody.error || detail;
    } catch {
      // Body wasn't JSON — keep the HTTP status as the message.
    }
    throw new Error(`Brevo rejected the send: ${detail}`);
  }

  const data = await response.json().catch(() => ({}));

  console.log(`✅ Invite email sent to ${to} (id: ${data?.messageId})`);
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

    const result = await sendInviteEmail(
      normalizedTo,
      workspaceName,
      inviteLink,
      role,
    );

    job.status = "sent";
    // Reusing the resendId field for the Brevo messageId — the field
    // name is legacy but the type is identical (a provider-side ID).
    // No schema change needed.
    job.resendId = result?.messageId || null;
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