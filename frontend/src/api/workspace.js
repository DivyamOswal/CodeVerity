// frontend/src/api/workspace.js
import axios from "./axios";

// ─── Workspace ───────────────────────────────────────────────────
export const getWorkspace = () => axios.get("/workspace");
export const updateWorkspace = (data) => axios.put("/workspace", data);
export const leaveWorkspace = () => axios.post("/workspace/leave");

// ─── Members ────────────────────────────────────────────────────
export const getMembers = () => axios.get("/workspace/members");
export const addMember = (data) => axios.post("/workspace/members", data);
export const removeMember = (userId) => axios.delete(`/workspace/members/${userId}`);
export const updateMemberRole = (userId, role) =>
  axios.put(`/workspace/members/${userId}/role`, { role });

// ─── API Keys ──────────────────────────────────────────────────
export const getApiKeys = () => axios.get("/workspace/api-keys");
export const createApiKey = (data) => axios.post("/workspace/api-keys", data);
export const deleteApiKey = (keyId) => axios.delete(`/workspace/api-keys/${keyId}`);

// ─── Integrations ──────────────────────────────────────────────
export const updateIntegrations = (data) =>
  axios.put("/workspace/integrations", data);

// ─── Audit Log ──────────────────────────────────────────────────
export const getAuditLogs = () => axios.get("/workspace/audit-logs");

// ─── Repositories ──────────────────────────────────────────────
export const getRepositories = () => axios.get("/workspace/repositories");

// ─── Analytics ──────────────────────────────────────────────────
export const getWorkspaceAnalytics = () => axios.get("/workspace/analytics");

// ─── Webhooks ──────────────────────────────────────────────────
export const updateWebhook = (data) => axios.put("/workspace/webhook", data);
export const testWebhook = () => axios.post("/workspace/webhook/test");

// ─── Trends ─────────────────────────────────────────────────────
export const getQualityTrends = () => axios.get("/workspace/trends");

// ─── Branding ──────────────────────────────────────────────────
export const updateBranding = (data) => axios.put("/workspace/branding", data);

// ─── Schedules ──────────────────────────────────────────────────
export const getSchedules = () => axios.get("/workspace/schedules");
export const createSchedule = (data) => axios.post("/workspace/schedules", data);
export const deleteSchedule = (id) => axios.delete(`/workspace/schedules/${id}`);