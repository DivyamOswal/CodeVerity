// backend/utils/cve.js
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

export async function checkCVEs(repoPath) {
  try {
    const { stdout } = await execAsync(`npm audit --json`, { cwd: repoPath });
    const auditData = JSON.parse(stdout);
    const advisories = auditData.advisories || {};
    const vulnerabilities = [];

    for (const [pkg, data] of Object.entries(advisories)) {
      const details = data.findings?.[0]?.version || "";
      vulnerabilities.push({
        package: pkg,
        version: details,
        severity: data.severity || "unknown",
        title: data.title || "No title",
        cve: data.cve || "N/A",
        fixedIn: data.patches?.[0]?.version || "N/A",
        recommendation: data.recommendation || "Update to latest version",
      });
    }

    return vulnerabilities;
  } catch (err) {
    console.warn("CVE scan failed (npm audit not available):", err.message);
    return [];
  }
}
