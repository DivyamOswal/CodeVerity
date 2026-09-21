// backend/utils/scanners.js
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Shared ignore list ───────────────────────────────────────
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".nuxt",
  ".cache",
  ".turbo",
  ".parcel-cache",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
]);

const BINARY_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".pdf", ".zip", ".tar", ".gz", ".7z", ".rar",
  ".mp3", ".mp4", ".mov", ".avi", ".webm",
  ".exe", ".dll", ".so", ".dylib", ".bin", ".wasm",
]);

const LOCKFILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
]);

const MAX_FILE_SIZE_BYTES = 1_000_000; // 1 MB  secrets are never in larger files
const MAX_FILES_TO_SCAN = 2000;

// ─── Helpers ─────────────────────────────────────────────────

async function walkDir(dir, opts = {}) {
  const {
    ignoreDirs = IGNORE_DIRS,
    skipLockfiles = false,
    maxFiles = MAX_FILES_TO_SCAN,
  } = opts;

  const results = [];

  async function recurse(current) {
    if (results.length >= maxFiles) return;

    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) return;

      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (ignoreDirs.has(entry.name) || entry.name.startsWith(".")) continue;
        await recurse(fullPath);
      } else if (entry.isFile()) {
        if (skipLockfiles && LOCKFILES.has(entry.name)) continue;
        results.push(fullPath);
      }
    }
  }

  await recurse(dir);
  return results;
}

// ─── 1. Dependency Scanner (npm audit) ────────────────────────

/**
 * Runs `npm audit --json` against the cloned repo.
 * Handles both npm v6 (advisories) and npm v7+ (vulnerabilities) formats.
 * Returns [] if there is no lockfile or audit is unavailable.
 */
export async function scanDependencies(repoPath) {
  // npm audit requires a lockfile. Skip early to avoid the ENOLOCK error.
  const hasLockfile = await hasAnyLockfile(repoPath);
  if (!hasLockfile) {
    return [];
  }

  const parseAudit = (stdout) => {
    let audit;
    try {
      audit = JSON.parse(stdout);
    } catch {
      return [];
    }

    // npm v7+ format
    if (audit.vulnerabilities && typeof audit.vulnerabilities === "object") {
      return Object.entries(audit.vulnerabilities).map(([pkg, v]) => ({
        package: pkg,
        version: v.range || "unknown",
        cve: v.via?.find((x) => typeof x === "object")?.cve || "N/A",
        severity: v.severity || "low",
        fixedIn: v.fixAvailable?.version || "N/A",
        title: v.via?.find((x) => typeof x === "object")?.title || "",
        url: v.via?.find((x) => typeof x === "object")?.url || "",
      }));
    }

    // npm v6 legacy format
    if (audit.advisories && typeof audit.advisories === "object") {
      return Object.values(audit.advisories).map((adv) => ({
        package: adv.module_name,
        version: adv.vulnerable_versions,
        cve: adv.cves?.[0] || "N/A",
        severity: adv.severity || "low",
        fixedIn: adv.patches?.[0]?.version || "N/A",
        title: adv.title || "",
        url: adv.url || "",
      }));
    }

    return [];
  };

  try {
    const { stdout } = await execFileAsync(
      "npm",
      ["audit", "--json", "--prefix", repoPath],
      { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 },
    );
    return parseAudit(stdout);
  } catch (err) {
    // npm audit exits non-zero when vulnerabilities are found.
    // The JSON is still on stdout in that case.
    if (err.stdout) {
      return parseAudit(err.stdout);
    }
    console.warn("npm audit failed:", err.message);
    return [];
  }
}

async function hasAnyLockfile(repoPath) {
  for (const name of LOCKFILES) {
    try {
      await fs.access(path.join(repoPath, name));
      return true;
    } catch {
      // keep looking
    }
  }
  return false;
}

// ─── 2. Secrets Scanner (regex-based) ─────────────────────────

/**
 * High-confidence patterns only. Generic "long alphanumeric string" matches
 * were removed  they produced hundreds of false positives per repo.
 * If you want generic detection later, add entropy scoring on top of a
 * length heuristic restricted to assignments (= "…").
 */
const SECRET_PATTERNS = [
  { regex: /AKIA[0-9A-Z]{16}/, type: "AWS Access Key ID" },
  { regex: /-----BEGIN (RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY-----/, type: "Private Key" },
  { regex: /ghp_[a-zA-Z0-9]{36}/, type: "GitHub Personal Access Token" },
  { regex: /gho_[a-zA-Z0-9]{36}/, type: "GitHub OAuth Token" },
  { regex: /ghs_[a-zA-Z0-9]{36}/, type: "GitHub Server Token" },
  { regex: /github_pat_[a-zA-Z0-9_]{82}/, type: "GitHub Fine-Grained PAT" },
  { regex: /sk_live_[a-zA-Z0-9]{24,}/, type: "Stripe Live Secret Key" },
  { regex: /sk_test_[a-zA-Z0-9]{24,}/, type: "Stripe Test Secret Key" },
  { regex: /rk_live_[a-zA-Z0-9]{24,}/, type: "Stripe Live Restricted Key" },
  { regex: /AIza[0-9A-Za-z\-_]{35}/, type: "Google API Key" },
  { regex: /ya29\.[0-9A-Za-z\-_]+/, type: "Google OAuth Access Token" },
  { regex: /xox[baprs]-[0-9A-Za-z-]{10,}/, type: "Slack Token" },
  { regex: /https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]+\/B[0-9A-Z]+\/[0-9A-Za-z]+/, type: "Slack Webhook URL" },
  { regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, type: "JWT (embedded)" },
  { regex: /SG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, type: "SendGrid API Key" },
  { regex: /npm_[A-Za-z0-9]{36}/, type: "npm Access Token" },
  { regex: /pypi-AgEIcHlwaS5vcmc[A-Za-z0-9_-]+/, type: "PyPI Token" },
];

// Lines that clearly aren't secrets even if they match a pattern.
const FALSE_POSITIVE_HINTS = [
  /process\.env\./i,          // process.env.STRIPE_KEY
  /import\.meta\.env\./i,     // Vite env vars
  /os\.environ/i,             // Python env lookup
  /your[_-]?api[_-]?key/i,    // placeholder
  /example|placeholder|changeme|dummy|xxxx|test[_-]?key/i,
  /<[^>]+>/,                  // <YOUR_KEY_HERE>
  /\$\{[^}]+\}/,              // template literals
];

export async function scanSecrets(repoPath) {
  const secrets = [];
  const files = await walkDir(repoPath, { skipLockfiles: true });

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (BINARY_EXTS.has(ext)) continue;

    let stat;
    try {
      stat = await fs.stat(file);
    } catch {
      continue;
    }
    if (stat.size > MAX_FILE_SIZE_BYTES) continue;

    let content;
    try {
      content = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }

    const lines = content.split("\n");
    const relPath = path.relative(repoPath, file);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 500) continue; // minified / bundled
      if (FALSE_POSITIVE_HINTS.some((re) => re.test(line))) continue;

      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(line)) {
          secrets.push({
            pattern: pattern.type,
            file: relPath,
            line: i + 1,
            confidence: 95,
            // Never include the matched value  it may be a real credential.
          });
          break; // one finding per line is enough
        }
      }
    }
  }

  return secrets;
}

// ─── 3. Security Scanner (ESLint security plugin) ─────────────

/**
 * Runs the eslint-plugin-security rules against JS/TS files.
 * Requires @typescript-eslint/parser and eslint-plugin-security to be
 * installed in the backend (not in the cloned repo).
 */
export async function scanSecurity(repoPath) {
  let ESLint, security, tsParser;
  try {
    const eslintMod = await import("eslint");
    ESLint = eslintMod.ESLint;
  } catch {
    console.warn("scanSecurity: eslint not installed, skipping");
    return [];
  }

  try {
    const mod = await import("eslint-plugin-security");
    security = mod.default || mod;
  } catch {
    console.warn("scanSecurity: eslint-plugin-security not installed, skipping");
    return [];
  }

  try {
    const mod = await import("@typescript-eslint/parser");
    tsParser = mod.default || mod;
  } catch {
    tsParser = null;
  }

  const overrideConfig = [
    {
      files: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
      languageOptions: { ecmaVersion: 2022, sourceType: "module" },
      plugins: { security },
      rules: {
        "security/detect-eval-with-expression": "error",
        "security/detect-non-literal-fs-filename": "warn",
        "security/detect-non-literal-require": "warn",
        "security/detect-object-injection": "warn",
        "security/detect-possible-timing-attacks": "warn",
        "security/detect-pseudoRandomBytes": "error",
        "security/detect-unsafe-regex": "error",
        "security/detect-buffer-noassert": "warn",
        "security/detect-child-process": "warn",
        "security/detect-disable-mustache-escape": "error",
        "security/detect-new-buffer": "warn",
        "security/detect-no-csrf-before-method-override": "error",
      },
    },
  ];

  if (tsParser) {
    overrideConfig.push({
      files: ["**/*.ts", "**/*.tsx"],
      languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { security },
      rules: {
        "security/detect-eval-with-expression": "error",
        "security/detect-non-literal-fs-filename": "warn",
        "security/detect-object-injection": "warn",
        "security/detect-possible-timing-attacks": "warn",
        "security/detect-pseudoRandomBytes": "error",
        "security/detect-unsafe-regex": "error",
      },
    });
  }

  const eslint = new ESLint({
    overrideConfigFile: null,
    overrideConfig,
    errorOnUnmatchedPattern: false,
    ignore: true,
  });

  const extensions = tsParser
    ? [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]
    : [".js", ".jsx", ".mjs", ".cjs"];

  const files = (await walkDir(repoPath)).filter((f) =>
    extensions.some((ext) => f.endsWith(ext)),
  );

  if (files.length === 0) return [];

  let lintResults;
  try {
    lintResults = await eslint.lintFiles(files);
  } catch (err) {
    console.warn("scanSecurity lint failed:", err.message);
    return [];
  }

  const vulns = [];
  for (const result of lintResults) {
    for (const msg of result.messages) {
      if (!msg.ruleId?.startsWith("security/")) continue;
      vulns.push({
        severity: msg.severity === 2 ? "high" : "medium",
        title: msg.message,
        file: path.relative(repoPath, result.filePath),
        line: msg.line || 0,
        description: msg.message,
        recommendation: `Review ${msg.ruleId} and address the flagged pattern.`,
        ruleId: msg.ruleId,
      });
    }
  }
  return vulns;
}

// ─── 4. Technical Debt Calculator ─────────────────────────────

const SEVERITY_HOURS = { critical: 8, high: 4, medium: 2, low: 1, info: 0.5 };

export function calculateTechDebt(issues) {
  let totalHours = 0;
  const seen = new Set();
  const list = [];

  for (const issue of issues) {
    let sev = String(issue.severity || "low").toLowerCase();
    if (sev === "major") sev = "medium";
    if (sev === "minor") sev = "low";
    if (!["critical", "high", "medium", "low", "info"].includes(sev)) {
      sev = "low";
    }

    const file = issue.file || issue.component || "unknown";
    const description =
      issue.title || issue.description || issue.message || "No description";

    // Deduplicate: same file + same description isn't counted twice.
    const key = `${file}::${description}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const effort = SEVERITY_HOURS[sev] || 1;
    totalHours += effort;

    list.push({
      file,
      severity: sev === "info" ? "low" : sev,
      effort,
      description,
    });
  }

  return {
    estimatedHours: Math.round(totalHours * 10) / 10,
    issues: list,
  };
}

// ─── 5. Architecture Graph (madge) ────────────────────────────

export async function generateArchitectureGraph(repoPath) {
  try {
    const madgeMod = await import("madge");
    const madge = madgeMod.default;

    // madge does NOT accept a function for `exclude`. Use a RegExp.
    const res = await madge(repoPath, {
      extensions: ["js", "jsx", "ts", "tsx", "mjs", "cjs"],
      excludeRegExp: [
        /node_modules/,
        /\.test\./,
        /\.spec\./,
        /\/dist\//,
        /\/build\//,
        /\/\.next\//,
      ],
      fileExtensions: ["js", "jsx", "ts", "tsx"],
      detectiveOptions: {
        ts: { skipTypeImports: true },
        tsx: { skipTypeImports: true },
      },
    });

    const deps = res.obj();

    // Cap nodes/edges so the frontend doesn't try to render 5,000 SVG nodes.
    const MAX_NODES = 300;
    const allNodeIds = Object.keys(deps);
    const nodeIds = allNodeIds.slice(0, MAX_NODES);
    const nodeSet = new Set(nodeIds);

    const nodes = nodeIds.map((id) => ({
      id,
      label: id.split("/").pop() || id,
      type: "module",
    }));

    const edges = [];
    for (const [from, toArr] of Object.entries(deps)) {
      if (!nodeSet.has(from)) continue;
      for (const to of toArr) {
        if (!nodeSet.has(to)) continue;
        edges.push({ from, to, type: "import" });
      }
    }

    return {
      nodes,
      edges,
      truncated: allNodeIds.length > MAX_NODES,
      totalModules: allNodeIds.length,
    };
  } catch (err) {
    console.warn("Architecture graph generation failed:", err.message);
    return { nodes: [], edges: [], truncated: false, totalModules: 0 };
  }
}

// ─── 6. Health Score Calculator ────────────────────────────────

export function computeHealthScore(
  scores,
  depVulns,
  secVulns,
  techDebt,
  extras = {},
) {
  const { cveCount = 0, highComplexityCount = 0, secretsCount = 0 } = extras;

  const overall = Math.round(
    (scores.codeQuality || 0) * 0.30 +
      (scores.security || 0) * 0.30 +
      (scores.performance || 0) * 0.20 +
      (scores.maintainability || 0) * 0.20,
  );

  let penalty = 0;
  penalty += Math.min((depVulns?.length || 0) * 2, 10);
  penalty += Math.min((secVulns?.length || 0) * 3, 15);
  penalty += Math.min(secretsCount * 5, 20);       // secrets are serious
  penalty += Math.min(cveCount * 2, 10);
  penalty += Math.min(highComplexityCount * 0.5, 10);
  if (techDebt?.estimatedHours > 20) penalty += 5;
  if (techDebt?.estimatedHours > 50) penalty += 5;

  const finalScore = Math.max(0, Math.min(100, overall - penalty));
  const grade =
    finalScore >= 90 ? "A" :
    finalScore >= 75 ? "B" :
    finalScore >= 60 ? "C" :
    finalScore >= 40 ? "D" : "F";

  return {
    overall: finalScore,
    grade,
    penalty,
    breakdown: {
      codeQuality: scores.codeQuality || 0,
      security: scores.security || 0,
      performance: scores.performance || 0,
      maintainability: scores.maintainability || 0,
      testCoverage: 0, // placeholder until coverage scanning lands
    },
  };
}