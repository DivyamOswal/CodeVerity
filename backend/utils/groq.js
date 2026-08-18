import Groq from "groq-sdk";

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
//  GRADING RUBRIC:
//  weightedAvg = codeQuality×0.30 + security×0.30 + performance×0.20 + maintainability×0.20
//  90-100 A+ | 85-89 A | 80-84 A- | 75-79 B+ | 70-74 B | 65-69 B- | 60-64 C+
//  55-59 C | 50-54 C- | 45-49 D+ | 40-44 D | 35-39 D- | 0-34 F

const SYSTEM_PROMPT = `You are a PRINCIPAL SOFTWARE ARCHITECT performing a FORMAL CODE AUDIT.

You MUST respond with ONLY a valid JSON object — no preamble, no explanation, no markdown fences, no trailing text.
Start your response with { and end with }.

SCORE BANDS (apply to all four dimensions):
  90-100  Excellent — production-grade, no significant issues
  70-89   Good      — minor issues only, generally solid
  50-69   Fair      — several clear problems affecting quality
  30-49   Poor      — significant issues, needs rework
  0-29    Critical  — severe problems, not production-ready

codeQuality — readability, DRY, naming, structure, error handling.
security — exposed secrets, missing validation, unguarded routes, injection vectors, CORS misconfig.
performance — O(n²) hot paths, N+1 queries, missing pagination, blocking ops, no caching.
maintainability — tests, docs, coupling, mixed concerns, monolithic files, magic numbers.

GRADE FORMULA (follow exactly):
  weightedAvg = (codeQuality×0.30) + (security×0.30) + (performance×0.20) + (maintainability×0.20)
  90-100→"A+" 85-89→"A" 80-84→"A-" 75-79→"B+" 70-74→"B" 65-69→"B-"
  60-64→"C+" 55-59→"C" 50-54→"C-" 45-49→"D+" 40-44→"D" 35-39→"D-" 0-34→"F"

OUTPUT STRUCTURE:
{
  "summary": "6-8 sentence overview: what the project does, tech stack, architecture pattern, top strengths/weaknesses, one key recommendation.",
  "architecture": [{"component": "Frontend|Backend|Database|DevOps|Security|Testing", "description": "...", "recommendation": "..."}],
  "bugs": [{"title": "...", "impact": "Low|Medium|High", "location": "...", "fix": "..."}],
  "securityIssues": [{"issue": "...", "severity": "Low|Medium|High|Critical", "location": "...", "recommendation": "..."}],
  "futureRoadmap": [{"phase": "Short-term|Mid-term|Long-term", "details": "..."}],
  "toolsAndPackages": ["only what you see imported or used"],
  "scores": {"codeQuality": 0, "security": 0, "performance": 0, "maintainability": 0},
  "grade": "computed from formula above",
  "finalVerdict": "2-3 sentences: most important finding + single highest-priority action."
}

RULES:
- Analyse ONLY what is present in the actual code provided — do not invent issues
- Apply the scoring criteria strictly — do not be generous without evidence
- Apply the grade formula exactly — do not override it with subjective judgment
- If a section has nothing to report, return an empty array []`;

//  SYSTEM PROMPT — Test Case Generator
const TEST_GENERATOR_SYSTEM_PROMPT = `You are an EXPERT SOFTWARE TEST ENGINEER specialising in JavaScript/Node.js.

Analyse source code and generate a test suite using Jest (or Vitest if detected).

You MUST respond with ONLY a valid JSON object — no preamble, no explanation, no markdown fences, no trailing text.
Start your response with { and end with }.

{
  "framework": "jest | vitest | mocha",
  "setupInstructions": "Short setup note, e.g. npm install --save-dev jest",
  "testFiles": [{"fileName": "src/utils.test.js", "description": "...", "testCode": "Full runnable test file as a string (use \\n for newlines)"}],
  "unitTests": [{"functionName": "myFunction", "filePath": "src/utils.js", "description": "...", "cases": [{"label": "...", "type": "unit", "input": "...", "expected": "...", "codeSnippet": "..."}]}],
  "edgeCases": [{"functionName": "myFunction", "label": "...", "type": "edge", "input": "...", "expected": "...", "codeSnippet": "..."}],
  "integrationTests": [{"label": "...", "description": "...", "codeSnippet": "..."}],
  "mocks": [{"target": "...", "reason": "...", "snippet": "..."}],
  "coverageSummary": {"estimatedCoverage": 85, "uncoveredAreas": ["..."], "recommendation": "..."}
}

RULES:
- Analyse ONLY the code provided — do not invent functions that don't exist
- Generate REAL, RUNNABLE test code — not pseudo-code
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
    { phase: "Short-term", details: "Retry the analysis." },
    { phase: "Mid-term", details: "Switch to a more capable model such as llama-3.3-70b-versatile." },
    { phase: "Long-term", details: "Add automated retries and structured output validation." },
  ],
  toolsAndPackages: [],
  scores: { codeQuality: 0, security: 0, performance: 0, maintainability: 0 },
  grade: "N/A",
  finalVerdict: "Analysis failed. No code was evaluated.",
};

const FALLBACK_TEST_RESULT = {
  framework: "jest",
  setupInstructions: "Test generation failed. Please retry or check your GROQ_API_KEY.",
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

//  Groq call with model fallback chain
const MODELS_TO_TRY = [process.env.GROQ_MODEL || "openai/gpt-oss-20b", "openai/gpt-oss-120b"];

// TPM budget note: Groq's on-demand free tier caps requests at 8000 tokens/minute
// (prompt + completion combined). System prompt ≈ 500-600 tokens, so keep
// userContent + max_tokens comfortably under ~7000 to avoid 413 errors.
async function callGroqWithRetry(groq, systemPrompt, userContent) {
  let lastError;
  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`🤖 Trying model: ${model}`);
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.1,
        max_tokens: 3000,
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
  const result = await callGroqWithRetry(groq, SYSTEM_PROMPT, input.slice(0, 9_000));
  return result ?? FALLBACK_RESULT;
}

export async function generateTests(input) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log(`🧪 Generating tests for ${input.length} chars…`);
  const result = await callGroqWithRetry(groq, TEST_GENERATOR_SYSTEM_PROMPT, input.slice(0, 8_000));
  return result ?? FALLBACK_TEST_RESULT;
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