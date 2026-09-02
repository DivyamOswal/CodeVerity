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
  getQualityTrends
} from "../controllers/workspaceController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, getWorkspace);
router.put("/", auth, updateWorkspace);
router.get("/members", auth, listMembers);  
router.post("/members", auth, addMember);
router.delete("/members/:userId", auth, removeMember);
router.put("/members/:userId", auth, updateMemberRole);
router.post("/leave", auth, leaveWorkspace);
router.get("/api-keys", auth, getApiKeys);
router.post("/api-keys", auth, createApiKey);
router.delete("/api-keys/:keyId", auth, deleteApiKey);
router.put("/integrations", auth, updateIntegrations);
router.get("/audit-logs", auth, getAuditLogs);
router.get("/repositories", auth, getRepositories);
router.get("/analytics", auth, getWorkspaceAnalytics);
router.put("/webhook", auth, updateWebhook);
router.post("/webhook/test", auth, testWebhook);
router.get("/trends", auth, getQualityTrends);

export default router;