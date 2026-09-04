import User from "../models/User.js";
import WorkSpace from "../models/WorkSpace.js";
import Report from "../models/Report.js";
import Transaction from "../models/Transaction.js";

export const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalWorkspaces = await WorkSpace.countDocuments();
    const totalReports = await Report.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    // Calculate revenue
    const revenueAgg = await Transaction.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({
      totalUsers,
      totalWorkspaces,
      totalReports,
      totalTransactions,
      totalRevenue,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const query = search ? { name: { $regex: search, $options: "i" } } : {};
    const users = await User.find(query)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    const total = await User.countDocuments(query);
    res.json({ users, total, page, limit });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const toggleAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Prevent self‑removal from admin
    if (userId === req.user.id) {
      return res.status(400).json({ error: "Cannot change your own admin status" });
    }
    user.isGlobalAdmin = !user.isGlobalAdmin;
    await user.save();
    res.json({ success: true, isGlobalAdmin: user.isGlobalAdmin });
  } catch (err) {
    console.error("Toggle admin error:", err);
    res.status(500).json({ error: "Failed to toggle admin" });
  }
};

export const getAllWorkspaces = async (req, res) => {
  try {
    const workspaces = await WorkSpace.find()
      .populate("ownerId", "name email")
      .lean();
    res.json({ workspaces });
  } catch (err) {
    console.error("Get workspaces error:", err);
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, workspaceId, userId } = req.query;
    const query = {};
    if (workspaceId) query.workspaceId = workspaceId;
    if (userId) query.userId = userId;
    const reports = await Report.find(query)
      .populate("userId", "name email")
      .populate("workspaceId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    const total = await Report.countDocuments(query);
    res.json({ reports, total, page, limit });
  } catch (err) {
    console.error("Get reports error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};


export const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await WorkSpace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });
    await Report.deleteMany({ workspaceId });
    await workspace.deleteOne();
    res.json({ success: true, message: "Workspace and all associated data deleted." });
  } catch (err) {
    console.error("Delete workspace error:", err);
    res.status(500).json({ error: "Failed to delete workspace" });
  }
};