// backend/controllers/githubController.js
import { analyzeWithGroq, generateTests } from "../utils/groq.js";
import { cloneAndParseGithubRepo, parseGithubRepo, estimateTokens } from "../utils/githubParser.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import { Octokit } from "@octokit/rest";
import { analyzeWithGroq } from "../utils/groq.js";
import {
  scanDependencies,
  scanSecrets,
  scanSecurity,
  calculateTechDebt,
  generateArchitectureGraph,
  computeHealthScore,
} from "../utils/scanners.js";
import fs from "fs/promises";

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

function statusForError(err) {
  const msg = err.message || "";
  if (/rate limit/i.test(msg)) return 429;
  if (/not found|private/i.test(msg)) return 404;
  if (/invalid github url/i.test(msg)) return 400;
  return 500;
}

export const analyzeGithubRepo = async (req, res) => {
  const { repoUrl } = req.body;
  const userId = req.user.id;

  if (!repoUrl || typeof repoUrl !== "string") {
    return res.status(400).json({ error: "Repo URL required." });
  }
  if (!GITHUB_URL_PATTERN.test(repoUrl.trim())) {
    return res.status(400).json({ error: "Enter a valid GitHub repo URL." });
  }

  let repoPath = null;
  let code = null;

  try {
    // 1. Get user and check token balance / scan limits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // // Check scan limit (monthly)
    // const canScan = await user.incrementScanUsage();
    // if (!canScan) {
    //   return res.status(429).json({
    //     error: `Monthly scan limit reached (${user.scansLimit} scans). Upgrade your plan or wait for next month.`,
    //   });
    // }

    // 2. Clone and parse the repo
    const parsed = await cloneAndParseGithubRepo(repoUrl.trim());
    code = parsed.code;
    repoPath = parsed.repoPath;

    if (!code) {
      throw new Error("No source code extracted from repository.");
    }

    // 3. Run AI analysis
    const aiResponse = await analyzeWithGroq(code);
    const ai = aiResponse.result;
    const usage = aiResponse.usage || { total_tokens: 0 };
    const tokensUsed = usage.total_tokens || 0;

    // Deduct tokens
    const deducted = await user.deductTokens(tokensUsed);
    if (!deducted) {
      return res.status(429).json({
        error: `Insufficient tokens. You have ${user.tokensRemaining} tokens remaining.`,
      });
    }
    // user.tokensRemaining is updated by deductTokens

    // Build AI analysis object
    const aiAnalysis = {
      summary: ai.summary ?? "No summary provided.",
      architecture: Array.isArray(ai.architecture) ? ai.architecture : [],
      bugs: Array.isArray(ai.bugs) ? ai.bugs : [],
      securityIssues: Array.isArray(ai.securityIssues) ? ai.securityIssues : [],
      futureRoadmap: Array.isArray(ai.futureRoadmap) ? ai.futureRoadmap : [],
      toolsAndPackages: Array.isArray(ai.toolsAndPackages) ? ai.toolsAndPackages : [],
      scores: ai.scores ?? { codeQuality: 0, security: 0, performance: 0, maintainability: 0 },
      grade: ai.grade ?? "N/A",
      finalVerdict: ai.finalVerdict ?? "",
    };

    // 4. Run local scanners – with individual try/catch to prevent total failure
    let depVulns = [],
        secrets = [],
        secVulns = [],
        graph = { nodes: [], edges: [] };
    let techDebt = { estimatedHours: 0, issues: [] };

    if (repoPath) {
      try {
        depVulns = await scanDependencies(repoPath);
      } catch (err) {
        console.warn("⚠️ Dependency scan failed:", err.message);
        depVulns = [];
      }
      try {
        secrets = await scanSecrets(repoPath);
      } catch (err) {
        console.warn("⚠️ Secrets scan failed:", err.message);
        secrets = [];
      }
      try {
        secVulns = await scanSecurity(repoPath);
      } catch (err) {
        console.warn("⚠️ Security scan failed:", err.message);
        secVulns = [];
      }
      try {
        graph = await generateArchitectureGraph(repoPath);
      } catch (err) {
        console.warn("⚠️ Architecture graph failed:", err.message);
        graph = { nodes: [], edges: [] };
      }

      const allIssues = [
        ...secVulns.map((v) => ({ ...v, severity: v.severity })),
        ...aiAnalysis.bugs.map((b) => ({ ...b, severity: "medium" })),
        ...aiAnalysis.architecture.map((a) => ({ ...a, severity: "low" })),
      ];
      techDebt = calculateTechDebt(allIssues);
    }

    // 5. Compute Health Score
    const healthScore = computeHealthScore(
      aiAnalysis.scores,
      depVulns,
      secVulns,
      techDebt
    );

    // 6. Build final analysis object
    const analysis = {
      ...aiAnalysis,
      healthScore,
      securityVulnerabilities: secVulns,
      dependencyVulnerabilities: depVulns,
      secrets,
      techDebt,
      architectureGraph: graph,
      _sourceCode: code,
      tokensUsed,
      tokensRemaining: user.tokensRemaining,
    };

    // 7. Save report with workspaceId
    const report = await Report.create({
      userId: req.user.id,
      workspaceId: user.workspaceId, // ← NEW
      repoUrl: repoUrl.trim(),
      ...analysis,
    });

    // 8. Clean up cloned repo
    if (repoPath) {
      await fs.rm(repoPath, { recursive: true, force: true });
    }

    return res.json({ success: true, analysis, reportId: report._id });
  } catch (err) {
    console.error("❌ GitHub analysis error:", err.message);
    console.error("📌 Full stack:", err.stack);
    if (repoPath) {
      await fs.rm(repoPath, { recursive: true, force: true }).catch(() => {});
    }
    const status = statusForError(err);
    return res.status(status).json({
      error: status === 500 ? "Analysis failed. Please try again." : err.message,
    });
  }
};

// POST /api/github/generate-tests (unchanged)
export const generateTestCases = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string" || code.trim().length < 10) {
      return res.status(400).json({
        error: "Request body must contain a non-empty 'code' string.",
      });
    }
    console.log(`📥 generateTestCases received ${code.length} chars`);
    const result = await generateTests(code);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ generateTestCases error:", err.message);
    console.error("📌 Full stack:", err.stack);
    return res.status(500).json({ error: "Test generation failed. Please try again." });
  }
};

export const autoFixIssue = async (req, res) => {
  try {
    const { repoUrl, issueId, filePath, lineNumber, description, currentCode, suggestedFix } = req.body;

    if (!repoUrl || !filePath) {
      return res.status(400).json({ error: "repoUrl and filePath are required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    // 1. Check if user has a GitHub token (from OAuth)
    const githubToken = user.githubAccessToken;
    if (!githubToken) {
      return res.status(403).json({
        error: "Please connect your GitHub account to use Auto‑Fix.",
        action: "connect_github",
      });
    }

    // 2. Deduct tokens for the AI fix (estimation)
    const estimatedTokens = 500; // rough estimate for code generation
    const deducted = await user.deductTokens(estimatedTokens);
    if (!deducted) {
      return res.status(402).json({
        error: `Insufficient tokens. You have ${user.tokensRemaining} tokens, need ~${estimatedTokens}.`,
      });
    }

    // 3. Parse repoUrl to get owner and repo name
    const urlParts = repoUrl.replace("https://github.com/", "").split("/");
    if (urlParts.length < 2) {
      return res.status(400).json({ error: "Invalid GitHub URL." });
    }
    const owner = urlParts[0];
    const repo = urlParts[1];

    // 4. Initialize Octokit
    const octokit = new Octokit({ auth: githubToken });

    // 5. Get the current file content and SHA
    let fileContent, sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
      });
      fileContent = Buffer.from(data.content, "base64").toString("utf-8");
      sha = data.sha;
    } catch (err) {
      console.error("Error fetching file:", err);
      return res.status(404).json({ error: "File not found in the repository." });
    }

    // 6. If we have a suggestedFix from the AI (from the report), use it. Otherwise generate one.
    let fixedCode = suggestedFix;
    if (!fixedCode) {
      // Construct a prompt with the issue context
      const prompt = `
        You are an expert code fixer. Given the following code snippet and a bug description,
        generate the corrected version of the code. Only output the fixed code, no explanation.

        Bug description: ${description || "Fix the issue at line " + lineNumber}

        Current code:
        \`\`\`
        ${fileContent}
        \`\`\`

        Output ONLY the fixed code, no extra text.
      `;
      // Use the same Groq utility
      const response = await analyzeWithGroq(prompt);
      fixedCode = response.result || "";
      if (!fixedCode) {
        return res.status(500).json({ error: "AI failed to generate a fix." });
      }
    }

    // 7. Create a new branch name
    const branchName = `auto-fix-${issueId || Date.now()}`;
    const defaultBranch = "main"; // Could fetch from GitHub API

    // 8. Get the latest commit SHA from default branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    const baseSha = refData.object.sha;

    // 9. Create a new branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // 10. Update the file content on the new branch
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `Fix: ${description || "Auto-fix issue"}`,
      content: Buffer.from(fixedCode).toString("base64"),
      sha,
      branch: branchName,
    });

    // 11. Open a Pull Request
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: `Fix: ${description || "Auto-fix issue"}`,
      body: `This PR automatically fixes the issue identified by CodeVerity.\n\n**Issue:** ${description}\n**File:** ${filePath}\n**Line:** ${lineNumber || "N/A"}`,
      head: branchName,
      base: defaultBranch,
    });

    // 12. Audit log
    await addAuditLog(
      user.workspaceId,
      user._id,
      "auto_fix",
      `Created PR #${pr.number} for ${repoUrl}`,
      { repoUrl, prUrl: pr.html_url, branch: branchName }
    );

    // 13. Return success with PR URL
    res.json({
      success: true,
      prUrl: pr.html_url,
      prNumber: pr.number,
      branch: branchName,
      tokensUsed: estimatedTokens,
      tokensRemaining: user.tokensRemaining,
    });

  } catch (err) {
    console.error("Auto‑fix error:", err);
    // If tokens were deducted but the operation fails, we could optionally refund them
    // but for simplicity we'll just log the error.
    res.status(500).json({ error: "Failed to create auto‑fix PR. Please try again later." });
  }
};