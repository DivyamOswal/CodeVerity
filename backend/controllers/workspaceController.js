// backend/controllers/workspaceController.js
import Workspace from "../models/Workspace.js";
import User from "../models/User.js";

// ─── Get workspace details ────────────────────────────────────
export const getWorkspace = async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;
    const workspace = await Workspace.findById(workspaceId)
      .populate("members.userId", "name email")
      .lean();

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    res.json({ success: true, workspace });
  } catch (err) {
    console.error("Get workspace error:", err);
    res.status(500).json({ error: "Failed to fetch workspace" });
  }
};

// ─── Update workspace name ────────────────────────────────────
export const updateWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    const workspaceId = req.user.workspaceId;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Workspace name must be at least 2 characters." });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const member = workspace.members.find(
      (m) => m.userId.toString() === req.user.id
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
    const workspaceId = req.user.workspaceId;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const currentMember = workspace.members.find(
      (m) => m.userId.toString() === req.user.id
    );
    if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ error: "User not found." });
    }

    const alreadyMember = workspace.members.some(
      (m) => m.userId.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ error: "User is already a member of this workspace." });
    }

    workspace.members.push({ userId: userToAdd._id, role });
    await workspace.save();

    if (!userToAdd.workspaceId) {
      userToAdd.workspaceId = workspaceId;
      userToAdd.role = role;
      await userToAdd.save();
    }

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
    const workspaceId = req.user.workspaceId;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const currentMember = workspace.members.find(
      (m) => m.userId.toString() === req.user.id
    );
    if (!currentMember) {
      return res.status(403).json({ error: "Permission denied." });
    }

    if (userId === req.user.id) {
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

    workspace.members = workspace.members.filter(
      (m) => m.userId.toString() !== userId
    );
    await workspace.save();

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
    const workspaceId = req.user.workspaceId;

    if (!["owner", "admin", "member", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const currentMember = workspace.members.find(
      (m) => m.userId.toString() === req.user.id
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

    targetMember.role = role;
    await workspace.save();

    const user = await User.findById(userId);
    if (user && user.workspaceId?.toString() === workspaceId.toString()) {
      user.role = role;
      await user.save();
    }

    res.json({ success: true, member: { userId, role } });
  } catch (err) {
    console.error("Update member role error:", err);
    res.status(500).json({ error: "Failed to update member role" });
  }
};

// ─── Leave workspace (NEW) ──────────────────────────────────────
export const leaveWorkspace = async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;
    const userId = req.user.id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const member = workspace.members.find(
      (m) => m.userId.toString() === userId
    );
    if (!member) {
      return res.status(404).json({ error: "You are not a member of this workspace." });
    }

    // If owner, check if they're the only owner
    if (member.role === "owner") {
      const ownerCount = workspace.members.filter(m => m.role === "owner").length;
      if (ownerCount === 1) {
        return res.status(400).json({ error: "You are the only owner. Transfer ownership first." });
      }
    }

    // Remove member
    workspace.members = workspace.members.filter(
      (m) => m.userId.toString() !== userId
    );
    await workspace.save();

    // Update user
    const user = await User.findById(userId);
    if (user) {
      user.workspaceId = null;
      user.role = "member";
      await user.save();
    }

    res.json({ success: true, message: "Left workspace." });
  } catch (err) {
    console.error("Leave workspace error:", err);
    res.status(500).json({ error: "Failed to leave workspace" });
  }
};
