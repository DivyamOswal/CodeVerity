// backend/routes/workspace.js
import express from "express";
import rateLimit from "express-rate-limit";
import {
  getWorkspace,
  updateWorkspace,
  listMembers,
  addMember,
  removeMember,
  updateMemberRole,
  leaveWorkspace,
  getApiKeys,
  createApiKey,
  deleteApiKey,
  updateIntegrations,
  getAuditLogs,
  getRepositories,
  getWorkspaceAnalytics,
  updateWebhook,
  testWebhook,
  getQualityTrends,
  getSchedules,
  createSchedule,
  deleteSchedule,
  updateBranding,
  createInvitation,
  acceptInvitation,
  getPendingInvites,
  cancelInvitation,
  transferOwnership,
  deleteWorkspace,
  restoreWorkspace,
  getMemberActivity,
} from "../controllers/workspaceController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── Rate limiters ──────────────────────────────────────────

// Invitations send emails. Cap hard to protect your email quota and
// prevent abuse of the bulk-invite endpoint (max 50 emails per call).
const invitationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,                  // 20 invite calls per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many invitation requests. Please try again later.",
  },
});

// API keys are cheap to create but shouldn't be scriptable.
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many API key operations. Please slow down." },
});

// Webhook test fires outbound HTTP requests. Cap it so someone can't use
// the endpoint as a DoS amplifier against a third party.
const webhookTestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many webhook tests. Please wait a minute." },
});

// ─── Workspace ──────────────────────────────────────────────
router.get("/", auth, getWorkspace);
router.put("/", auth, updateWorkspace);

// ─── Members ────────────────────────────────────────────────
router.get("/members", auth, listMembers);
router.post("/members", auth, addMember);
router.delete("/members/:userId", auth, removeMember);
router.put("/members/:userId", auth, updateMemberRole);
router.post("/leave", auth, leaveWorkspace);

// ─── API Keys ───────────────────────────────────────────────
router.get("/api-keys", auth, getApiKeys);
router.post("/api-keys", auth, apiKeyLimiter, createApiKey);
router.delete("/api-keys/:keyId", auth, apiKeyLimiter, deleteApiKey);

// ─── Integrations ───────────────────────────────────────────
router.put("/integrations", auth, updateIntegrations);

// ─── Audit Log ──────────────────────────────────────────────
router.get("/audit-logs", auth, getAuditLogs);

// ─── Repositories ───────────────────────────────────────────
router.get("/repositories", auth, getRepositories);

// ─── Analytics ──────────────────────────────────────────────
router.get("/analytics", auth, getWorkspaceAnalytics);

// ─── Webhooks ───────────────────────────────────────────────
router.put("/webhook", auth, updateWebhook);
router.post("/webhook/test", auth, webhookTestLimiter, testWebhook);

// ─── Trends ─────────────────────────────────────────────────
router.get("/trends", auth, getQualityTrends);

// ─── Schedules ──────────────────────────────────────────────
router.get("/schedules", auth, getSchedules);
router.post("/schedules", auth, createSchedule);
router.delete("/schedules/:id", auth, deleteSchedule);

// ─── Branding ───────────────────────────────────────────────
router.put("/branding", auth, updateBranding);

// ─── Invitations ────────────────────────────────────────────
router.post("/invitations", auth, invitationLimiter, createInvitation);
router.post("/invitations/accept", auth, acceptInvitation);
router.get("/invitations", auth, getPendingInvites);
router.delete("/invitations/:id", auth, cancelInvitation);

// ─── Ownership Transfer ─────────────────────────────────────
router.post("/transfer-ownership", auth, transferOwnership);

// ─── Workspace Deletion / Restore ───────────────────────────
router.delete("/", auth, deleteWorkspace);
router.post("/restore/:workspaceId", auth, restoreWorkspace);

// ─── Member Activity ────────────────────────────────────────
router.get("/activity", auth, getMemberActivity);

export default router;