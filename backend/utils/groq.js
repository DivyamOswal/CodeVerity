import Groq from "groq-sdk";
import path from "path";

const GITHUB_API = "https://api.github.com";
//  GitHub helpers

function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/);
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  return { owner: match[1], repo: match[2] };
}

async function fetchRepoTree(owner, repo, branch = "main") {
  for (const ref of [branch, "main", "master"]) {
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (res.ok) {
      const data = await res.json();
      return data.tree.filter((f) => f.type === "blob");
    }
  }
  throw new Error(`Could not fetch repo tree for ${owner}/${repo}`);
}

async function fetchFileContent(owner, repo, filePath) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "CodeForge",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();

    console.error(
      `❌ GitHub file fetch failed: ${filePath}`,
      res.status,
      errorText.slice(0, 500),
    );

    return null;
  }

  const data = await res.json();

  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content.replace(/\s/g, ""), "base64").toString(
      "utf-8",
    );
  }

  console.warn(`⚠️ No readable content: ${filePath}`);

  return null;
}

const CODE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".go",
  ".rs",
  ".c",
  ".cpp",
  ".cs",
  ".php",
  ".rb",
  ".swift",
  ".kt",
  ".html",
  ".css",
  ".scss",
  ".json",
  ".yaml",
  ".yml",
  ".md",
]);

function isCodeFile(filePath) {
  const lower = filePath.toLowerCase();
  if (/(node_modules|dist\/|build\/|\.lock$|package-lock\.json)/.test(lower))
    return false;
  return CODE_EXTENSIONS.has(path.extname(lower));
}

export async function fetchRepoContents(
  repoUrl,
  { maxChars = 28_000, branch = "main" } = {},
) {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  console.log(`📦 Fetching tree for ${owner}/${repo}…`);
  const tree = await fetchRepoTree(owner, repo, branch);
  const codeFiles = tree.filter((f) => isCodeFile(f.path));
  console.log(`📂 ${codeFiles.length} code files found`);

  let combined = `# Repository: ${owner}/${repo}\n\n`;
  let successfulFiles = 0;
  let failedFiles = 0;

  for (const file of codeFiles) {
    if (combined.length >= maxChars) break;

    console.log(`📄 Fetching: ${file.path}`);

    const content = await fetchFileContent(owner, repo, file.path);

    if (!content) {
      failedFiles++;
      console.warn(`⚠️ Skipped: ${file.path}`);
      continue;
    }

    successfulFiles++;

    const block = `\n\n## FILE: ${file.path}\n\`\`\`\n${content}\n\`\`\``;

    if (combined.length + block.length > maxChars) {
      combined +=
        block.slice(0, maxChars - combined.length) + "\n… [truncated]";
      break;
    }

    combined += block;
  }

  console.log(`✅ Successfully fetched: ${successfulFiles}`);
  console.log(`❌ Failed to fetch: ${failedFiles}`);
  console.log(`📦 Final source size: ${combined.length} chars`);
  return combined;
}

//  JSON extraction

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
  return JSON.parse(cleaned.slice(start, end + 1));
}

//  SYSTEM PROMPT — Code Audit
//
//  GRADING RUBRIC (explicit — Groq must follow this):
//
//  Grade is computed from the WEIGHTED AVERAGE of four scores:
//    codeQuality    × 30%
//    security       × 30%
//    performance    × 20%
//    maintainability× 20%
//
//  Weighted average → grade:
//    90–100  →  A+
//    85–89   →  A
//    80–84   →  A-
//    75–79   →  B+
//    70–74   →  B
//    65–69   →  B-
//    60–64   →  C+
//    55–59   →  C
//    50–54   →  C-
//    45–49   →  D+
//    40–44   →  D
//    35–39   →  D-
//    0–34    →  F
//
//  Score criteria per dimension:
//
//  codeQuality (0–100):
//    90–100  Clean, idiomatic, DRY, well-named, no obvious smells
//    70–89   Minor issues: some duplication, inconsistent naming, minor smells
//    50–69   Moderate issues: clear duplication, poor error handling, mixed concerns
//    30–49   Significant issues: spaghetti logic, missing abstractions, dead code
//    0–29    Severe: unreadable, no structure, completely ad-hoc
//
//  security (0–100):
//    90–100  No exposed secrets, input validated, auth guarded, dependencies clean
//    70–89   Minor risks: one missing validation, weak token handling
//    50–69   Moderate risks: hardcoded creds in comments, unguarded routes
//    30–49   High risks: SQL injection vectors, exposed API keys, no auth checks
//    0–29    Critical: plaintext passwords, open admin endpoints, RCE vectors
//
//  performance (0–100):
//    90–100  Efficient algorithms, caching, lazy loading, no N+1 queries
//    70–89   Minor issues: one unnecessary loop, missing indexes
//    50–69   Moderate: synchronous blocking in hot paths, no pagination
//    30–49   Serious: O(n²) in critical paths, no connection pooling
//    0–29    Severe: infinite loops possible, memory leaks, unbounded queries
//
//  maintainability (0–100):
//    90–100  Modular, documented, tested, clear separation of concerns
//    70–89   Mostly modular, light docs, some test coverage
//    50–69   Mixed concerns, minimal docs, no tests
//    30–49   Monolithic files, no docs, tightly coupled
//    0–29    No structure, impossible to extend safely

const SYSTEM_PROMPT = `You are a PRINCIPAL SOFTWARE ARCHITECT performing a FORMAL CODE AUDIT.

You MUST respond with ONLY a valid JSON object — no preamble, no explanation, no markdown fences, no trailing text.
Start your response with { and end with }.


SCORING CRITERIA (apply these strictly)


Score each dimension 0–100 based on what you observe in the code:

SCORE BANDS (apply to all four dimensions):
  90–100  Excellent — production-grade, no significant issues
  70–89   Good      — minor issues only, generally solid
  50–69   Fair      — several clear problems affecting quality
  30–49   Poor      — significant issues, needs rework
  0–29    Critical  — severe problems, not production-ready

codeQuality — measures readability, DRY principle, naming, structure, error handling.
  Deduct for: duplication, dead code, inconsistent naming, missing error handling, 
              god functions, deeply nested logic, missing abstractions.

security — measures protection against threats.
  Deduct for: exposed secrets/API keys, hardcoded credentials, missing input validation,
              unguarded routes, SQL/NoSQL injection vectors, missing HTTPS enforcement,
              insecure JWT handling, CORS misconfiguration.

performance — measures runtime efficiency.
  Deduct for: O(n²) loops in hot paths, N+1 query patterns, missing pagination,
              synchronous blocking operations, no caching, unbounded data fetches,
              memory leaks, heavy computation on main thread.

maintainability — measures how easy the code is to change and extend.
  Deduct for: no tests, no documentation, tightly coupled modules, mixed concerns,
              monolithic files, magic numbers, no separation of config from logic.

GRADE FORMULA (you MUST follow this exactly)


Step 1 — compute weighted average:
  weightedAvg = (codeQuality × 0.30) + (security × 0.30) + (performance × 0.20) + (maintainability × 0.20)

Step 2 — map to grade:
  90–100 → "A+"   85–89 → "A"   80–84 → "A-"
  75–79  → "B+"   70–74 → "B"   65–69 → "B-"
  60–64  → "C+"   55–59 → "C"   50–54 → "C-"
  45–49  → "D+"   40–44 → "D"   35–39 → "D-"
  0–34   → "F"

Example: codeQuality=72, security=60, performance=80, maintainability=65
  weightedAvg = (72×0.30)+(60×0.30)+(80×0.20)+(65×0.20) = 21.6+18+16+13 = 68.6 → "B-"


OUTPUT STRUCTURE


{
  "summary": "15–20 sentence professional overview. Cover: what the project does, tech stack detected, overall architecture pattern, top strengths, top weaknesses, and one key recommendation.",
  "architecture": [
    {
      "component": "Frontend | Backend | Database | DevOps | Security | Testing",
      "description": "How this layer is currently implemented",
      "recommendation": "Specific, actionable improvement for this component"
    }
  ],
  "bugs": [
    {
      "title": "Short descriptive title",
      "impact": "Low | Medium | High",
      "location": "File or function where the bug exists",
      "fix": "Exact code change or refactor needed"
    }
  ],
  "securityIssues": [
    {
      "issue": "Security risk name (e.g. Exposed API Key, Missing Rate Limiting)",
      "severity": "Low | Medium | High | Critical",
      "location": "Where in the code this risk exists",
      "recommendation": "Specific mitigation steps"
    }
  ],
  "futureRoadmap": [
    {
      "phase": "Short-term | Mid-term | Long-term",
      "details": "Concrete, specific upgrade plan with technology suggestions"
    }
  ],
  "toolsAndPackages": ["only", "what", "you", "see", "imported", "or", "used"],
  "scores": {
    "codeQuality": 0,
    "security": 0,
    "performance": 0,
    "maintainability": 0
  },
  "grade": "computed from formula above",
  "finalVerdict": "2–3 sentences summarising the most important finding and the single highest-priority action."
}

RULES:
- Analyse ONLY what is present in the actual code provided — do not invent issues
- Apply the scoring criteria strictly — do not be generous without evidence
- Apply the grade formula exactly — do not override it with subjective judgment
- Every score must reflect real observations from the code
- If a section has nothing to report, return an empty array []
- toolsAndPackages must list only what you see imported or used`;

//  SYSTEM PROMPT — Test Case Generator
const TEST_GENERATOR_SYSTEM_PROMPT = `You are an EXPERT SOFTWARE TEST ENGINEER specialising in JavaScript/Node.js.

Your job is to analyse source code and generate comprehensive test suites using Jest (or Vitest if detected).

You MUST respond with ONLY a valid JSON object — no preamble, no explanation, no markdown fences, no trailing text.
Start your response with { and end with }.

The JSON must follow this exact structure:

{
  "framework": "jest | vitest | mocha",
  "setupInstructions": "Short setup note, e.g. npm install --save-dev jest",
  "testFiles": [
    {
      "fileName": "src/utils.test.js",
      "description": "What this test file covers",
      "testCode": "Full runnable test file content as a string (use \\n for newlines)"
    }
  ],
  "unitTests": [
    {
      "functionName": "myFunction",
      "filePath": "src/utils.js",
      "description": "What this function does",
      "cases": [
        {
          "label": "returns correct result for happy path",
          "type": "unit",
          "input": "describe the input",
          "expected": "describe the expected output",
          "codeSnippet": "expect(myFunction('input')).toBe('expected')"
        }
      ]
    }
  ],
  "edgeCases": [
    {
      "functionName": "myFunction",
      "label": "handles null input gracefully",
      "type": "edge",
      "input": "null",
      "expected": "throws TypeError or returns null",
      "codeSnippet": "expect(() => myFunction(null)).toThrow(TypeError)"
    }
  ],
  "integrationTests": [
    {
      "label": "API endpoint returns 200 for valid request",
      "description": "End-to-end test for a route or service interaction",
      "codeSnippet": "const res = await request(app).get('/health'); expect(res.status).toBe(200);"
    }
  ],
  "mocks": [
    {
      "target": "module or function to mock",
      "reason": "Why it needs to be mocked",
      "snippet": "jest.mock('module', () => ({ fn: jest.fn() }))"
    }
  ],
  "coverageSummary": {
    "estimatedCoverage": 85,
    "uncoveredAreas": ["List of areas not easily testable or not covered"],
    "recommendation": "Short actionable advice to reach 90%+ coverage"
  }
}

RULES:
- Analyse ONLY the code provided — do not invent functions that don't exist
- Generate REAL, RUNNABLE test code — not pseudo-code
- testCode in testFiles must be a complete file as a single escaped string
- Cover happy paths, error paths, boundary values, and null/undefined inputs
- If no async functions exist, omit async/await from snippets
- Prefer jest.fn() for mocks unless vitest is detected (then use vi.fn())
- If a section has nothing to report, return an empty array []`;

//  Fallbacks
const FALLBACK_RESULT = {
  summary:
    "Analysis could not be completed — the AI returned an unparseable response. Please retry or check your GROQ_API_KEY and model settings.",
  architecture: [],
  bugs: [],
  securityIssues: [],
  futureRoadmap: [
    {
      phase: "Short-term",
      details: "Retry the analysis with a larger max_tokens value.",
    },
    {
      phase: "Mid-term",
      details:
        "Switch to a more capable model such as llama-3.3-70b-versatile.",
    },
    {
      phase: "Long-term",
      details: "Add automated retries and structured output validation.",
    },
  ],
  toolsAndPackages: [],
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
    recommendation: "Retry the test generation with a larger max_tokens value.",
  },
};

//  Groq call with model fallback chain
const MODELS_TO_TRY = [
  process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
];

async function callGroqWithRetry(groq, systemPrompt, userContent) {
  let lastError;
  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`🤖 Trying model: ${model}`);
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.1,
        max_tokens: 6000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      });
      const raw = completion.choices[0].message.content;
      const parsed = extractJSON(raw);
      console.log(`✅ Parsed successfully with model: ${model}`);
      return parsed;
    } catch (err) {
      console.warn(`⚠️ Model ${model} failed: ${err.message}`);
      lastError = err;
    }
  }
  console.error("❌ All models failed:", lastError?.message);
  return null;
}

//  Public API
export async function analyzeWithGroq(input) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const result = await callGroqWithRetry(
    groq,
    SYSTEM_PROMPT,
    input.slice(0, 20_000),
  );
  return result ?? FALLBACK_RESULT;
}

export async function analyzeRepoFromUrl(repoUrl, options = {}) {
  const contents = await fetchRepoContents(repoUrl, options);
  console.log(`🔍 Sending ${contents.length} chars to Groq…`);
  return analyzeWithGroq(contents);
}

export async function generateTests(input) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log(`🧪 Generating tests for ${input.length} chars…`);
  const result = await callGroqWithRetry(
    groq,
    TEST_GENERATOR_SYSTEM_PROMPT,
    input.slice(0, 18_000),
  );
  return result ?? FALLBACK_TEST_RESULT;
}

export async function generateTestsFromUrl(repoUrl, options = {}) {
  const contents = await fetchRepoContents(repoUrl, options);
  return generateTests(contents);
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
