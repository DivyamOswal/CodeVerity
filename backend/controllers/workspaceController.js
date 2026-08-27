// backend/controllers/workspaceController.js
import User from "../models/User.js";
import WorkSpace from "../models/WorkSpace.js";

// ─── Helper: Ensure user has a workspace ──────────────────────
async function ensureWorkspace(user) {
  if (user.workspaceId) {
    const existing = await WorkSpace.findById(user.workspaceId);
    if (existing) return existing;
  }
  // Create a new workspace for the user
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

    targetMember.role = role;
    await workspace.save();

    const targetUser = await User.findById(userId);
    if (targetUser && targetUser.workspaceId?.toString() === workspace._id.toString()) {
      targetUser.role = role;
      await targetUser.save();
    }

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