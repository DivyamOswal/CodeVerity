// backend/controllers/workspaceController.js
import User from "../models/User.js";
import WorkSpace from "../models/WorkSpace.js";
import crypto from 'crypto';         
import mongoose from 'mongoose';

// ─── Helper: Ensure user has a workspace ──────────────────────
async function ensureWorkspace(user) {
  if (user.workspaceId) {
    const existing = await WorkSpace.findById(user.workspaceId);
    if (existing) return existing;
  }
  const newWorkspace = await WorkSpace.create({
    name: `${user.name}'s Workspace`,
    ownerId: user._id,
    members: [{ userId: user._id, role: "owner" }],
  });
  user.workspaceId = newWorkspace._id;
  user.role = "owner";
  await user.save();
  return newWorkspace;
}

// ─── Get workspace details ────────────────────────────────────
export const getWorkspace = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);
    const populated = await WorkSpace.findById(workspace._id)
      .populate("members.userId", "name email")
      .lean();

    res.json({ success: true, workspace: populated });
  } catch (err) {
    console.error("Get workspace error:", err);
    res.status(500).json({ error: "Failed to fetch workspace" });
  }
};

// ─── Update workspace name ────────────────────────────────────
export const updateWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Workspace name must be at least 2 characters." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const member = workspace.members.find(
      (m) => m.userId.toString() === user._id.toString()
    );
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    workspace.name = name.trim();
    await workspace.save();

    res.json({ success: true, workspace });
  } catch (err) {
    console.error("Update workspace error:", err);
    res.status(500).json({ error: "Failed to update workspace" });
  }
};

// ─── Add member to workspace ──────────────────────────────────
export const addMember = async (req, res) => {
  try {
    const { email, role = "member" } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const currentMember = workspace.members.find(
      (m) => m.userId.toString() === user._id.toString()
    );
    if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ error: "User not found." });
    }

    if (workspace.members.some((m) => m.userId.toString() === userToAdd._id.toString())) {
      return res.status(400).json({ error: "User is already a member of this workspace." });
    }

    workspace.members.push({ userId: userToAdd._id, role });
    await workspace.save();

    if (!userToAdd.workspaceId) {
      userToAdd.workspaceId = workspace._id;
      userToAdd.role = role;
      await userToAdd.save();
    }

    // ── Audit log: member invited ───────────────────────────
    await addAuditLog(
      workspace._id,
      user._id,
      "invite",
      `Invited ${userToAdd.email} as ${role}`,
      { invitedUserId: userToAdd._id, role }
    );

    res.json({ success: true, member: { userId: userToAdd, role } });
  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({ error: "Failed to add member" });
  }
};

// ─── Remove member from workspace ─────────────────────────────
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const currentMember = workspace.members.find(
      (m) => m.userId.toString() === user._id.toString()
    );
    if (!currentMember) {
      return res.status(403).json({ error: "Permission denied." });
    }

    if (userId === user._id.toString()) {
      return res.status(400).json({ error: "Cannot remove yourself from workspace." });
    }

    const targetMember = workspace.members.find(
      (m) => m.userId.toString() === userId
    );
    if (!targetMember) {
      return res.status(404).json({ error: "Member not found." });
    }

    if (currentMember.role === "owner") {
      // owner can remove anyone
    } else if (currentMember.role === "admin") {
      if (targetMember.role === "owner" || targetMember.role === "admin") {
        return res.status(403).json({ error: "Cannot remove admin or owner." });
      }
    } else {
      return res.status(403).json({ error: "Permission denied." });
    }

    // Get target user email for audit log
    const targetUser = await User.findById(userId).select("email");

    workspace.members = workspace.members.filter(
      (m) => m.userId.toString() !== userId
    );
    await workspace.save();

    // ── Audit log: member removed ───────────────────────────
    await addAuditLog(
      workspace._id,
      user._id,
      "remove",
      `Removed ${targetUser?.email || userId} from workspace`,
      { removedUserId: userId }
    );

    res.json({ success: true, message: "Member removed." });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ error: "Failed to remove member" });
  }
};

// ─── Update member role ──────────────────────────────────────
export const updateMemberRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["owner", "admin", "member", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const currentMember = workspace.members.find(
      (m) => m.userId.toString() === user._id.toString()
    );
    if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const targetMember = workspace.members.find(
      (m) => m.userId.toString() === userId
    );
    if (!targetMember) {
      return res.status(404).json({ error: "Member not found." });
    }

    if (role === "owner" && currentMember.role !== "owner") {
      return res.status(403).json({ error: "Only owner can assign owner role." });
    }

    if (currentMember.role === "admin") {
      if (targetMember.role === "owner" || targetMember.role === "admin") {
        return res.status(403).json({ error: "Cannot change role of owner or admin." });
      }
    }

    const oldRole = targetMember.role;
    targetMember.role = role;
    await workspace.save();

    const targetUser = await User.findById(userId);
    if (targetUser && targetUser.workspaceId?.toString() === workspace._id.toString()) {
      targetUser.role = role;
      await targetUser.save();
    }

    // ── Audit log: role changed ─────────────────────────────
    await addAuditLog(
      workspace._id,
      user._id,
      "role_change",
      `Changed ${targetUser?.email || userId}'s role from ${oldRole} to ${role}`,
      { userId, oldRole, newRole: role }
    );

    res.json({ success: true, member: { userId, role } });
  } catch (err) {
    console.error("Update member role error:", err);
    res.status(500).json({ error: "Failed to update member role" });
  }
};

// ─── Leave workspace ──────────────────────────────────────────
export const leaveWorkspace = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const member = workspace.members.find(
      (m) => m.userId.toString() === user._id.toString()
    );
    if (!member) {
      return res.status(404).json({ error: "You are not a member of this workspace." });
    }

    if (member.role === "owner") {
      const ownerCount = workspace.members.filter(m => m.role === "owner").length;
      if (ownerCount === 1) {
        return res.status(400).json({ error: "You are the only owner. Transfer ownership first." });
      }
    }

    workspace.members = workspace.members.filter(
      (m) => m.userId.toString() !== user._id.toString()
    );
    await workspace.save();

    user.workspaceId = null;
    user.role = "member";
    await user.save();

    // ── Audit log: user left workspace ──────────────────────
    await addAuditLog(
      workspace._id,
      user._id,
      "leave",
      `User ${user.email} left the workspace`
    );

    res.json({ success: true, message: "Left workspace." });
  } catch (err) {
    console.error("Leave workspace error:", err);
    res.status(500).json({ error: "Failed to leave workspace" });
  }
};

// ─── List members ──────────────────────────────────────────────
export const listMembers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);
    const populated = await WorkSpace.findById(workspace._id)
      .populate("members.userId", "name email")
      .lean();

    res.json({ success: true, members: populated.members });
  } catch (err) {
    console.error("List members error:", err);
    res.status(500).json({ error: "Failed to list members" });
  }
};

// ─── API Keys ──────────────────────────────────────────────────

function generateApiKey() {
  return `cv_${crypto.randomBytes(32).toString('hex')}`;
}

// ─── Get API Keys ──────────────────────────────────────────────
export const getApiKeys = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);
    res.json({ success: true, apiKeys: workspace.apiKeys || [] });
  } catch (err) {
    console.error("Get API keys error:", err);
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
};

// ─── Create API Key ────────────────────────────────────────────
export const createApiKey = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: "API key name must be at least 3 characters." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const member = workspace.members.find(m => m.userId.toString() === user._id.toString());
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const newKey = {
      _id: new mongoose.Types.ObjectId(),
      name: name.trim(),
      key: generateApiKey(),
      createdAt: new Date(),
      lastUsed: null,
    };

    if (!workspace.apiKeys) workspace.apiKeys = [];
    workspace.apiKeys.push(newKey);
    await workspace.save();

    // ── Audit log: API key created ──────────────────────────
    await addAuditLog(
      workspace._id,
      user._id,
      "api_key_create",
      `Created API key: ${newKey.name}`,
      { keyId: newKey._id }
    );

    res.json({ success: true, apiKey: newKey });
  } catch (err) {
    console.error("Create API key error:", err);
    res.status(500).json({ error: "Failed to create API key" });
  }
};

// ─── Delete API Key ────────────────────────────────────────────
export const deleteApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const member = workspace.members.find(m => m.userId.toString() === user._id.toString());
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    // Find key name before deletion
    const keyToDelete = workspace.apiKeys.find(k => k._id.toString() === keyId);
    const keyName = keyToDelete?.name || keyId;

    workspace.apiKeys = workspace.apiKeys.filter(k => k._id.toString() !== keyId);
    await workspace.save();

    // ── Audit log: API key deleted ──────────────────────────
    await addAuditLog(
      workspace._id,
      user._id,
      "api_key_delete",
      `Deleted API key: ${keyName}`,
      { keyId }
    );

    res.json({ success: true, message: "API key deleted" });
  } catch (err) {
    console.error("Delete API key error:", err);
    res.status(500).json({ error: "Failed to delete API key" });
  }
};

// ─── Update Integrations ────────────────────────────────────────
export const updateIntegrations = async (req, res) => {
  try {
    const { slack, jira } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const member = workspace.members.find(m => m.userId.toString() === user._id.toString());
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    if (!workspace.settings) workspace.settings = {};
    if (!workspace.settings.integrations) workspace.settings.integrations = {};

    if (slack) workspace.settings.integrations.slack = slack;
    if (jira) workspace.settings.integrations.jira = jira;

    await workspace.save();

    // ── Audit log: integrations updated ─────────────────────
    await addAuditLog(
      workspace._id,
      user._id,
      "integration_update",
      `Updated integrations (Slack: ${!!slack}, Jira: ${!!jira})`
    );

    res.json({ success: true, integrations: workspace.settings.integrations });
  } catch (err) {
    console.error("Update integrations error:", err);
    res.status(500).json({ error: "Failed to update integrations" });
  }
};

// ─── Audit Log ──────────────────────────────────────────────────
export const getAuditLogs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);
    // Populate user details for each log entry
    await workspace.populate("auditLogs.userId", "name email");
    const logs = workspace.auditLogs || [];

    const recent = logs.slice(-50).reverse();
    res.json({ success: true, logs: recent });
  } catch (err) {
    console.error("Get audit logs error:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};

// ─── Helper: Add audit log ─────────────────────────────────────
export const addAuditLog = async (workspaceId, userId, action, message, metadata = {}) => {
  try {
    const workspace = await WorkSpace.findById(workspaceId);
    if (!workspace) return;

    if (!workspace.auditLogs) workspace.auditLogs = [];
    workspace.auditLogs.push({
      userId,
      action,
      message,
      metadata,
      createdAt: new Date(),
    });

    if (workspace.auditLogs.length > 1000) {
      workspace.auditLogs = workspace.auditLogs.slice(-1000);
    }

    await workspace.save();
  } catch (err) {
    console.error("Add audit log error:", err);
  }
};

// ─── Get repositories for workspace ────────────────────────────
export const getRepositories = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    // Get all reports for this workspace
    const reports = await Report.find({ workspaceId: workspace._id })
      .sort({ createdAt: -1 })
      .lean();

    // Group by repoUrl
    const repoMap = new Map();

    reports.forEach((report) => {
      const url = report.repoUrl;
      if (!repoMap.has(url)) {
        repoMap.set(url, {
          repoUrl: url,
          scans: [],
          totalScans: 0,
          latestGrade: null,
          latestScore: 0,
          avgScore: 0,
        });
      }
      const entry = repoMap.get(url);
      entry.scans.push(report);
      entry.totalScans += 1;
    });

    // Compute aggregated data
    const repositories = Array.from(repoMap.values()).map((entry) => {
      const sorted = entry.scans.sort((a, b) => b.createdAt - a.createdAt);
      const latest = sorted[0];
      const grades = sorted.map((r) => r.grade || "N/A");
      // Most frequent grade
      const gradeCounts = grades.reduce((acc, g) => {
        acc[g] = (acc[g] || 0) + 1;
        return acc;
      }, {});
      let mostFrequentGrade = "N/A";
      let maxCount = 0;
      for (const [g, count] of Object.entries(gradeCounts)) {
        if (count > maxCount) {
          maxCount = count;
          mostFrequentGrade = g;
        }
      }

      // Average scores
      let totalQuality = 0,
        totalSecurity = 0,
        totalPerf = 0,
        totalMaint = 0;
      entry.scans.forEach((r) => {
        const s = r.scores || {};
        totalQuality += s.codeQuality || 0;
        totalSecurity += s.security || 0;
        totalPerf += s.performance || 0;
        totalMaint += s.maintainability || 0;
      });
      const count = entry.totalScans;
      const avgQuality = Math.round(totalQuality / count);
      const avgSecurity = Math.round(totalSecurity / count);
      const avgPerf = Math.round(totalPerf / count);
      const avgMaint = Math.round(totalMaint / count);
      const overallAvg = Math.round((avgQuality + avgSecurity + avgPerf + avgMaint) / 4);

      return {
        repoUrl: entry.repoUrl,
        totalScans: entry.totalScans,
        latestScan: latest,
        latestGrade: latest?.grade || "N/A",
        latestScore: latest?.scores ? Math.round(
          (latest.scores.codeQuality + latest.scores.security + latest.scores.performance + latest.scores.maintainability) / 4
        ) : 0,
        avgQuality,
        avgSecurity,
        avgPerf,
        avgMaint,
        overallAvg,
        mostFrequentGrade,
        lastScannedAt: latest?.createdAt || null,
      };
    });

    // Sort by last scanned (most recent first)
    repositories.sort((a, b) => {
      if (!a.lastScannedAt) return 1;
      if (!b.lastScannedAt) return -1;
      return new Date(b.lastScannedAt) - new Date(a.lastScannedAt);
    });

    res.json({ success: true, repositories });
  } catch (err) {
    console.error("Get repositories error:", err);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
};