// backend/utils/cve.js
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execFileAsync = promisify(execFile);

const LOCKFILES = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
];

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

// Parse both npm v7+ (vulnerabilities map) and npm v6 (advisories map).
function parseAudit(stdout) {
  let audit;
  try {
    audit = JSON.parse(stdout);
  } catch {
    return [];
  }

  // ── npm v7+ format ─────────────────────────────────────
  if (audit.vulnerabilities && typeof audit.vulnerabilities === "object") {
    return Object.entries(audit.vulnerabilities).map(([pkg, v]) => {
      const viaObj = v.via?.find((x) => typeof x === "object") || {};
      return {
        package: pkg,
        version: v.range || "unknown",
        severity: v.severity || "unknown",
        title: viaObj.title || "",
        cve: viaObj.cve || "N/A",
        url: viaObj.url || "",
        fixedIn:
          typeof v.fixAvailable === "object" && v.fixAvailable?.version
            ? v.fixAvailable.version
            : v.fixAvailable === true
              ? "available"
              : "N/A",
        recommendation:
          v.fixAvailable && typeof v.fixAvailable === "object"
            ? `Upgrade ${pkg} to ${v.fixAvailable.version}`
            : "Run npm audit fix",
      };
    });
  }

  // ── npm v6 legacy format ───────────────────────────────
  if (audit.advisories && typeof audit.advisories === "object") {
    const out = [];
    for (const adv of Object.values(audit.advisories)) {
      out.push({
        package: adv.module_name,
        version: adv.vulnerable_versions || "unknown",
        severity: adv.severity || "unknown",
        title: adv.title || "",
        cve: adv.cves?.[0] || "N/A",
        url: adv.url || "",
        fixedIn: adv.patches?.[0]?.version || "N/A",
        recommendation:
          adv.recommendation || "Update to the latest patched version",
      });
    }
    return out;
  }

  return [];
}

export async function checkCVEs(repoPath) {
  // npm audit requires a lockfile. Skip early to avoid the ENOLOCK error.
  const hasLockfile = await hasAnyLockfile(repoPath);
  if (!hasLockfile) {
    console.warn(
      `checkCVEs: no lockfile in ${repoPath}, skipping CVE scan`,
    );
    return [];
  }

  try {
    const { stdout } = await execFileAsync("npm", ["audit", "--json"], {
      cwd: repoPath,
      timeout: 30_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return parseAudit(stdout);
  } catch (err) {
    // npm audit exits non-zero when vulnerabilities are found.
    // The JSON is still on stdout in that case.
    if (err.stdout) {
      return parseAudit(err.stdout);
    }
    console.warn("CVE scan failed:", err.message);
    return [];
  }
}