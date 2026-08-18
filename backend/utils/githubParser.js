// backend/utils/githubParser.js
// Fetches a GitHub repo's source and concatenates it for AI analysis.
// Design principle: NEVER silently substitute placeholder text. If the
// real source can't be fetched, throw a specific, actionable error and
// let the caller surface it — a fabricated "no README found" prompt
// sent to the LLM produces a plausible-looking but meaningless report.

const GITHUB_API = "https://api.github.com";
const MAX_CHARS_DEFAULT = 28_000;
const CONCURRENCY = 6; // parallel file fetches — keeps this fast without hammering the API

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

function parseGitHubUrl(url) {
  const match = String(url || "").match(/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/|$)/);
  if (!match) {
    throw new Error("Invalid GitHub URL. Expected format: https://github.com/owner/repo");
  }
  return { owner: match[1], repo: match[2] };
}

function isCodeFile(filePath) {
  if (EXCLUDE_PATTERN.test(filePath) || LOCKFILE_PATTERN.test(filePath)) return false;
  const dot = filePath.lastIndexOf(".");
  if (dot === -1) return false;
  return CODE_EXTENSIONS.has(filePath.slice(dot).toLowerCase());
}

function authHeaders() {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "aiCodeReviewer" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function githubFetch(url) {
  const res = await fetch(url, { headers: authHeaders() });

  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      const resetAt = new Date(Number(res.headers.get("x-ratelimit-reset")) * 1000);
      throw new Error(
        `GitHub API rate limit exceeded. Resets at ${resetAt.toLocaleTimeString()}. ` +
        (process.env.GITHUB_TOKEN ? "" : "Set GITHUB_TOKEN in your .env to raise the limit from 60/hr to 5000/hr."),
      );
    }
  }
  return res;
}

async function getDefaultBranch(owner, repo) {
  const res = await githubFetch(`${GITHUB_API}/repos/${owner}/${repo}`);
  if (res.status === 404) {
    throw new Error(`Repository ${owner}/${repo} not found or is private (no GITHUB_TOKEN with access provided).`);
  }
  if (!res.ok) {
    throw new Error(`GitHub API error fetching repo metadata: ${res.status}`);
  }
  const data = await res.json();
  return data.default_branch || "main";
}

async function fetchTree(owner, repo, branch) {
  const res = await githubFetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  if (!res.ok) {
    throw new Error(`Could not fetch file tree for ${owner}/${repo}@${branch} (status ${res.status}).`);
  }
  const data = await res.json();
  if (data.truncated) {
    console.warn(`⚠️ Tree for ${owner}/${repo} was truncated by GitHub (very large repo).`);
  }
  return (data.tree || []).filter((f) => f.type === "blob");
}

async function fetchBlobContent(owner, repo, sha) {
  // Blob API by SHA — one call regardless of path encoding issues, and
  // works uniformly for every file since we already have the tree.
  const res = await githubFetch(`${GITHUB_API}/repos/${owner}/${repo}/git/blobs/${sha}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.encoding !== "base64" || !data.content) return null;
  try {
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
  } catch {
    return null; // binary or undecodable content
  }
}

/**
 * Fetch and concatenate a GitHub repo's source for AI analysis.
 * Throws on any failure — callers must not catch-and-substitute placeholder text.
 */
export async function parseGithubRepo(repoUrl, { maxChars = MAX_CHARS_DEFAULT, branch } = {}) {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  const resolvedBranch = branch || (await getDefaultBranch(owner, repo));
  const tree = await fetchTree(owner, repo, resolvedBranch);

  let codeFiles = tree.filter((f) => isCodeFile(f.path));
  if (codeFiles.length === 0) {
    // Fall back to any non-binary file rather than failing outright —
    // but this is a real fallback over real repo data, not fabricated text.
    codeFiles = tree.filter((f) => !/\.(png|jpe?g|gif|ico|svg|woff2?|ttf|eot|bin|exe|zip)$/i.test(f.path));
  }
  if (codeFiles.length === 0) {
    throw new Error(`No readable source files found in ${owner}/${repo}@${resolvedBranch}.`);
  }

  // Sort so smaller, higher-signal files (configs, entry points) aren't
  // starved by one huge file eating the whole budget first.
  codeFiles.sort((a, b) => (a.size ?? 0) - (b.size ?? 0));

  let combined = `# Repository: ${owner}/${repo}\n\n`;
  let filesFetched = 0;
  let cursor = 0;

  while (cursor < codeFiles.length && combined.length < maxChars) {
    const batch = codeFiles.slice(cursor, cursor + CONCURRENCY);
    cursor += CONCURRENCY;

    const results = await Promise.all(
      batch.map(async (file) => ({
        file,
        content: await fetchBlobContent(owner, repo, file.sha),
      })),
    );

    for (const { file, content } of results) {
      if (!content) continue;
      const block = `\n\n## FILE: ${file.path}\n\`\`\`\n${content}\n\`\`\``;
      if (combined.length + block.length > maxChars) {
        combined += block.slice(0, maxChars - combined.length) + "\n… [truncated]";
        combined = combined.slice(0, maxChars);
        filesFetched++;
        break;
      }
      combined += block;
      filesFetched++;
    }
    if (combined.length >= maxChars) break;
  }

  if (filesFetched === 0) {
    throw new Error(
      `Found ${codeFiles.length} candidate files in ${owner}/${repo} but none had readable content. ` +
      "This usually means the token lacks repo scope, or all files exceed GitHub's blob size limit.",
    );
  }

  console.log(`✅ parseGithubRepo: ${filesFetched}/${codeFiles.length} files, ${combined.length} chars from ${owner}/${repo}`);
  return combined;
}