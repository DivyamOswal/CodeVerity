// backend/controllers/githubController.js
import { analyzeWithGroq, generateTests } from "../utils/groq.js";
import { postFindingsToPR } from "../utils/githubPRComments.js";
import {
  cloneAndParseGithubRepo,
  parseGithubRepo,
  estimateTokens,
} from "../utils/githubParser.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import { Octokit } from "@octokit/rest";
import path from "path";
import {
  scanDependencies,
  scanSecrets,
  scanSecurity,
  calculateTechDebt,
  generateArchitectureGraph,
  computeHealthScore,
} from "../utils/scanners.js";
import { getComplexity } from "../utils/complexity.js";
import { checkCVEs } from "../utils/cve.js";
import { scoreReadme } from "../utils/readmeQuality.js";
import { addAuditLog } from "./workspaceController.js";

import fs from "fs/promises";
import { promisify } from "util";
import { exec } from "child_process";

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;
const AI_TIMEOUT_MS = 90_000;

const execAsync = promisify(exec);

function statusForError(err) {
  const msg = err.message || "";
  if (/rate limit/i.test(msg)) return 429;
  if (/not found|private/i.test(msg)) return 404;
  if (/invalid github url/i.test(msg)) return 400;
  return 500;
}

function sanitizeFilePath(filePath) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("File path is required and must be a string.");
  }
  if (path.isAbsolute(filePath)) {
    throw new Error("Absolute paths are not allowed.");
  }
  const normalized = path.normalize(filePath);
  if (normalized.includes("..")) {
    throw new Error("Path traversal is not allowed.");
  }
  return normalized;
}

/**
 * AI sometimes returns "backend/routes/auth.js:31" as a single string,
 * or "path#L31". Split it into a clean file path and a line number.
 * Handles bare paths too returns { file, line: null } in that case.
 */
function splitFileAndLine(raw) {
  if (!raw || typeof raw !== "string") {
    return { file: raw || null, line: null };
  }
  const trimmed = raw.trim();
  // Matches "path/to/file.ext:123" or "path/to/file.ext#L123" or "...#123"
  const match = trimmed.match(/^(.+?)(?::|#L?)(\d+)$/);
  if (match) {
    return { file: match[1], line: Number(match[2]) };
  }
  return { file: trimmed, line: null };
}

/**
 * Coerce a value to a number or null. Handles strings, empty strings,
 * undefined, and NaN anything that isn't a valid positive integer
 * becomes null.
 */
function toLineNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ─── Timeout wrapper ─────────────────────────────────────────
function withTimeout(promise, ms, label = "operation") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ─── Severity normalization ──────────────────────────────────
function normalizeSeverity(raw) {
  if (!raw) return "medium";
  const s = String(raw).toLowerCase().trim();
  if (["critical", "blocker", "severe"].includes(s)) return "critical";
  if (["high", "error", "major"].includes(s)) return "high";
  if (["medium", "moderate", "warning", "warn"].includes(s)) return "medium";
  if (["low", "minor", "info", "note"].includes(s)) return "low";
  return "medium";
}

function severityRank(sev) {
  return { critical: 0, high: 1, medium: 2, low: 3, info: 4 }[sev] ?? 5;
}

// ─── Field extraction helpers (tolerant of unknown shapes) ──
function pickField(obj, names, fallback = undefined) {
  if (!obj || typeof obj !== "object") return fallback;
  for (const n of names) {
    if (obj[n] !== undefined && obj[n] !== null) return obj[n];
  }
  return fallback;
}

// ─── Normalize any analyzer output into a finding ────────────
function makeFinding({
  severity,
  category,
  source,
  file,
  line,
  endLine,
  title,
  description,
  whyItMatters,
  suggestedFix,
  references,
  raw,
}) {
  const sev = normalizeSeverity(severity);
  const id = `${source}:${file || "?"}:${line || 0}:${(title || description || "").slice(0, 40)}`;
  return {
    id,
    severity: sev,
    category: category || "general",
    source: source || "unknown",
    file: file || null,
    line: typeof line === "number" ? line : null,
    endLine: typeof endLine === "number" ? endLine : null,
    title: title || description?.slice(0, 80) || "Issue",
    description: description || title || "",
    whyItMatters: whyItMatters || null,
    suggestedFix: suggestedFix || null,
    references: Array.isArray(references) ? references : [],
    raw: raw || null,
  };
}

// ─── Map AI bugs / securityIssues into findings ──────────────
function findingsFromAI(aiAnalysis) {
  const out = [];

  for (const b of aiAnalysis.bugs || []) {
    // AI often returns "path/to/file.js:31" as a single string.
    // Split it here so the whole pipeline (report → RepoEditor →
    // Auto-Fix) receives a clean path and a real line number.
    const { file, line } = splitFileAndLine(
      pickField(b, ["file", "path", "filePath"]),
    );
    out.push(
      makeFinding({
        severity: pickField(b, ["severity", "level"], "medium"),
        category: "bug",
        source: "ai",
        file,
        line:
          line ??
          toLineNumber(pickField(b, ["line", "lineNumber", "lineStart"])),
        endLine: toLineNumber(pickField(b, ["endLine", "lineEnd"])),
        title: pickField(b, ["title", "name"]),
        description: pickField(b, [
          "description",
          "message",
          "detail",
          "issue",
        ]),
        whyItMatters: pickField(b, ["whyItMatters", "impact", "reason"]),
        suggestedFix: pickField(b, ["suggestedFix", "fix", "remediation"]),
        references: pickField(b, ["references", "refs"], []),
        raw: b,
      }),
    );
  }

  for (const s of aiAnalysis.securityIssues || []) {
    const { file, line } = splitFileAndLine(
      pickField(s, ["file", "path", "filePath"]),
    );
    out.push(
      makeFinding({
        severity: pickField(s, ["severity", "level"], "high"),
        category: "security",
        source: "ai",
        file,
        line:
          line ??
          toLineNumber(pickField(s, ["line", "lineNumber", "lineStart"])),
        endLine: toLineNumber(pickField(s, ["endLine", "lineEnd"])),
        title: pickField(s, ["title", "name"]),
        description: pickField(s, [
          "description",
          "message",
          "detail",
          "issue",
        ]),
        whyItMatters: pickField(s, ["whyItMatters", "impact", "reason", "cwe"]),
        suggestedFix: pickField(s, ["suggestedFix", "fix", "remediation"]),
        references: pickField(s, ["references", "refs"], []),
        raw: s,
      }),
    );
  }

  return out;
}

// ─── Map scanner outputs into findings ───────────────────────
function findingsFromSecrets(secrets) {
  return (secrets || []).map((s) => {
    const { file, line } = splitFileAndLine(pickField(s, ["file", "path"]));
    return makeFinding({
      severity: pickField(s, ["severity"], "critical"),
      category: "security",
      source: "secret-scan",
      file,
      line:
        line ?? toLineNumber(pickField(s, ["line", "lineNumber"])),
      title: pickField(s, ["type", "rule", "title"], "Secret detected"),
      description:
        pickField(s, ["description", "match", "message"]) ||
        "A hardcoded secret or credential was found in the source.",
      whyItMatters:
        "Hardcoded secrets can be leaked via git history, logs, or a compromised build artifact.",
      suggestedFix:
        "Move the secret to an environment variable and rotate the exposed credential immediately.",
      references: ["https://cwe.mitre.org/data/definitions/798.html"],
      raw: s,
    });
  });
}

function findingsFromSecurity(secVulns) {
  return (secVulns || []).map((v) => {
    const { file, line } = splitFileAndLine(pickField(v, ["file", "path"]));
    return makeFinding({
      severity: pickField(v, ["severity", "level"], "medium"),
      category: "security",
      source: "security-scan",
      file,
      line:
        line ?? toLineNumber(pickField(v, ["line", "lineNumber"])),
      title: pickField(v, ["rule", "title", "name"], "Security issue"),
      description:
        pickField(v, ["message", "description", "detail"]) ||
        "A security issue was detected by static analysis.",
      whyItMatters: pickField(v, ["whyItMatters", "cwe", "owasp"]),
      suggestedFix: pickField(v, ["fix", "suggestedFix", "remediation"]),
      references: pickField(v, ["references", "refs"], []),
      raw: v,
    });
  });
}

function findingsFromDependencies(depVulns) {
  return (depVulns || []).map((d) =>
    makeFinding({
      severity: pickField(d, ["severity"], "high"),
      category: "security",
      source: "npm-audit",
      file: "package.json",
      line: null,
      title: `Vulnerable dependency: ${pickField(d, ["name", "package"], "unknown")}`,
      description:
        pickField(d, ["title", "message", "description"]) ||
        `Dependency ${pickField(d, ["name"], "")} has a known vulnerability.`,
      whyItMatters:
        "Vulnerable dependencies are a common attack vector and are trivially exploitable once public.",
      suggestedFix: `Upgrade ${pickField(d, ["name"], "the dependency")} to a patched version.`,
      references: pickField(d, ["url", "references"], []),
      raw: d,
    }),
  );
}

function findingsFromCVEs(cveList) {
  return (cveList || []).map((c) =>
    makeFinding({
      severity: pickField(c, ["severity"], "high"),
      category: "security",
      source: "cve",
      file: "package.json",
      line: null,
      title: pickField(c, ["id", "cve", "title"], "Known CVE"),
      description: pickField(c, ["summary", "description", "title"]),
      whyItMatters: "This CVE is publicly known and exploitable.",
      suggestedFix: pickField(c, ["fix", "remediation"]),
      references: pickField(c, ["references", "url"], []),
      raw: c,
    }),
  );
}

// ─── Health score summary from findings ──────────────────────
function summarizeFindings(findings) {
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const byCategory = {};
  for (const f of findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
  }
  return { total: findings.length, bySeverity, byCategory };
}

// ─── Analyze GitHub repo ─────────────────────────────────────
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

    // ── 1. Clone + parse ─────────────────────────────────────
    const parsed = await cloneAndParseGithubRepo(repoUrl.trim());
    code = parsed.code;
    repoPath = parsed.repoPath;

    if (!code) {
      throw new Error("No source code extracted from repository.");
    }

    // ── 2. Token gate (before we spend anything) ─────────────
    const estimatedTokens = Math.max(estimateTokens(code) || 0, 1000);
    if (user.tokensRemaining < estimatedTokens) {
      return res.status(429).json({
        error: `Insufficient tokens. You have ${user.tokensRemaining}, estimated need ~${estimatedTokens}.`,
      });
    }

    // ── 3. Static analysis all in parallel ─────────────────
    let depVulns = [];
    let secrets = [];
    let secVulns = [];
    let graph = { nodes: [], edges: [] };
    let complexity = {
      maxComplexity: 0,
      averageComplexity: 0,
      maintainability: 0,
      functions: [],
    };
    let cveList = [];
    let readmeScore = { score: 0, details: {} };

    if (repoPath) {
      const results = await Promise.allSettled([
        scanDependencies(repoPath),
        scanSecrets(repoPath),
        scanSecurity(repoPath),
        generateArchitectureGraph(repoPath),
        getComplexity(repoPath),
        checkCVEs(repoPath),
        Promise.resolve(scoreReadme(repoPath)),
      ]);

      const [
        depRes,
        secretsRes,
        secRes,
        graphRes,
        complexityRes,
        cveRes,
        readmeRes,
      ] = results;

      if (depRes.status === "fulfilled") {
        depVulns = depRes.value || [];
      } else {
        console.warn("⚠️ Dependency scan failed:", depRes.reason?.message);
      }

      if (secretsRes.status === "fulfilled") {
        secrets = secretsRes.value || [];
      } else {
        console.warn("⚠️ Secrets scan failed:", secretsRes.reason?.message);
      }

      if (secRes.status === "fulfilled") {
        secVulns = secRes.value || [];
      } else {
        console.warn("⚠️ Security scan failed:", secRes.reason?.message);
      }

      if (graphRes.status === "fulfilled" && graphRes.value) {
        graph = graphRes.value;
      } else {
        console.warn("⚠️ Architecture graph failed:", graphRes.reason?.message);
      }

      if (complexityRes.status === "fulfilled" && complexityRes.value) {
        complexity = complexityRes.value;
        console.log(
          `✅ Complexity: max=${complexity.maxComplexity}, avg=${complexity.averageComplexity}`,
        );
      } else {
        console.warn(
          "⚠️ Complexity scan failed:",
          complexityRes.reason?.message,
        );
      }

      if (cveRes.status === "fulfilled") {
        cveList = cveRes.value || [];
        console.log(`✅ CVE scan found ${cveList.length}`);
      } else {
        console.warn("⚠️ CVE scan failed:", cveRes.reason?.message);
      }

      if (readmeRes.status === "fulfilled" && readmeRes.value) {
        readmeScore = readmeRes.value;
        console.log(`✅ README score: ${readmeScore.score}%`);
      } else {
        console.warn("⚠️ README score failed:", readmeRes.reason?.message);
      }
    }

    // ── 4. AI review (with timeout) ──────────────────────────
    let ai = {};
    let usage = { total_tokens: 0 };
    let aiError = null;

    try {
      const aiResponse = await withTimeout(
        analyzeWithGroq(code),
        AI_TIMEOUT_MS,
        "AI analysis",
      );
      ai = aiResponse.result || {};
      usage = aiResponse.usage || usage;
    } catch (err) {
      aiError = err.message;
      console.warn("⚠️ AI analysis failed:", err.message);
    }

    const tokensUsed = usage.total_tokens || 0;
    if (tokensUsed > 0) {
      await user.deductTokens(tokensUsed);
    }

    // ── 5. Normalize AI output with legacy fallbacks ─────────
    const aiAnalysis = {
      summary: ai.summary ?? "No summary provided.",
      architecture: Array.isArray(ai.architecture) ? ai.architecture : [],
      bugs: Array.isArray(ai.bugs) ? ai.bugs : [],
      securityIssues: Array.isArray(ai.securityIssues) ? ai.securityIssues : [],
      futureRoadmap: Array.isArray(ai.futureRoadmap) ? ai.futureRoadmap : [],
      toolsAndPackages: Array.isArray(ai.toolsAndPackages)
        ? ai.toolsAndPackages
        : [],
      scores: ai.scores ?? {
        codeQuality: 0,
        security: 0,
        performance: 0,
        maintainability: 0,
      },
      grade: ai.grade ?? "N/A",
      finalVerdict: ai.finalVerdict ?? "",
    };

    // ── 6. Tech debt from combined issues ────────────────────
    const allIssues = [
      ...secVulns.map((v) => ({ ...v, severity: v.severity })),
      ...aiAnalysis.bugs.map((b) => ({ ...b, severity: "medium" })),
      ...aiAnalysis.architecture.map((a) => ({ ...a, severity: "low" })),
    ];
    const techDebt = calculateTechDebt(allIssues);

    // ── 7. Unified findings array ────────────────────────────
    const findings = [
      ...findingsFromAI(aiAnalysis),
      ...findingsFromSecurity(secVulns),
      ...findingsFromSecrets(secrets),
      ...findingsFromDependencies(depVulns),
      ...findingsFromCVEs(cveList),
    ].sort(
      (a, b) =>
        severityRank(a.severity) - severityRank(b.severity) ||
        (a.file || "").localeCompare(b.file || ""),
    );

    const findingsSummary = summarizeFindings(findings);

    // ── 8. Health score ──────────────────────────────────────
    const healthScore = computeHealthScore(
      aiAnalysis.scores,
      depVulns,
      secVulns,
      techDebt,
    );

    // ── 9. Assemble report payload ───────────────────────────
    const analysis = {
      // Legacy top-level (frontend currently reads these)
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
      complexity,
      cveList,
      readmeScore,

      // New unified findings
      findings,
      findingsSummary,

      // New namespaced
      ai: aiAnalysis,
      static: {
        security: secVulns,
        secrets,
        dependencies: depVulns,
        cves: cveList,
        complexity,
        readmeScore,
        architectureGraph: graph,
      },
      metrics: {
        healthScore,
        techDebt,
        complexity,
        readmeScore,
        findings: findingsSummary,
      },
      meta: {
        scannedAt: new Date().toISOString(),
        tokensUsed,
        tokensRemaining: user.tokensRemaining,
        aiError,
      },
    };

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
      error:
        status === 500 ? "Analysis failed. Please try again." : err.message,
    });
  }
};

// ─── Generate tests ─────────────────────────────────────────
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
    return res
      .status(500)
      .json({ error: "Test generation failed. Please try again." });
  }
};

// ─── Strip markdown code fences if the AI wrapped its output ──
function stripCodeFences(text) {
  if (!text || typeof text !== "string") return text;
  const trimmed = text.trim();
  // ```lang\n...\n``` or ```\n...\n```
  const fenceMatch = trimmed.match(/^```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```\s*$/);
  if (fenceMatch) return fenceMatch[1];
  return trimmed;
}

// ─── Auto-Fix (creates PR) ──────────────────────────────────
export const autoFixIssue = async (req, res) => {
  try {
    const {
      repoUrl,
      issueId,
      filePath,
      lineNumber,
      description,
      suggestedFix,
    } = req.body;

    if (!repoUrl || !filePath) {
      return res
        .status(400)
        .json({ error: "repoUrl and filePath are required." });
    }

    // Defensive: strip any ":31" or "#L31" suffix that snuck in from
    // an older report before the splitFileAndLine fix. This is what
    // the whole Auto-Fix 404 was caused by.
    const { file: cleanFilePath, line: embeddedLine } =
      splitFileAndLine(filePath);
    const safePath = sanitizeFilePath(cleanFilePath);
    const parsedLineNumber =
      toLineNumber(lineNumber) ?? embeddedLine ?? null;

    const user = await User.findById(req.user.id).select("+githubAccessToken");
    if (!user) return res.status(401).json({ error: "User not found" });

    const githubToken = user.getGithubToken();
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

    // ── Fetch the actual file from GitHub ────────────────────
    let fileContent, sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: safePath,
      });
      fileContent = Buffer.from(data.content, "base64").toString("utf-8");
      sha = data.sha;
    } catch (err) {
      console.error("Error fetching file:", {
        path: safePath,
        status: err.status,
        message: err.message,
      });
      return res
        .status(404)
        .json({ error: `File not found in the repository: ${safePath}` });
    }

    // ── Always ask the AI to regenerate the full file ────────
    // `suggestedFix` from the report is a short instruction like
    // "Add oauthStartLimiter to the callback routes" it is NOT
    // a rewritten file. Using it verbatim as file content would
    // overwrite the whole file with one sentence. So we always
    // call the AI, passing suggestedFix as context.
    const prompt = `You are an expert code fixer. Given a file and a bug description,
produce a corrected version of the ENTIRE file. Apply the fix surgically —
change only the lines needed to resolve the bug. Do not reformat, rename,
or refactor unrelated code.

Bug description: ${description || "Fix the issue"}${
      parsedLineNumber ? ` (around line ${parsedLineNumber})` : ""
    }${suggestedFix ? `\nSuggested approach: ${suggestedFix}` : ""}

File: ${safePath}

Current contents:
\`\`\`
${fileContent}
\`\`\`

Output ONLY the corrected file content. No explanations, no markdown fences,
no commentary just the new file contents, ready to commit.`;

    const response = await analyzeWithGroq(prompt);
    const rawFixedCode = response.result || "";
    const fixedCode = stripCodeFences(rawFixedCode);

    if (!fixedCode || fixedCode.length < 20) {
      return res
        .status(500)
        .json({ error: "AI failed to generate a valid fix." });
    }

    // Guard against the AI returning something suspiciously short
    // (like just the one-line suggestion text). Real files are much
    // longer than a sentence.
    if (fixedCode.length < fileContent.length * 0.3) {
      console.error("Auto-fix rejected output too short", {
        originalLength: fileContent.length,
        fixedLength: fixedCode.length,
      });
      return res.status(500).json({
        error: "AI fix was too short to be a valid file rewrite. Please try again.",
      });
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
      path: safePath,
      message: `Fix: ${description || "Auto-fix issue"}`,
      content: Buffer.from(fixedCode).toString("base64"),
      sha,
      branch: branchName,
    });

    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: `Fix: ${description || "Auto-fix issue"}`,
      body: `This PR automatically fixes the issue identified by CodeVerity.\n\n**Issue:** ${description || "N/A"}\n**File:** ${safePath}\n**Line:** ${parsedLineNumber ?? "N/A"}`,
      head: branchName,
      base: defaultBranch,
    });

    await addAuditLog(
      user.workspaceId,
      user._id,
      "auto_fix",
      `Created PR #${pr.number} for ${repoUrl}`,
      { repoUrl, prUrl: pr.html_url, branch: branchName },
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
    const status =
      err.message.includes("not allowed") || err.message.includes("required")
        ? 400
        : 500;
    res
      .status(status)
      .json({ error: err.message || "Failed to create auto‑fix PR." });
  }
};

// ─── Get repo file tree ──────────────────────────────────────
export const getRepoContents = async (req, res) => {
  try {
    const { repoUrl, path: rawPath = "" } = req.query;
    const safePath = rawPath ? sanitizeFilePath(rawPath) : "";

    const user = await User.findById(req.user.id).select("+githubAccessToken");
    if (!user) return res.status(401).json({ error: "User not found" });

    const githubToken = user.getGithubToken();
    if (!githubToken) {
      return res
        .status(403)
        .json({ error: "GitHub token required. Please connect your account." });
    }

    const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (!match) throw new Error("Invalid GitHub URL");
    const [owner, repo] = match[1].split("/");

    const octokit = new Octokit({ auth: githubToken });
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: safePath,
    });

    // GitHub returns an array for directories, a single object for files.
    // Normalize to array so the frontend can always iterate.
    const items = Array.isArray(data) ? data : [data];
    const files = items.map((item) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      sha: item.sha,
      download_url: item.download_url,
    }));

    res.json({ success: true, files });
  } catch (err) {
    console.error("Get repo contents error:", err);
    const status =
      err.message.includes("not allowed") || err.message.includes("required")
        ? 400
        : 500;
    res.status(status).json({ error: err.message });
  }
};

// ─── Get file content ────────────────────────────────────────
export const getFileContent = async (req, res) => {
  try {
    const { repoUrl, filePath } = req.query;
    const safePath = sanitizeFilePath(filePath);

    const user = await User.findById(req.user.id).select("+githubAccessToken");
    if (!user) return res.status(401).json({ error: "User not found" });

    const githubToken = user.getGithubToken();
    if (!githubToken) {
      return res.status(403).json({ error: "GitHub token required." });
    }

    const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (!match) throw new Error("Invalid GitHub URL");
    const [owner, repo] = match[1].split("/");

    const octokit = new Octokit({ auth: githubToken });
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: safePath,
    });

    const content = Buffer.from(data.content, "base64").toString("utf-8");
    res.json({ success: true, content, sha: data.sha });
  } catch (err) {
    console.error("Get file content error:", err);
    const status =
      err.message.includes("not allowed") || err.message.includes("required")
        ? 400
        : 500;
    res.status(status).json({ error: err.message });
  }
};

// ─── Comment on PR (posts findings as GitHub review comments) ──
export const commentOnPR = async (req, res) => {
  try {
    const { repoUrl, prNumber, reportId } = req.body;

    if (!repoUrl || !prNumber || !reportId) {
      return res.status(400).json({
        error: "repoUrl, prNumber, and reportId are required.",
      });
    }

    const user = await User.findById(req.user.id).select("+githubAccessToken");
    if (!user) return res.status(401).json({ error: "User not found" });

    const githubToken = user.getGithubToken();
    if (!githubToken) {
      return res.status(403).json({
        error: "Please connect your GitHub account to post PR comments.",
        action: "connect_github",
      });
    }

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ error: "Report not found" });
    if (report.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "You don't have access to this report." });
    }

    const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (!match) return res.status(400).json({ error: "Invalid GitHub URL" });
    const [owner, repo] = match[1].replace(/\.git$/, "").split("/");

    const octokit = new Octokit({ auth: githubToken });

    // Prefer the unified findings array; fall back to legacy arrays.
    const rawFindings =
      Array.isArray(report.findings) && report.findings.length > 0
        ? report.findings
        : [
            ...(report.bugs || []).map((b) => ({
              title: b.title,
              description: b.description,
              severity: b.severity || b.impact || "medium",
              category: "bug",
              file: b.file,
              line: b.line,
              suggestedFix: b.suggestedFix || b.fix,
            })),
            ...(report.securityIssues || []).map((s) => ({
              title: s.issue || s.title,
              description: s.description,
              severity: s.severity || "high",
              category: "security",
              file: s.file,
              line: s.line,
              suggestedFix: s.recommendation,
            })),
          ];

    // Normalize file paths (strip any ":31" suffix from old reports).
    const findings = rawFindings.map((f) => {
      const { file, line } = splitFileAndLine(f.file);
      return {
        ...f,
        file,
        line: line ?? toLineNumber(f.line) ?? null,
      };
    });

    const reportUrl = `${process.env.FRONTEND_URL}/report/${reportId}`;

    const result = await postFindingsToPR({
      octokit,
      owner,
      repo,
      pullNumber: Number(prNumber),
      findings,
      reportUrl,
    });

    if (result.inlineCount === 0 && result.summaryCount === 0) {
      return res.status(400).json({
        error: "No critical or high severity findings to post.",
      });
    }

    await addAuditLog(
      user.workspaceId,
      user._id,
      "pr_comment",
      `Posted ${result.inlineCount} inline + ${result.summaryCount} summary findings to ${owner}/${repo}#${prNumber}`,
      { repoUrl, prNumber, reportId },
    );

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("commentOnPR error:", err);
    const status = err.status || 500;
    const message =
      status === 403
        ? "You don't have permission to comment on this PR."
        : status === 404
          ? "PR or repository not found. Check the PR number."
          : status === 422
            ? "GitHub rejected the comment position. This shouldn't happen — try again."
            : err.message || "Failed to post comments.";
    res.status(status).json({ error: message });
  }
};