// backend/utils/email.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(to, workspaceName, inviteLink, role) {
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

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "onboarding@resend.dev",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    console.log(`✅ Invite email sent to ${to} (id: ${data?.id})`);
    return data;
  } catch (err) {
    console.error("Failed to send invite email:", err);
    throw err;
  }
}