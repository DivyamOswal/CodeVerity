// backend/utils/gitUtils.js
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

/**
 * Clone a GitHub repository to a temporary directory.
 * @param {string} repoUrl - The GitHub repo URL.
 * @returns {Promise<string>} - The path to the cloned repo.
 */
export async function cloneGithubRepo(repoUrl) {
  const tmpDir = path.join(os.tmpdir(), `codeverity-${Date.now()}`);
  await fs.mkdir(tmpDir, { recursive: true });
  await execAsync(`git clone --depth 1 ${repoUrl} ${tmpDir}`);
  return tmpDir;
}