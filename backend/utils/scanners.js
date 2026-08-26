// backend/utils/scanners.js
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Helpers ─────────────────────────────────────────────────────

async function walkDir(dir, ignore = ["node_modules", ".git", ".env", "dist", "build"]) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignore.includes(entry.name)) continue;
      files.push(...(await walkDir(fullPath, ignore)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

// ─── 1. Dependency Scanner (npm audit) ────────────────────────

export async function scanDependencies(repoPath) {
  try {
    // Try to run npm audit – but only if npm is available
    const { stdout } = await execAsync(`npm audit --json --prefix ${repoPath}`, {
      timeout: 30000, // 30 seconds max
    });
    const audit = JSON.parse(stdout);
    const advisories = audit.advisories || {};
    return Object.values(advisories).map((adv) => ({
      package: adv.module_name,
      version: adv.vulnerable_versions,
      cve: adv.cves?.[0] || "N/A",
      severity: adv.severity || "low",
      fixedIn: adv.patches?.[0]?.version || "N/A",
    }));
  } catch (err) {
    // npm audit exits non‑zero when vulnerabilities exist, but stdout still has JSON
    if (err.stdout) {
      try {
        const audit = JSON.parse(err.stdout);
        const advisories = audit.advisories || {};
        return Object.values(advisories).map((adv) => ({
          package: adv.module_name,
          version: adv.vulnerable_versions,
          cve: adv.cves?.[0] || "N/A",
          severity: adv.severity || "low",
          fixedIn: adv.patches?.[0]?.version || "N/A",
        }));
      } catch {
        // fall through
      }
    }
    // If npm audit fails (e.g., no package.json), return empty
    return [];
  }
}

// ─── 2. Secrets Scanner (regex-based) ─────────────────────────

const SECRET_PATTERNS = [
  { regex: /AKIA[0-9A-Z]{16}/, type: "AWS Access Key" },
  { regex: /-----BEGIN RSA PRIVATE KEY-----/, type: "RSA Private Key" },
  { regex: /-----BEGIN DSA PRIVATE KEY-----/, type: "DSA Private Key" },
  { regex: /-----BEGIN EC PRIVATE KEY-----/, type: "EC Private Key" },
  { regex: /-----BEGIN OPENSSH PRIVATE KEY-----/, type: "OpenSSH Private Key" },
  { regex: /[a-zA-Z0-9]{32,}/, type: "Generic Secret (potential API key)" },
  { regex: /ghp_[a-zA-Z0-9]{36}/, type: "GitHub Personal Access Token" },
  { regex: /gho_[a-zA-Z0-9]{36}/, type: "GitHub OAuth Token" },
  { regex: /Bearer\s+[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/, type: "JWT Token" },
  { regex: /SK-[a-zA-Z0-9]{32,}/, type: "Stripe Secret Key" },
];

export async function scanSecrets(repoPath) {
  const secrets = [];
  const files = await walkDir(repoPath);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".woff", ".woff2", ".ttf", ".eot"].includes(ext)) continue;
    try {
      const content = fs.readFileSync(file, "utf8").split("\n");
      for (let lineIdx = 0; lineIdx < content.length; lineIdx++) {
        const line = content[lineIdx];
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.regex.test(line)) {
            secrets.push({
              pattern: pattern.type,
              file: path.relative(repoPath, file),
              line: lineIdx + 1,
              confidence: 90,
            });
          }
        }
      }
    } catch {
      // skip unreadable files
    }
  }
  return secrets;
}

// ─── 3. Security Scanner (ESLint with security plugin) ────────

export async function scanSecurity(repoPath) {
  try {
    // Check if eslint is available in the repo or globally
    const { stdout } = await execAsync(
      `npx eslint --format json --no-eslintrc --plugin security --rule 'security/detect-non-literal-require: error' "${repoPath}" 2>/dev/null || true`,
      { timeout: 30000 }
    );
    const results = JSON.parse(stdout);
    const vulns = [];
    for (const result of results) {
      for (const msg of result.messages) {
        if (msg.ruleId?.startsWith("security/")) {
          vulns.push({
            severity: msg.severity === 2 ? "high" : "medium",
            title: msg.message,
            file: path.relative(repoPath, result.filePath),
            line: msg.line || 0,
            description: msg.message,
            recommendation: `Fix rule ${msg.ruleId}`,
          });
        }
      }
    }
    return vulns;
  } catch (err) {
    // ESLint may fail if no config or if security plugin isn't installed; return empty
    return [];
  }
}

// ─── 4. Technical Debt Calculator ──────────────────────────────

const SEVERITY_HOURS = { critical: 8, high: 4, medium: 2, low: 1 };

export function calculateTechDebt(issues) {
  let totalHours = 0;
  const list = issues.map((issue) => {
    const sev = (issue.severity?.toLowerCase() || "low");
    const effort = SEVERITY_HOURS[sev] || 1;
    totalHours += effort;
    return {
      file: issue.file || issue.component || "unknown",
      severity: sev,
      effort,
      description: issue.title || issue.description || "No description",
    };
  });
  return {
    estimatedHours: Math.round(totalHours * 10) / 10,
    issues: list,
  };
}

// ─── 5. Architecture Graph (using madge) ──────────────────────

export async function generateArchitectureGraph(repoPath) {
  try {
    // Dynamic import because madge may not be installed
    const madge = await import("madge");
    const res = await madge.default(repoPath, {
      extensions: ["js", "jsx", "ts", "tsx", "mjs", "cjs"],
      excludeRegExp: /node_modules|\.test\.|\.spec\./,
    });
    const deps = res.obj();
    const nodes = Object.keys(deps).map((id) => ({
      id,
      label: id,
      type: "module",
    }));
    const edges = [];
    for (const [from, toArr] of Object.entries(deps)) {
      for (const to of toArr) {
        edges.push({ from, to, type: "import" });
      }
    }
    return { nodes, edges };
  } catch (err) {
    console.warn("Architecture graph generation failed:", err.message);
    return { nodes: [], edges: [] };
  }
}

// ─── 6. Health Score Calculator ────────────────────────────────

export function computeHealthScore(scores, depVulns, secVulns, techDebt) {
  const overall = Math.round(
    (scores.codeQuality || 0) * 0.30 +
      (scores.security || 0) * 0.30 +
      (scores.performance || 0) * 0.20 +
      (scores.maintainability || 0) * 0.20
  );

  // Penalise based on issues
  let penalty = 0;
  if (depVulns.length > 0) penalty += Math.min(depVulns.length * 2, 10);
  if (secVulns.length > 0) penalty += Math.min(secVulns.length * 3, 15);
  if (techDebt.estimatedHours > 20) penalty += 5;

  const finalScore = Math.max(0, Math.min(100, overall - penalty));
  const grade = finalScore >= 90 ? "A" : finalScore >= 75 ? "B" : finalScore >= 60 ? "C" : finalScore >= 40 ? "D" : "F";

  return {
    overall: finalScore,
    grade,
    breakdown: {
      codeQuality: scores.codeQuality || 0,
      security: scores.security || 0,
      performance: scores.performance || 0,
      maintainability: scores.maintainability || 0,
      testCoverage: 0, // could be added later
    },
  };
}