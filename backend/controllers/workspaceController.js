// backend/controllers/workspaceController.js
import User from "../models/User.js";
import WorkSpace from "../models/WorkSpace.js";
import crypto from 'crypto';         
import mongoose from 'mongoose';
import Report from "../models/Report.js";

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

// ─── Get workspace analytics ──────────────────────────────────
export const getWorkspaceAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);
    const workspaceId = workspace._id;

    // 1. Get all member IDs
    const memberIds = workspace.members.map((m) => m.userId);

    // 2. Aggregate per‑member stats (scans & tokens)
    const memberAggregation = await Report.aggregate([
      { $match: { workspaceId: workspaceId } },
      {
        $group: {
          _id: "$userId",
          totalScans: { $sum: 1 },
          totalTokens: { $sum: { $ifNull: ["$tokensUsed", 0] } },
        },
      },
    ]);

    // 3. Fetch user details
    const users = await User.find({ _id: { $in: memberIds } }).select("name email");
    const memberData = users.map((u) => {
      const stats = memberAggregation.find(
        (a) => a._id.toString() === u._id.toString()
      );
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        totalScans: stats ? stats.totalScans : 0,
        totalTokens: stats ? stats.totalTokens : 0,
      };
    });

    // 4. Daily usage (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyUsage = await Report.aggregate([
      {
        $match: {
          workspaceId: workspaceId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          scans: { $sum: 1 },
          tokens: { $sum: { $ifNull: ["$tokensUsed", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 5. Overall totals
    const totalTokensAgg = await Report.aggregate([
      { $match: { workspaceId: workspaceId } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$tokensUsed", 0] } } } },
    ]);

    const totalTokens = totalTokensAgg.length > 0 ? totalTokensAgg[0].total : 0;
    const totalScans = workspace.totalScans || 0;

    res.json({
      success: true,
      analytics: {
        totalScans,
        totalTokens,
        totalMembers: memberIds.length,
        members: memberData,
        dailyUsage,
        lastUpdated: new Date(),
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

// ─── Update Webhook ─────────────────────────────────────────────
export const updateWebhook = async (req, res) => {
  try {
    const { webhookUrl, webhookSecret } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const member = workspace.members.find(m => m.userId.toString() === user._id.toString());
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    if (webhookUrl !== undefined) workspace.webhookUrl = webhookUrl.trim();
    if (webhookSecret !== undefined) workspace.webhookSecret = webhookSecret.trim();

    await workspace.save();

    await addAuditLog(
      workspace._id,
      user._id,
      "webhook_update",
      `Updated webhook URL: ${webhookUrl || "removed"}`
    );

    res.json({ success: true, webhookUrl: workspace.webhookUrl });
  } catch (err) {
    console.error("Update webhook error:", err);
    res.status(500).json({ error: "Failed to update webhook" });
  }
};

// ─── Test Webhook ───────────────────────────────────────────────
export const testWebhook = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);
    if (!workspace.webhookUrl) {
      return res.status(400).json({ error: "No webhook URL configured." });
    }

    const payload = {
      event: "test",
      workspace: workspace.name,
      timestamp: new Date().toISOString(),
      message: "This is a test webhook from CodeVerity.",
    };

    const response = await fetch(workspace.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(workspace.webhookSecret && { "X-Webhook-Secret": workspace.webhookSecret }),
      },
      body: JSON.stringify(payload),
    });

    const status = response.status;
    const text = await response.text();

    await addAuditLog(
      workspace._id,
      user._id,
      "webhook_test",
      `Test webhook sent to ${workspace.webhookUrl} - status ${status}`
    );

    res.json({
      success: status >= 200 && status < 300,
      status,
      response: text.substring(0, 500),
    });
  } catch (err) {
    console.error("Test webhook error:", err);
    res.status(500).json({ error: "Failed to test webhook" });
  }
};

// ─── Trigger Webhook (call this after a scan completes) ──────
export const triggerWebhook = async (workspaceId, report, user) => {
  try {
    const workspace = await WorkSpace.findById(workspaceId);
    if (!workspace || !workspace.webhookUrl) return;

    const payload = {
      event: "scan.completed",
      workspace: workspace.name,
      report: {
        id: report._id,
        repoUrl: report.repoUrl,
        grade: report.grade,
        scores: report.scores,
        summary: report.summary,
        totalIssues: (report.bugs?.length || 0) + (report.securityIssues?.length || 0),
        createdAt: report.createdAt,
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(workspace.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(workspace.webhookSecret && { "X-Webhook-Secret": workspace.webhookSecret }),
      },
      body: JSON.stringify(payload),
    });

    // Log webhook attempt (store in audit log with result)
    await addAuditLog(
      workspaceId,
      user._id,
      "webhook_trigger",
      `Webhook triggered for ${report.repoUrl} - status ${response.status}`,
      { repoUrl: report.repoUrl, status: response.status }
    );

    // Retry logic for failures (optional: queue with exponential backoff)
    if (!response.ok) {
      console.warn(`Webhook failed for ${workspace.webhookUrl}: ${response.status}`);
    }
  } catch (err) {
    console.error("Trigger webhook error:", err);
    await addAuditLog(
      workspaceId,
      user._id,
      "webhook_failed",
      `Webhook failed for ${report.repoUrl}: ${err.message}`
    );
  }
};

// ─── Get quality trends ─────────────────────────────────────────
export const getQualityTrends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);
    const workspaceId = workspace._id;

    // Group by week, last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const trends = await Report.aggregate([
      {
        $match: {
          workspaceId: workspaceId,
          createdAt: { $gte: threeMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            week: { $isoWeek: "$createdAt" },
            year: { $isoWeekYear: "$createdAt" },
          },
          codeQuality: { $avg: "$scores.codeQuality" },
          security: { $avg: "$scores.security" },
          performance: { $avg: "$scores.performance" },
          maintainability: { $avg: "$scores.maintainability" },
          scans: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    // Format for frontend charts
    const formatted = trends.map((t) => ({
      period: `Week ${t._id.week}, ${t._id.year}`,
      week: t._id.week,
      year: t._id.year,
      codeQuality: Math.round(t.codeQuality || 0),
      security: Math.round(t.security || 0),
      performance: Math.round(t.performance || 0),
      maintainability: Math.round(t.maintainability || 0),
      scans: t.scans,
    }));

    res.json({
      success: true,
      trends: formatted,
      period: "weekly",
    });
  } catch (err) {
    console.error("Get quality trends error:", err);
    res.status(500).json({ error: "Failed to fetch trends" });
  }
};

// ─── BRANDING ──────────────────────────────────────────────────
export const updateBranding = async (req, res) => {
  try {
    const { logo, primaryColor, secondaryColor, brandName } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const member = workspace.members.find(m => m.userId.toString() === user._id.toString());
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    if (!workspace.branding) workspace.branding = {};

    if (logo !== undefined) workspace.branding.logo = logo;
    if (primaryColor) workspace.branding.primaryColor = primaryColor;
    if (secondaryColor) workspace.branding.secondaryColor = secondaryColor;
    if (brandName) workspace.branding.brandName = brandName;

    await workspace.save();

    await addAuditLog(
      workspace._id,
      user._id,
      "branding_update",
      `Updated branding (${brandName || "CodeVerity"})`
    );

    res.json({ success: true, branding: workspace.branding });
  } catch (err) {
    console.error("Update branding error:", err);
    res.status(500).json({ error: "Failed to update branding" });
  }
};

// ─── SCHEDULES ──────────────────────────────────────────────────
export const getSchedules = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);
    res.json({ success: true, schedules: workspace.schedules || [] });
  } catch (err) {
    console.error("Get schedules error:", err);
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const { repoUrl, frequency, time } = req.body;
    if (!repoUrl || !frequency || !time) {
      return res.status(400).json({ error: "repoUrl, frequency, and time are required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const member = workspace.members.find(m => m.userId.toString() === user._id.toString());
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      return res.status(400).json({ error: "Time must be in HH:mm format (24h)." });
    }

    const existing = workspace.schedules?.find(s => s.repoUrl === repoUrl && s.enabled);
    if (existing) {
      return res.status(400).json({ error: "This repository already has an active schedule." });
    }

    const newSchedule = {
      _id: new mongoose.Types.ObjectId(),
      repoUrl,
      frequency,
      time,
      enabled: true,
      createdAt: new Date(),
    };

    if (!workspace.schedules) workspace.schedules = [];
    workspace.schedules.push(newSchedule);
    await workspace.save();

    await addAuditLog(
      workspace._id,
      user._id,
      "schedule_create",
      `Created schedule for ${repoUrl} (${frequency} at ${time})`
    );

    // Schedule the job if scheduler is available
    try {
      const { scheduleJob } = await import("../services/scheduler.js");
      scheduleJob(workspace._id, newSchedule);
    } catch (schedulerErr) {
      console.warn("Scheduler not available:", schedulerErr.message);
    }

    res.status(201).json({ success: true, schedule: newSchedule });
  } catch (err) {
    console.error("Create schedule error:", err);
    res.status(500).json({ error: "Failed to create schedule" });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const member = workspace.members.find(m => m.userId.toString() === user._id.toString());
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const schedule = workspace.schedules.find(s => s._id.toString() === id);
    if (!schedule) return res.status(404).json({ error: "Schedule not found." });

    workspace.schedules = workspace.schedules.filter(s => s._id.toString() !== id);
    await workspace.save();

    await addAuditLog(
      workspace._id,
      user._id,
      "schedule_delete",
      `Deleted schedule for ${schedule.repoUrl}`
    );

    // Cancel the cron job
    try {
      const { cancelJob } = await import("../services/scheduler.js");
      cancelJob(workspace._id, id);
    } catch (schedulerErr) {
      console.warn("Scheduler not available:", schedulerErr.message);
    }

    res.json({ success: true, message: "Schedule deleted." });
  } catch (err) {
    console.error("Delete schedule error:", err);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
};

// ─── WEBHOOKS ──────────────────────────────────────────────────
export const updateWebhook = async (req, res) => {
  try {
    const { webhookUrl, webhookSecret } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const member = workspace.members.find(m => m.userId.toString() === user._id.toString());
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    if (webhookUrl !== undefined) workspace.webhookUrl = webhookUrl.trim();
    if (webhookSecret !== undefined) workspace.webhookSecret = webhookSecret.trim();

    await workspace.save();

    await addAuditLog(
      workspace._id,
      user._id,
      "webhook_update",
      `Updated webhook URL: ${webhookUrl || "removed"}`
    );

    res.json({ success: true, webhookUrl: workspace.webhookUrl });
  } catch (err) {
    console.error("Update webhook error:", err);
    res.status(500).json({ error: "Failed to update webhook" });
  }
};

export const testWebhook = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);
    if (!workspace.webhookUrl) {
      return res.status(400).json({ error: "No webhook URL configured." });
    }

    const payload = {
      event: "test",
      workspace: workspace.name,
      timestamp: new Date().toISOString(),
      message: "This is a test webhook from CodeVerity.",
    };

    const response = await fetch(workspace.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(workspace.webhookSecret && { "X-Webhook-Secret": workspace.webhookSecret }),
      },
      body: JSON.stringify(payload),
    });

    const status = response.status;
    const text = await response.text();

    await addAuditLog(
      workspace._id,
      user._id,
      "webhook_test",
      `Test webhook sent to ${workspace.webhookUrl} - status ${status}`
    );

    res.json({
      success: status >= 200 && status < 300,
      status,
      response: text.substring(0, 500),
    });
  } catch (err) {
    console.error("Test webhook error:", err);
    res.status(500).json({ error: "Failed to test webhook" });
  }
};
