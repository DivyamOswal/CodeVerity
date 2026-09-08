// backend/controllers/githubController.js
import { analyzeWithGroq, generateTests } from "../utils/groq.js";
import { cloneAndParseGithubRepo, parseGithubRepo, estimateTokens } from "../utils/githubParser.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import { Octokit } from "@octokit/rest";
import {
  scanDependencies,
  scanSecrets,
  scanSecurity,
  calculateTechDebt,
  generateArchitectureGraph,
  computeHealthScore,
} from "../utils/scanners.js";
// ─── NEW IMPORTS ──────────────────────────────────────────────
import { getComplexity } from "../utils/complexity.js";
import { checkCVEs } from "../utils/cve.js";
import { scoreReadme } from "../utils/readmeQuality.js";
import { addAuditLog } from "./workspaceController.js"; // for Auto‑Fix
// ──────────────────────────────────────────────────────────────

import fs from "fs/promises";

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

const execAsync = promisify(exec);

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
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

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

    const deducted = await user.deductTokens(tokensUsed);
    if (!deducted) {
      return res.status(429).json({
        error: `Insufficient tokens. You have ${user.tokensRemaining} tokens remaining.`,
      });
    }

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

    // 4. Run local scanners (existing)
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

    const healthScore = computeHealthScore(
      aiAnalysis.scores,
      depVulns,
      secVulns,
      techDebt
    );

    // ─── NEW: Run enhanced scanners ──────────────────────────
    let complexity = { maxComplexity: 0, averageComplexity: 0, maintainability: 0, functions: [] };
    let cveList = [];
    let readmeScore = { score: 0, details: {} };

    if (repoPath) {
      try {
        complexity = await getComplexity(repoPath);
        console.log(`✅ Complexity scan: max=${complexity.maxComplexity}, avg=${complexity.averageComplexity}`);
      } catch (err) {
        console.warn("⚠️ Complexity scan failed:", err.message);
      }
      try {
        cveList = await checkCVEs(repoPath);
        console.log(`✅ CVE scan found ${cveList.length} vulnerabilities`);
      } catch (err) {
        console.warn("⚠️ CVE scan failed:", err.message);
      }
      try {
        readmeScore = scoreReadme(repoPath);
        console.log(`✅ README score: ${readmeScore.score}%`);
      } catch (err) {
        console.warn("⚠️ README score failed:", err.message);
      }
    }

    // 6. Build final analysis object (merged with new fields)
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
      // ─── NEW FIELDS ──────────────────────────────────────────
      complexity,
      cveList,
      readmeScore,
    };

    // 7. Save report with workspaceId
    const report = await Report.create({
      userId: req.user.id,
      workspaceId: user.workspaceId,
      repoUrl: repoUrl.trim(),
      ...analysis,
    });

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

// POST /api/github/generate-tests
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

// POST /api/github/auto-fix (unchanged, but now uses addAuditLog)
export const autoFixIssue = async (req, res) => {
  try {
    const { repoUrl, issueId, filePath, lineNumber, description, currentCode, suggestedFix } = req.body;

    if (!repoUrl || !filePath) {
      return res.status(400).json({ error: "repoUrl and filePath are required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const githubToken = user.githubAccessToken;
    if (!githubToken) {
      return res.status(403).json({
        error: "Please connect your GitHub account to use Auto‑Fix.",
        action: "connect_github",
      });
    }

    const estimatedTokens = 500;
    const deducted = await user.deductTokens(estimatedTokens);
    if (!deducted) {
      return res.status(402).json({
        error: `Insufficient tokens. You have ${user.tokensRemaining} tokens, need ~${estimatedTokens}.`,
      });
    }

    const urlParts = repoUrl.replace("https://github.com/", "").split("/");
    if (urlParts.length < 2) {
      return res.status(400).json({ error: "Invalid GitHub URL." });
    }
    const owner = urlParts[0];
    const repo = urlParts[1];

    const octokit = new Octokit({ auth: githubToken });

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

    let fixedCode = suggestedFix;
    if (!fixedCode) {
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
      const response = await analyzeWithGroq(prompt);
      fixedCode = response.result || "";
      if (!fixedCode) {
        return res.status(500).json({ error: "AI failed to generate a fix." });
      }
    }

    const branchName = `auto-fix-${issueId || Date.now()}`;
    const defaultBranch = "main";

    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    const baseSha = refData.object.sha;

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `Fix: ${description || "Auto-fix issue"}`,
      content: Buffer.from(fixedCode).toString("base64"),
      sha,
      branch: branchName,
    });

    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: `Fix: ${description || "Auto-fix issue"}`,
      body: `This PR automatically fixes the issue identified by CodeVerity.\n\n**Issue:** ${description}\n**File:** ${filePath}\n**Line:** ${lineNumber || "N/A"}`,
      head: branchName,
      base: defaultBranch,
    });

    await addAuditLog(
      user.workspaceId,
      user._id,
      "auto_fix",
      `Created PR #${pr.number} for ${repoUrl}`,
      { repoUrl, prUrl: pr.html_url, branch: branchName }
    );

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
    res.status(500).json({ error: "Failed to create auto‑fix PR. Please try again later." });
  }
};

// ─── Get repo file tree ──────────────────────────────────────
export const getRepoContents = async (req, res) => {
  try {
    const { repoUrl, path = '' } = req.query;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const githubToken = user.githubAccessToken;
    if (!githubToken) {
      return res.status(403).json({ error: "GitHub token required. Please connect your account." });
    }

    // Parse owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    const [owner, repo] = match[1].split('/');

    const octokit = new Octokit({ auth: githubToken });
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: path || '',
    });

    const files = data.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      sha: item.sha,
      download_url: item.download_url,
    }));

    res.json({ success: true, files });
  } catch (err) {
    console.error('Get repo contents error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get file content ────────────────────────────────────────
export const getFileContent = async (req, res) => {
  try {
    const { repoUrl, filePath } = req.query;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const githubToken = user.githubAccessToken;
    if (!githubToken) {
      return res.status(403).json({ error: "GitHub token required." });
    }

    const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    const [owner, repo] = match[1].split('/');

    const octokit = new Octokit({ auth: githubToken });
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
    });

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    res.json({ success: true, content, sha: data.sha });
  } catch (err) {
    console.error('Get file content error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─── AI Fix ──────────────────────────────────────────────────
export const applyAIFix = async (req, res) => {
  try {
    const { repoUrl, filePath, code, error, line } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    // 1. Use AI to generate a fix
    const fixPrompt = `
      The following code has an error:
      
      File: ${filePath}
      Error: ${error} at line ~${line}
      
      Code:
      ${code}
      
      Please provide the fixed code only (no explanation).
    `;

    const aiResponse = await analyzeCode(fixPrompt);
    const fixedCode = aiResponse.fixedCode || aiResponse.response || code;

    // 2. Get the current file SHA
    const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
    const repoPath = match[1];

    const url = `https://api.github.com/repos/${repoPath}/contents/${filePath}`;
    const fileInfo = await axios.get(url, {
      headers: { Authorization: `token ${token}` },
    });

    // 3. Commit the fix to GitHub
    const commitRes = await axios.put(url, {
      message: `AI fix: ${error.substring(0, 50)}`,
      content: Buffer.from(fixedCode).toString('base64'),
      sha: fileInfo.data.sha,
      branch: 'main',
    }, {
      headers: { Authorization: `token ${token}` },
    });

    res.json({
      success: true,
      fixedCode,
      commit: commitRes.data,
      message: 'Fix applied successfully',
    });
  } catch (err) {
    console.error('Apply AI fix error:', err);
    res.status(500).json({ error: err.message });
  }
};