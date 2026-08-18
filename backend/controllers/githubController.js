import { analyzeWithGroq, generateTests } from "../utils/groq.js";
import { parseGithubRepo } from "../utils/githubParser.js";
import Report from "../models/Report.js";

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

// Map known failure messages to HTTP status codes so the frontend
// can distinguish "you gave me a bad URL" from "something broke".
function statusForError(err) {
  const msg = err.message || "";
  if (/rate limit/i.test(msg)) return 429;
  if (/not found|private/i.test(msg)) return 404;
  if (/invalid github url/i.test(msg)) return 400;
  return 500;
}

//  POST /api/github/analyze
export const analyzeGithubRepo = async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl || typeof repoUrl !== "string") {
    return res.status(400).json({ error: "Repo URL required." });
  }
  if (!GITHUB_URL_PATTERN.test(repoUrl.trim())) {
    return res.status(400).json({ error: "Enter a valid GitHub repo URL, e.g. https://github.com/owner/repo" });
  }

  try {
    const code = await parseGithubRepo(repoUrl.trim());
    const ai = await analyzeWithGroq(code);

    const analysis = {
      summary: ai.summary ?? "No summary provided.",
      architecture: Array.isArray(ai.architecture) ? ai.architecture : [],
      bugs: Array.isArray(ai.bugs) ? ai.bugs : [],
      securityIssues: Array.isArray(ai.securityIssues) ? ai.securityIssues : [],
      futureRoadmap: Array.isArray(ai.futureRoadmap) ? ai.futureRoadmap : [],
      toolsAndPackages: Array.isArray(ai.toolsAndPackages) ? ai.toolsAndPackages : [],
      scores: ai.scores ?? { codeQuality: 0, security: 0, performance: 0, maintainability: 0 },
      grade: ai.grade ?? "N/A",
      finalVerdict: ai.finalVerdict ?? "The project demonstrates solid fundamentals with scope for improvement.",
      _sourceCode: code,
    };

    const report = await Report.create({
      userId: req.user.id,
      repoUrl: repoUrl.trim(),
      ...analysis,
    });

    return res.json({ success: true, analysis, reportId: report._id });
  } catch (err) {
    // Log full detail server-side; keep the client message specific
    // enough to act on but without leaking internals for 500s.
    console.error("❌ GitHub analysis error:", err.message);
    const status = statusForError(err);
    return res.status(status).json({
      error: status === 500 ? "Analysis failed. Please try again." : err.message,
    });
  }
};

//  POST /api/github/generate-tests
export const generateTestCases = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== "string" || code.trim().length < 10) {
      return res.status(400).json({
        error: "Request body must contain a non-empty 'code' string.",
      });
    }

    console.log(`📥 generateTestCases — received ${code.length} chars`);

    const result = await generateTests(code);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ generateTestCases error:", err.message);
    return res.status(500).json({ error: "Test generation failed. Please try again." });
  }
};