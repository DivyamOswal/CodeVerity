// frontend/src/api/workspace.js
import axios from "./axios";

// ─── Workspace ───────────────────────────────────────────────────

export const getWorkspace = () => axios.get("/workspace");

export const updateWorkspace = (data) => axios.put("/workspace", data);

// ─── Members ────────────────────────────────────────────────────

export const getMembers = () => axios.get("/workspace/members");

export const addMember = (data) => axios.post("/workspace/members", data);

export const removeMember = (userId) =>
  axios.delete(`/workspace/members/${userId}`);

export const updateMemberRole = (userId, role) =>
  axios.put(`/workspace/members/${userId}`, { role });

// ─── Leave Workspace ───────────────────────────────────────────

// Note: you'll need to add this endpoint in your backend if not present
// export const leaveWorkspace = () => axios.post("/workspace/leave");
