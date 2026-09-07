// backend/routes/workspace.js
import express from "express";
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
  // ─── NEW IMPORTS ──────────────────────────────────────────
  transferOwnership,
  deleteWorkspace,
  restoreWorkspace,
  getMemberActivity,
} from "../controllers/workspaceController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── Workspace ──────────────────────────────────────────────────
router.get("/", auth, getWorkspace);
router.put("/", auth, updateWorkspace);

// ─── Members ────────────────────────────────────────────────────
router.get("/members", auth, listMembers);
router.post("/members", auth, addMember);
router.delete("/members/:userId", auth, removeMember);
router.put("/members/:userId", auth, updateMemberRole);
router.post("/leave", auth, leaveWorkspace);

// ─── API Keys ──────────────────────────────────────────────────
router.get("/api-keys", auth, getApiKeys);
router.post("/api-keys", auth, createApiKey);
router.delete("/api-keys/:keyId", auth, deleteApiKey);

// ─── Integrations ──────────────────────────────────────────────
router.put("/integrations", auth, updateIntegrations);

// ─── Audit Log ──────────────────────────────────────────────────
router.get("/audit-logs", auth, getAuditLogs);

// ─── Repositories ──────────────────────────────────────────────
router.get("/repositories", auth, getRepositories);

// ─── Analytics ──────────────────────────────────────────────────
router.get("/analytics", auth, getWorkspaceAnalytics);

// ─── Webhooks ──────────────────────────────────────────────────
router.put("/webhook", auth, updateWebhook);
router.post("/webhook/test", auth, testWebhook);

// ─── Trends ──────────────────────────────────────────────────
router.get("/trends", auth, getQualityTrends);

// ─── Schedules ──────────────────────────────────────────────────
router.get("/schedules", auth, getSchedules);
router.post("/schedules", auth, createSchedule);
router.delete("/schedules/:id", auth, deleteSchedule);

// ─── Branding ──────────────────────────────────────────────────
router.put("/branding", auth, updateBranding);

// ─── Invitations ──────────────────────────────────────────────
router.post("/invitations", auth, createInvitation);
router.post("/invitations/accept", auth, acceptInvitation);
router.get("/invitations", auth, getPendingInvites);
router.delete("/invitations/:token", auth, cancelInvitation);

// ─── Ownership Transfer ────────────────────────────────────────
router.post("/transfer-ownership", auth, transferOwnership);

// ─── Workspace Deletion / Restore ────────────────────────────
router.delete("/", auth, deleteWorkspace);
router.post("/restore/:workspaceId", auth, restoreWorkspace);

// ─── Member Activity ──────────────────────────────────────────
router.get("/activity", auth, getMemberActivity);

export default router;