// backend/controllers/dashboardController.js
import Report from "../models/Report.js";
import User from "../models/User.js";
import Workspace from "../models/Workspace.js";

// Helper to ensure a user has a workspace
async function ensureWorkspace(user) {
  let workspaceId = user.workspaceId;
  let workspace = null;

  if (workspaceId) {
    workspace = await Workspace.findById(workspaceId).select("name members totalScans totalReports").lean();
  }

  if (!workspace) {
    // Create a new workspace
    const newWorkspace = await Workspace.create({
      name: `${user.name}'s Workspace`,
      ownerId: user._id,
      members: [{ userId: user._id, role: "owner" }],
    });
    user.workspaceId = newWorkspace._id;
    user.role = "owner";
    await user.save();
    workspace = newWorkspace.toObject();
  }

  return workspace;
}

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // 2. Ensure workspace exists
    const workspace = await ensureWorkspace(user);
    const workspaceId = workspace._id;

    // 3. Fetch reports for this workspace
    const reports = await Report.find({ workspaceId })
      .sort({ createdAt: -1 })
      .lean();

    const totalScans = reports.length;

    let avgScore = 0;
    let avgSecurity = 0;
    let avgDevops = 0;

    if (totalScans > 0) {
      const sum = reports.reduce(
        (acc, r) => {
          const s = r.scores ?? {};
          acc.quality += s.codeQuality ?? 0;
          acc.security += s.security ?? 0;
          acc.perf += s.performance ?? 0;
          acc.maint += s.maintainability ?? 0;
          return acc;
        },
        { quality: 0, security: 0, perf: 0, maint: 0 }
      );

      avgScore = Math.round((sum.quality + sum.perf + sum.maint) / (totalScans * 3));
      avgSecurity = Math.round(sum.security / totalScans);
      avgDevops = Math.round((sum.perf + sum.maint) / (totalScans * 2));
    }

    const recentReports = reports.slice(0, 5).map((r) => ({
      _id: r._id,
      repoUrl: r.repoUrl,
      grade: r.grade,
      scores: r.scores,
      summary: r.summary,
      architecture: r.architecture,
      bugs: r.bugs,
      securityIssues: r.securityIssues,
      futureRoadmap: r.futureRoadmap,
      toolsAndPackages: r.toolsAndPackages,
      finalVerdict: r.finalVerdict,
      createdAt: r.createdAt,
    }));

    const gradeDistribution = reports.reduce((acc, r) => {
      const g = (r.grade ?? "N/A")[0];
      acc[g] = (acc[g] ?? 0) + 1;
      return acc;
    }, {});

    // Get current user (for token/scan status)
    const userData = await User.findById(userId)
      .select("name email tokensRemaining totalTokensUsed scansUsedThisMonth scansLimit plan role")
      .lean();

    res.json({
      user: {
        id: userId,
        name: userData?.name ?? "",
        email: userData?.email ?? req.user.email ?? "",
        tokensRemaining: userData?.tokensRemaining ?? 0,
        totalTokensUsed: userData?.totalTokensUsed ?? 0,
        scansUsedThisMonth: userData?.scansUsedThisMonth ?? 0,
        scansLimit: userData?.scansLimit ?? 0,
        plan: userData?.plan ?? "starter",
        role: userData?.role ?? "member",
      },
      workspace: {
        id: workspace._id,
        name: workspace.name,
        memberCount: workspace.members?.length ?? 0,
        totalScans: workspace.totalScans ?? totalScans,
      },
      stats: {
        totalScans,
        avgScore,
        securityScore: avgSecurity,
        devopsScore: avgDevops,
        gradeDistribution,
      },
      recentReports,
    });
  } catch (err) {
    console.error("Dashboard fetch failed:", err.message);
    res.status(500).json({ error: "Dashboard fetch failed" });
  }
};