// backend/controllers/analyzeController.js
import { analyzeWithGroq, generateTests } from "../utils/groq.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import WorkSpace from "../models/WorkSpace.js";
import { addAuditLog } from "./workspaceController.js";

// ─── Helper: estimate tokens if not returned ──────────────
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// ─── Helper: Increment workspace scan counter ──────────────
async function incrementWorkspaceScans(workspaceId) {
  try {
    const workspace = await WorkSpace.findById(workspaceId);
    if (!workspace) return;
    workspace.totalScans = (workspace.totalScans || 0) + 1;
    await workspace.save();
  } catch (err) {
    console.error("Failed to increment workspace scans:", err);
  }
}

// ─── POST /api/analyze ─────────────────────────────────────
export const analyzeCode = async (req, res) => {
  try {
    const { code, repoUrl } = req.body;

    if (!code || code.trim().length < 10) {
      return res.status(400).json({ error: "Invalid code input." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // 1. Perform AI analysis
    const response = await analyzeWithGroq(code);
    const tokensUsed = response.usage?.total_tokens ?? estimateTokens(code);

    // 2. Deduct tokens
    const deducted = await user.deductTokens(tokensUsed);
    if (!deducted) {
      if (user.workspaceId) {
        addAuditLog(
          user.workspaceId,
          user._id,
          "scan_failed",
          `Insufficient tokens (needed ${tokensUsed}, have ${user.tokensRemaining})`,
          { repoUrl: repoUrl || "unknown", tokensNeeded: tokensUsed }
        );
      }
      return res.status(402).json({
        error: `Insufficient tokens. You have ${user.tokensRemaining} tokens, need ${tokensUsed}.`,
      });
    }

    // 3. Save report to database
    const reportData = {
      userId: user._id,
      workspaceId: user.workspaceId,
      repoUrl: repoUrl || "Unknown repository",
      summary: response.result?.summary || "",
      architecture: response.result?.architecture || [],
      bugs: response.result?.bugs || [],
      securityIssues: response.result?.securityIssues || [],
      futureRoadmap: response.result?.futureRoadmap || [],
      toolsAndPackages: response.result?.toolsAndPackages || [],
      scores: response.result?.scores || {},
      grade: response.result?.grade || "N/A",
      finalVerdict: response.result?.finalVerdict || "",
      _sourceCode: code,
      // Enhanced fields if present
      healthScore: response.result?.healthScore || null,
      securityVulnerabilities: response.result?.securityVulnerabilities || [],
      dependencyVulnerabilities: response.result?.dependencyVulnerabilities || [],
      secrets: response.result?.secrets || [],
      techDebt: response.result?.techDebt || null,
      architectureGraph: response.result?.architectureGraph || null,
    };

    const report = new Report(reportData);
    await report.save();

    // 4. Increment workspace scan counter
    if (user.workspaceId) {
      await incrementWorkspaceScans(user.workspaceId);
    }

    // 5. Audit log: successful scan
    if (user.workspaceId) {
      addAuditLog(
        user.workspaceId,
        user._id,
        "scan",
        `Scanned repository: ${repoUrl || "unknown"}`,
        { repoUrl: repoUrl || "unknown", tokensUsed, tokensRemaining: user.tokensRemaining, reportId: report._id }
      );
    }

    // 6. Return report + analysis data
    return res.status(200).json({
      ...response.result,
      _sourceCode: code,
      tokensUsed,
      tokensRemaining: user.tokensRemaining,
      reportId: report._id,
    });

  } catch (err) {
    console.error("analyzeCode error:", err);

    // Audit log: scan failure
    try {
      const user = await User.findById(req.user.id);
      if (user?.workspaceId) {
        addAuditLog(
          user.workspaceId,
          user._id,
          "scan_failed",
          `Analysis failed: ${err.message}`,
          { error: err.message }
        );
      }
    } catch (_) { /* ignore audit failure */ }

    return res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/analyze/generate-tests ──────────────────────
export const generateTestCases = async (req, res) => {
  try {
    const { code, repoUrl } = req.body;

    if (!code || typeof code !== "string" || code.trim().length < 10) {
      return res.status(400).json({
        error: "Request body must contain a non-empty 'code' string.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    console.log(`📥 /api/generate-tests received ${code.length} chars`);

    const result = await generateTests(code);
    let tokensUsed = result?.usage?.total_tokens ?? estimateTokens(code);
    console.log(`🔢 Tokens used: ${tokensUsed}`);

    const deducted = await user.deductTokens(tokensUsed);
    if (!deducted) {
      if (user.workspaceId) {
        addAuditLog(
          user.workspaceId,
          user._id,
          "test_failed",
          `Insufficient tokens for test generation (needed ${tokensUsed}, have ${user.tokensRemaining})`,
          { repoUrl: repoUrl || "unknown", tokensNeeded: tokensUsed }
        );
      }
      return res.status(402).json({
        error: `Insufficient tokens. You have ${user.tokensRemaining} tokens, need ${tokensUsed}.`,
      });
    }

    // Audit log: successful test generation
    if (user.workspaceId) {
      addAuditLog(
        user.workspaceId,
        user._id,
        "test_generate",
        `Generated tests${repoUrl ? ` for ${repoUrl}` : ""}`,
        { repoUrl: repoUrl || "unknown", tokensUsed, tokensRemaining: user.tokensRemaining }
      );
    }

    return res.status(200).json({
      ...result,
      tokensUsed,
      tokensRemaining: user.tokensRemaining,
    });

  } catch (err) {
    console.error("❌ generateTestCases error:", err.message);

    try {
      const user = await User.findById(req.user.id);
      if (user?.workspaceId) {
        addAuditLog(
          user.workspaceId,
          user._id,
          "test_failed",
          `Test generation failed: ${err.message}`,
          { error: err.message }
        );
      }
    } catch (_) { /* ignore audit failure */ }

    return res.status(500).json({ error: err.message ?? "Test generation failed." });
  }
};