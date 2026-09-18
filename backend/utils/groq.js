// backend/utils/groq.js
import Groq from "groq-sdk";

// ── JSON extraction with repair ──────────────────────────────

function repairJSON(jsonStr) {
  let repaired = jsonStr.replace(/,(\s*[}\]])/g, "$1");
  repaired = repaired.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
  return repaired;
}

function extractJSON(raw) {
  let cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in AI response");
  }
  let jsonStr = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (parseErr) {
    const repaired = repairJSON(jsonStr);
    try {
      return JSON.parse(repaired);
    } catch (reparseErr) {
      console.error("❌ Raw JSON (first 500 chars):", jsonStr.slice(0, 500));
      console.error("❌ Repaired JSON (first 500):", repaired.slice(0, 500));
      throw new Error(
        `Malformed JSON: ${reparseErr.message}. Please retry or check GROQ output.`
      );
    }
  }
}

// ── Normalization helpers ────────────────────────────────────

function normalizeSeverity(s) {
  if (!s) return "medium";
  const v = String(s).toLowerCase().trim();
  if (v === "critical" || v === "blocker" || v === "severe") return "critical";
  if (v === "high" || v === "error" || v === "major") return "high";
  if (v === "medium" || v === "moderate" || v === "warning" || v === "warn")
    return "medium";
  if (v === "low" || v === "minor") return "low";
  if (v === "info" || v === "note" || v === "suggestion") return "info";
  return "medium";
}

function gradeFromScore(score) {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  if (score >= 50) return "C-";
  if (score >= 45) return "D+";
  if (score >= 40) return "D";
  if (score >= 35) return "D-";
  return "F";
}

function locationString(file, line) {
  if (!file) return "unknown";
  return line ? `${file}:${line}` : file;
}

// ── Normalize AI response so downstream never sees a broken shape ──
function normalizeAIAnalysis(raw) {
  const out = { ...(raw || {}) };

  // Arrays
  const arrayKeys = [
    "architecture",
    "bugs",
    "securityIssues",
    "futureRoadmap",
    "toolsAndPackages",
    "findings",
    "strengths",
    "risks",
    "actionPlan",
  ];
  for (const k of arrayKeys) {
    if (!Array.isArray(out[k])) out[k] = [];
  }

  // Scores
  if (!out.scores || typeof out.scores !== "object") {
    out.scores = {
      codeQuality: 0,
      security: 0,
      performance: 0,
      maintainability: 0,
    };
  }
  for (const dim of [
    "codeQuality",
    "security",
    "performance",
    "maintainability",
  ]) {
    const v = Number(out.scores[dim]);
    out.scores[dim] = Number.isFinite(v)
      ? Math.max(0, Math.min(100, Math.round(v)))
      : 0;
  }

  // Normalize findings
  out.findings = out.findings
    .filter((f) => f && typeof f === "object")
    .map((f) => ({
      severity: normalizeSeverity(f.severity),
      category: f.category || "general",
      file: typeof f.file === "string" ? f.file : null,
      line: typeof f.line === "number" && f.line > 0 ? f.line : null,
      title:
        f.title ||
        (f.description ? String(f.description).slice(0, 80) : "Issue"),
      description: f.description || f.title || "",
      whyItMatters: f.whyItMatters || null,
      suggestedFix: f.suggestedFix || null,
      references: Array.isArray(f.references) ? f.references : [],
    }));

  // Synthesize legacy arrays from findings if AI skipped them
  if (out.findings.length && out.bugs.length === 0) {
    out.bugs = out.findings
      .filter((f) => f.category === "bug")
      .map((f) => ({
        title: f.title,
        impact:
          f.severity === "critical" || f.severity === "high"
            ? "High"
            : f.severity === "medium"
            ? "Medium"
            : "Low",
        location: locationString(f.file, f.line),
        fix: f.suggestedFix || "",
      }));
  }

  if (out.findings.length && out.securityIssues.length === 0) {
    out.securityIssues = out.findings
      .filter((f) => f.category === "security")
      .map((f) => ({
        issue: f.title,
        severity: f.severity.charAt(0).toUpperCase() + f.severity.slice(1),
        location: locationString(f.file, f.line),
        recommendation: f.suggestedFix || "",
      }));
  }

  // Summary fallback
  if (!out.summary || typeof out.summary !== "string") {
    out.summary =
      "The AI did not produce an executive summary for this repository.";
  }

  // Compute grade if missing or invalid
  if (!out.grade || out.grade === "N/A") {
    const weighted =
      out.scores.codeQuality * 0.3 +
      out.scores.security * 0.3 +
      out.scores.performance * 0.2 +
      out.scores.maintainability * 0.2;
    out.grade = gradeFromScore(weighted);
  }

  // Verdict fallback
  if (!out.finalVerdict || typeof out.finalVerdict !== "string") {
    out.finalVerdict = `Overall grade ${out.grade}. See findings for details.`;
  }

  // Top priority fallback
  if (!out.topPriority || typeof out.topPriority !== "string") {
    const top = out.findings.find(
      (f) => f.severity === "critical" || f.severity === "high",
    );
    out.topPriority = top
      ? top.title
      : "No critical or high-severity findings.";
  }

  return out;
}

// ── Build the user prompt with static analysis context ───────

function buildUserPrompt({ code, staticFindings, fileTree, repoUrl }) {
  const parts = [];

  if (repoUrl) {
    parts.push(`# Repository\n${repoUrl}\n`);
  }

  if (fileTree && typeof fileTree === "string") {
    parts.push(`# File tree (paths only)\n${fileTree.slice(0, 1500)}\n`);
  }

  if (staticFindings && typeof staticFindings === "object") {
    const hasAny =
      (staticFindings.security?.length || 0) +
        (staticFindings.secrets?.length || 0) +
        (staticFindings.dependencies?.length || 0) +
        (staticFindings.cves?.length || 0) +
        (staticFindings.complexity?.functions?.length || 0) >
      0;

    if (hasAny) {
      parts.push(
        "# Pre-computed static analysis\n" +
          "The following issues were already detected by deterministic tools. " +
          "DO NOT repeat them verbatim — instead, include them in your `findings[]` " +
          "with proper context, severity, and a suggested fix, and focus your " +
          "own analysis on issues the tools cannot see (logic bugs, design flaws, " +
          "missing tests, architectural concerns).\n",
      );

      if (staticFindings.secrets?.length) {
        parts.push(
          `\n## Secret scan: ${staticFindings.secrets.length} potential secrets`,
        );
        parts.push(
          JSON.stringify(staticFindings.secrets.slice(0, 10), null, 2),
        );
      }

      if (staticFindings.security?.length) {
        parts.push(
          `\n## Security static analysis: ${staticFindings.security.length} issues`,
        );
        parts.push(
          JSON.stringify(staticFindings.security.slice(0, 20), null, 2),
        );
      }

      if (staticFindings.dependencies?.length) {
        parts.push(
          `\n## Vulnerable dependencies: ${staticFindings.dependencies.length}`,
        );
        parts.push(
          JSON.stringify(staticFindings.dependencies.slice(0, 15), null, 2),
        );
      }

      if (staticFindings.cves?.length) {
        parts.push(`\n## CVEs: ${staticFindings.cves.length}`);
        parts.push(JSON.stringify(staticFindings.cves.slice(0, 10), null, 2));
      }

      const hotspots =
        staticFindings.complexity?.functions?.filter(
          (f) => (f.complexity || f.cyclomatic || 0) > 8,
        ) || [];
      if (hotspots.length) {
        parts.push(
          `\n## High-complexity functions (>8 cyclomatic): ${hotspots.length}`,
        );
        parts.push(JSON.stringify(hotspots.slice(0, 15), null, 2));
      }

      parts.push("\n");
    }
  }

  parts.push("# Source code\n");
  parts.push(
    "The code below is concatenated from multiple files. Look for file markers " +
      "like `// File: path/to/file.js`, `=== path/to/file.js ===`, or similar " +
      "delimiters. Use these to attribute findings to the correct file. If no " +
      "markers exist, do your best to infer the file from context.\n",
  );
  parts.push(code);

  return parts.join("\n");
}

// ── System prompt — the review ───────────────────────────────

const SYSTEM_PROMPT = `You are a PRINCIPAL SOFTWARE ENGINEER performing a formal code audit, comparable to a senior reviewer at Stripe, Google, or Cloudflare.

You MUST respond with ONLY a valid JSON object — no preamble, no explanation, no markdown fences, no trailing text. Start your response with { and end with }.

═══════════════════════════════════════════════════════════
SCORING (0-100, apply strictly based on evidence)
═══════════════════════════════════════════════════════════
90-100  Production-grade. No significant issues.
70-89   Solid. Minor issues only.
50-69   Fair. Several clear problems.
30-49   Poor. Significant issues, needs rework.
0-29    Critical. Not production-ready.

Dimensions:
- codeQuality: readability, DRY, naming, error handling, structure
- security: exposed secrets, missing validation, injection, authz, CORS
- performance: algorithmic complexity, N+1, blocking I/O, missing caching
- maintainability: tests, docs, coupling, file size, magic numbers

GRADE FORMULA:
  weightedAvg = codeQuality*0.30 + security*0.30 + performance*0.20 + maintainability*0.20
  90-100 A+ / 85-89 A / 80-84 A- / 75-79 B+ / 70-74 B / 65-69 B- /
  60-64 C+ / 55-59 C / 50-54 C- / 45-49 D+ / 40-44 D / 35-39 D- / 0-34 F

═══════════════════════════════════════════════════════════
FINDINGS — the core of the review
═══════════════════════════════════════════════════════════
Every issue goes into "findings[]". Each finding MUST include:

- severity: "critical" | "high" | "medium" | "low" | "info"
- category: "security" | "bug" | "performance" | "maintainability" | "style" | "test" | "docs" | "architecture"
- file: exact relative path from the repo root (use the file markers in the input) — REQUIRED
- line: line number within that file (integer), or null if unknown
- title: one-line summary
- description: what the issue is and where, in 1-3 sentences
- whyItMatters: concrete impact — what breaks, what's exploitable, what it costs
- suggestedFix: code or a precise description of the fix. Include real code where possible.
- references: array of URLs (CWE, OWASP, docs). Empty array if none.

SEVERITY GUIDE:
  critical — RCE, auth bypass, secrets in production, data loss
  high     — SQLi, XSS, missing auth on sensitive route, N+1 in hot path
  medium   — missing validation, magic numbers, poor error handling, missing tests on critical path
  low      — style, naming, dead code, minor duplication
  info     — suggestion, future improvement

Aim for 5-25 findings on a real codebase. Do not pad. Do not invent.

═══════════════════════════════════════════════════════════
OUTPUT SCHEMA (exact)
═══════════════════════════════════════════════════════════
{
  "summary": "6-10 sentence executive overview. Start with the verdict, then strongest points, then biggest risks. Be specific — mention actual files or functions.",
  "strengths": ["concrete strength 1", "concrete strength 2"],
  "risks": ["top risk 1", "top risk 2"],
  "topPriority": "The single most important thing to fix this week, in one sentence.",

  "findings": [
    {
      "severity": "high",
      "category": "security",
      "file": "src/auth.js",
      "line": 47,
      "title": "JWT secret hardcoded in source",
      "description": "The JWT signing secret is a string literal in auth.js:47 rather than an environment variable.",
      "whyItMatters": "Anyone with repo read access can forge valid JWTs for any user.",
      "suggestedFix": "Move to process.env.JWT_SECRET and rotate the current secret immediately.",
      "references": ["https://cwe.mitre.org/data/definitions/798.html"]
    }
  ],

  "architecture": [
    { "component": "Auth layer", "description": "…", "recommendation": "…" }
  ],

  "bugs": [
    { "title": "…", "impact": "Low|Medium|High", "location": "file:line", "fix": "…" }
  ],

  "securityIssues": [
    { "issue": "…", "severity": "Low|Medium|High|Critical", "location": "file:line", "recommendation": "…" }
  ],

  "futureRoadmap": [
    { "phase": "Short-term|Mid-term|Long-term", "details": "…" }
  ],

  "toolsAndPackages": ["package-name"],

  "actionPlan": [
    "1. <concrete action with file reference>",
    "2. <concrete action>",
    "3. <concrete action>",
    "4. <concrete action>",
    "5. <concrete action>"
  ],

  "scores": { "codeQuality": 0, "security": 0, "performance": 0, "maintainability": 0 },
  "grade": "A",
  "finalVerdict": "One-paragraph verdict that a hiring manager could read."
}

═══════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════
- Populate BOTH "findings[]" (structured, preferred) AND "bugs[]" / "securityIssues[]" (legacy shape). Same issues, different shapes.
- Every finding MUST have a file path. If you cannot identify a file, omit the finding.
- Never invent line numbers. If unknown, use null.
- If a section has nothing to report, use [].
- Do not include markdown. Do not include any text outside the JSON.
- Be harsh but fair. A senior reviewer at a top company flags real issues — they don't praise mediocrity.`;

// ── System prompt — test generator ──────────────────────────

const TEST_GENERATOR_SYSTEM_PROMPT = `You are an EXPERT SOFTWARE TEST ENGINEER specialising in JavaScript/Node.js.

Analyse source code and generate a test suite using Jest (or Vitest if detected).

You MUST respond with ONLY a valid JSON object — no preamble, no explanation, no markdown fences, no trailing text. Start your response with { and end with }.

{
  "framework": "jest | vitest | mocha",
  "setupInstructions": "...",
  "testFiles": [{"fileName": "...", "description": "...", "testCode": "..."}],
  "unitTests": [{"functionName": "...", "filePath": "...", "description": "...", "cases": [{"label": "...", "type": "unit", "input": "...", "expected": "...", "codeSnippet": "..."}]}],
  "edgeCases": [{"functionName": "...", "label": "...", "type": "edge", "input": "...", "expected": "...", "codeSnippet": "..."}],
  "integrationTests": [{"label": "...", "description": "...", "codeSnippet": "..."}],
  "mocks": [{"target": "...", "reason": "...", "snippet": "..."}],
  "coverageSummary": {"estimatedCoverage": 85, "uncoveredAreas": ["..."], "recommendation": "..."}
}

RULES:
- Analyse ONLY the code provided — do not invent functions that don't exist
- Generate REAL, RUNNABLE test code — not pseudo-code
- Cover happy paths, error paths, boundary values, and null/undefined inputs
- If no async functions exist, omit async/await
- Prefer jest.fn() for mocks unless vitest is detected (then use vi.fn())
- If a section has nothing to report, return an empty array []`;

// ── Fallbacks ────────────────────────────────────────────────

const FALLBACK_RESULT = {
  summary:
    "Analysis could not be completed — the AI returned an unparseable response. Please retry or check your GROQ_API_KEY and model settings.",
  strengths: [],
  risks: [],
  topPriority: "Retry the analysis.",
  findings: [],
  architecture: [],
  bugs: [],
  securityIssues: [],
  futureRoadmap: [
    { phase: "Short-term", details: "Retry the analysis." },
    {
      phase: "Mid-term",
      details: "Switch to a more capable model such as llama-3.3-70b-versatile.",
    },
    {
      phase: "Long-term",
      details: "Add automated retries and structured output validation.",
    },
  ],
  toolsAndPackages: [],
  actionPlan: [],
  scores: { codeQuality: 0, security: 0, performance: 0, maintainability: 0 },
  grade: "N/A",
  finalVerdict: "Analysis failed. No code was evaluated.",
};

const FALLBACK_TEST_RESULT = {
  framework: "jest",
  setupInstructions:
    "Test generation failed. Please retry or check your GROQ_API_KEY.",
  testFiles: [],
  unitTests: [],
  edgeCases: [],
  integrationTests: [],
  mocks: [],
  coverageSummary: {
    estimatedCoverage: 0,
    uncoveredAreas: ["All areas — generation failed"],
    recommendation: "Retry the test generation.",
  },
};

const MODELS_TO_TRY = [
  process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
];

// ── Core: call Groq with model fallback ─────────────────────

async function callGroqWithRetry(
  groq,
  systemPrompt,
  userContent,
  maxTokens = 6000,
) {
  let lastError;
  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`🤖 Trying model: ${model}`);
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.1,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      });
      const raw = completion.choices[0].message.content;
      const parsed = extractJSON(raw);
      console.log(`✅ Parsed successfully with model: ${model}`);

      const usage = completion.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      return { result: parsed, usage };
    } catch (err) {
      console.warn(`⚠️ Model ${model} failed: ${err.message}`);
      lastError = err;
    }
  }
  console.error("❌ All models failed:", lastError?.message);
  return null;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Analyze a repository with the LLM.
 *
 * Accepts either:
 *   analyzeWithGroq(codeString)                          — legacy
 *   analyzeWithGroq({ code, staticFindings, fileTree, repoUrl })  — richer
 */
export async function analyzeWithGroq(input) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  let code = "";
  let staticFindings = null;
  let fileTree = null;
  let repoUrl = null;

  if (typeof input === "string") {
    code = input;
  } else if (input && typeof input === "object") {
    code = input.code || "";
    staticFindings = input.staticFindings || null;
    fileTree = input.fileTree || null;
    repoUrl = input.repoUrl || null;
  }

  if (!code) {
    return {
      result: FALLBACK_RESULT,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  const maxCodeChars = Number(process.env.GROQ_MAX_CODE_CHARS) || 14000;
  const userContent = buildUserPrompt({
    code: code.slice(0, maxCodeChars),
    staticFindings,
    fileTree,
    repoUrl,
  });

  const response = await callGroqWithRetry(
    groq,
    SYSTEM_PROMPT,
    userContent,
    6000,
  );

  if (!response) {
    return {
      result: FALLBACK_RESULT,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  return {
    result: normalizeAIAnalysis(response.result),
    usage: response.usage,
  };
}

export async function generateTests(input) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log(`🧪 Generating tests for ${input.length} chars…`);
  const response = await callGroqWithRetry(
    groq,
    TEST_GENERATOR_SYSTEM_PROMPT,
    input.slice(0, 6000),
    5000,
  );
  if (!response) {
    return {
      result: FALLBACK_TEST_RESULT,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }
  return response;
}

export async function writeTestFiles(testResult, { outDir = "", write } = {}) {
  const fs = await import("fs");
  const fsPath = await import("path");
  const writeFn =
    write ??
    ((filePath, content) => {
      fs.mkdirSync(fsPath.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, "utf-8");
      console.log(`✅ Written: ${filePath}`);
    });
  if (!testResult?.testFiles?.length) {
    console.warn("⚠️ No test files.");
    return;
  }
  for (const { fileName, testCode } of testResult.testFiles) {
    writeFn(outDir ? fsPath.join(outDir, fileName) : fileName, testCode);
  }
}