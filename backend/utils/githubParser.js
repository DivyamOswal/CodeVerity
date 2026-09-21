// backend/utils/githubParser.js
// Fetches a GitHub repo's source and concatenates it for AI analysis.
// Also provides cloning for local scanners and token estimation.

import fs from "fs/promises";
import path from "path";
import { cloneGithubRepo } from "./gitUtils.js";

const GITHUB_API = "https://api.github.com";
const MAX_CHARS_DEFAULT = 28_000;
const MAX_FILES_DEFAULT = 60;
const CONCURRENCY = 6;

const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py", ".java", ".go", ".rs",
  ".c", ".cpp", ".h", ".hpp", ".cs",
  ".php", ".rb", ".swift", ".kt",
  ".html", ".css", ".scss",
  ".json", ".yaml", ".yml",
  ".md", ".sh", ".bash",
]);

const EXCLUDE_PATTERN = /(^|\/)(node_modules|dist|build|\.next|\.git|vendor|coverage)\//i;
const LOCKFILE_PATTERN = /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|\.lock)$/i;
const BINARY_PATTERN = /\.(png|jpe?g|gif|webp|ico|svg|woff2?|ttf|eot|bin|exe|zip|tar|gz|pdf|mp[34]|mov|avi|wasm)$/i;

// Files that are likely to contain the "interesting" logic get a bonus.
const IMPORTANT_HINTS = [
  /(^|\/)(index|main|app|server|router|routes?|controller|handler|middleware|service|model|schema|auth|api)\./i,
  /(^|\/)package\.json$/i,
  /(^|\/)README\.md$/i,
  /(^|\/)\.env\.example$/i,
];

function parseGitHubUrl(url) {
  const match = String(url || "").match(
    /github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/|$)/,
  );
  if (!match) {
    throw new Error(
      "Invalid GitHub URL. Expected format: https://github.com/owner/repo",
    );
  }
  return { owner: match[1], repo: match[2] };
}

function isCodeFile(filePath) {
  if (EXCLUDE_PATTERN.test(filePath) || LOCKFILE_PATTERN.test(filePath)) {
    return false;
  }
  if (BINARY_PATTERN.test(filePath)) return false;
  const dot = filePath.lastIndexOf(".");
  if (dot === -1) return false;
  return CODE_EXTENSIONS.has(filePath.slice(dot).toLowerCase());
}

// Score a file for "interestingness". Higher = fetched first.
function filePriority(file) {
  let score = 0;
  for (const hint of IMPORTANT_HINTS) {
    if (hint.test(file.path)) score += 100;
  }
  // Prefer mid-sized files  tiny files are usually config, huge files
  // blow the budget on one file.
  const size = file.size ?? 0;
  if (size > 500 && size < 60_000) score += 50;
  else if (size >= 60_000 && size < 200_000) score += 20;
  // Penalize tests (still useful, but lower priority than prod code).
  if (/\.(test|spec)\.[a-z]+$/i.test(file.path)) score -= 30;
  // Penalize docs.
  if (/\.(md|txt)$/i.test(file.path)) score -= 20;
  return score;
}

function authHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "CodeVerity",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function githubFetch(url) {
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      const resetAt = new Date(
        Number(res.headers.get("x-ratelimit-reset")) * 1000,
      );
      throw new Error(
        `GitHub API rate limit exceeded. Resets at ${resetAt.toLocaleTimeString()}. ` +
          (process.env.GITHUB_TOKEN
            ? ""
            : "Set GITHUB_TOKEN in your .env to raise the limit from 60/hr to 5000/hr."),
      );
    }
  }
  return res;
}

async function getDefaultBranch(owner, repo) {
  const res = await githubFetch(`${GITHUB_API}/repos/${owner}/${repo}`);
  if (res.status === 404) {
    throw new Error(
      `Repository ${owner}/${repo} not found or is private (no GITHUB_TOKEN with access provided).`,
    );
  }
  if (!res.ok) {
    throw new Error(
      `GitHub API error fetching repo metadata: ${res.status}`,
    );
  }
  const data = await res.json();
  return data.default_branch || "main";
}

async function fetchTree(owner, repo, branch) {
  const res = await githubFetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
  );
  if (!res.ok) {
    throw new Error(
      `Could not fetch file tree for ${owner}/${repo}@${branch} (status ${res.status}).`,
    );
  }
  const data = await res.json();
  if (data.truncated) {
    console.warn(
      `⚠️ Tree for ${owner}/${repo} was truncated by GitHub (very large repo).`,
    );
  }
  return (data.tree || []).filter((f) => f.type === "blob");
}

async function fetchBlobContent(owner, repo, sha) {
  const res = await githubFetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/blobs/${sha}`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.encoding !== "base64" || !data.content) return null;
  try {
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString(
      "utf-8",
    );
  } catch {
    return null;
  }
}

/**
 * Build a single block of text for one file, using a marker that the AI
 * prompt is taught to recognize. Keep this in sync with the SYSTEM_PROMPT
 * in groq.js.
 */
function formatFileBlock(filePath, content) {
  return `\n\n=== ${filePath} ===\n${content}`;
}

/**
 * Fetch and concatenate a GitHub repo's source for AI analysis.
 * Throws on any failure  callers must not catch-and-substitute placeholder text.
 */
export async function parseGithubRepo(
  repoUrl,
  {
    maxChars = MAX_CHARS_DEFAULT,
    maxFiles = MAX_FILES_DEFAULT,
    branch,
  } = {},
) {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  const resolvedBranch = branch || (await getDefaultBranch(owner, repo));
  const tree = await fetchTree(owner, repo, resolvedBranch);

  let candidates = tree.filter((f) => isCodeFile(f.path));
  if (candidates.length === 0) {
    // Fallback  drop the extension whitelist but still exclude binaries.
    candidates = tree.filter((f) => !BINARY_PATTERN.test(f.path));
  }
  if (candidates.length === 0) {
    throw new Error(
      `No readable source files found in ${owner}/${repo}@${resolvedBranch}.`,
    );
  }

  // Sort by "interestingness"  the previous version sorted by size ascending,
  // which filled the budget with tiny config files before touching real logic.
  candidates.sort((a, b) => filePriority(b) - filePriority(a));

  let combined = `# Repository: ${owner}/${repo}@${resolvedBranch}\n`;
  combined += `# Files analyzed below are marked with === path/to/file ===\n`;
  combined += `# Each finding in your response MUST reference the exact path shown.\n\n`;

  let filesFetched = 0;
  let cursor = 0;

  while (
    cursor < candidates.length &&
    combined.length < maxChars &&
    filesFetched < maxFiles
  ) {
    const batch = candidates.slice(cursor, cursor + CONCURRENCY);
    cursor += CONCURRENCY;

    const results = await Promise.all(
      batch.map(async (file) => ({
        file,
        content: await fetchBlobContent(owner, repo, file.sha),
      })),
    );

    let budgetExhausted = false;

    for (const { file, content } of results) {
      if (!content) continue;
      if (filesFetched >= maxFiles) {
        budgetExhausted = true;
        break;
      }

      const block = formatFileBlock(file.path, content);
      const room = maxChars - combined.length;

      if (block.length > room) {
        // Only append if there's enough room to be useful (say, 500 chars
        // of content + the marker). Otherwise stop cleanly.
        if (room > 600) {
          const marker = `\n\n=== ${file.path} ===\n`;
          const contentRoom = room - marker.length - 40;
          combined += marker;
          combined += content.slice(0, Math.max(contentRoom, 0));
          combined += `\n… [truncated  file continues past this point]`;
          filesFetched++;
        }
        budgetExhausted = true;
        break;
      }

      combined += block;
      filesFetched++;
    }

    if (budgetExhausted) break;
  }

  if (filesFetched === 0) {
    throw new Error(
      `Found ${candidates.length} candidate files in ${owner}/${repo} but none had readable content. ` +
        "This usually means the token lacks repo scope, or all files exceed GitHub's blob size limit.",
    );
  }

  // Final safety trim  but only if we're still over budget.
  if (combined.length > maxChars) {
    combined = combined.slice(0, maxChars) + "\n… [output truncated at maxChars]";
  }

  console.log(
    `✅ parseGithubRepo: ${filesFetched}/${candidates.length} files, ${combined.length} chars from ${owner}/${repo}`,
  );
  return combined;
}

/**
 * Clone a GitHub repo and return both the source code string and the local repo path.
 * The cloned copy is used by local scanners; the source string is used by the AI.
 */
export async function cloneAndParseGithubRepo(repoUrl, options = {}) {
  const repoPath = await cloneGithubRepo(repoUrl);
  const code = await parseGithubRepo(repoUrl, options);
  return { code, repoPath };
}

/**
 * Estimate token usage for a given input string.
 * Rough estimate: ~4 characters per token for code text.
 */
export function estimateTokens(input) {
  if (typeof input !== "string") return 0;
  return Math.ceil(input.length / 4);
}