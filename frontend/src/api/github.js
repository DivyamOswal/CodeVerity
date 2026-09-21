// frontend/src/api/github.js
import axios from "./axios";

// ─────────────────────────────────────────────────────────────
// Analyze a GitHub repo
// Response: { success, analysis: { summary, grade, ..., _sourceCode }, reportId }
// ─────────────────────────────────────────────────────────────
export const analyzeGithub = (data) =>
  axios.post("/github/analyze", data);

// ─────────────────────────────────────────────────────────────
// Generate tests from source code
// Result.jsx calls this via the `generateTestsFn` prop
// Backend returns: { result, usage }
// ─────────────────────────────────────────────────────────────
export const generateTests = async (code) => {
  const res = await axios.post("/github/generate-tests", { code });
  return res.data?.result ?? res.data;
};

// ─────────────────────────────────────────────────────────────
// Auto-Fix: create a PR with an AI-generated fix
// Called from Result.jsx (FindingRow, Identified Bugs, Security Assessment)
// Response: { success, prUrl, prNumber, branch, tokensUsed, tokensRemaining }
// ─────────────────────────────────────────────────────────────
export const autoFixIssue = (payload) =>
  axios.post("/github/auto-fix", payload);

// ─────────────────────────────────────────────────────────────
// Repo browsing  used by RepoEditor.jsx
// ─────────────────────────────────────────────────────────────
export const getRepoContents = (repoUrl, path = "") =>
  axios.get("/github/repo/contents", { params: { repoUrl, path } });

export const getFileContent = (repoUrl, filePath) =>
  axios.get("/github/repo/file", { params: { repoUrl, filePath } });