// backend/utils/complexity.js
import { ESLint } from "eslint";
import path from "path";
import fs from "fs";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  ".turbo",
  ".cache",
  "vendor",
  "__pycache__",
  ".parcel-cache",
  ".vercel",
  ".netlify",
]);

const MAX_FILES = 500;
const MAX_FUNCTIONS_IN_REPORT = 100;
const HIGH_COMPLEXITY_THRESHOLD = 10;

// Try to load the TypeScript parser. If it's not installed, TS files are
// skipped rather than producing parse errors that get silently ignored.
let tsParser = null;
try {
  const mod = await import("@typescript-eslint/parser");
  tsParser = mod.default || mod;
} catch {
  tsParser = null;
}

export async function getComplexity(repoPath) {
  const results = {
    functions: [],
    maxComplexity: 0,
    averageComplexity: 0,
    maintainability: 0,
    fileCount: 0,
    functionCount: 0,
    highComplexityCount: 0,
    skipped: false,
    tsSupported: Boolean(tsParser),
  };

  try {
    // We set max: 1 so EVERY function is reported with its complexity value.
    // This gives us a true average instead of only averaging the functions
    // that already exceed the default threshold of 10.
    const rules = {
      complexity: ["error", { max: 1 }],
    };

    const overrideConfig = [
      {
        files: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: "module",
        },
        rules,
      },
    ];

    if (tsParser) {
      overrideConfig.push({
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
          parser: tsParser,
          ecmaVersion: 2022,
          sourceType: "module",
          parserOptions: {
            ecmaFeatures: { jsx: true },
          },
        },
        rules,
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

    const allFiles = await findFiles(repoPath, extensions);
    const files = allFiles.slice(0, MAX_FILES);

    results.fileCount = files.length;
    if (allFiles.length > MAX_FILES) {
      results.skipped = true;
    }

    if (files.length === 0) return results;

    const lintResults = await eslint.lintFiles(files);

    let totalComplexity = 0;
    let funcCount = 0;
    let highCount = 0;

    lintResults.forEach((result) => {
      const messages = result.messages.filter(
        (msg) => msg.ruleId === "complexity",
      );

      messages.forEach((msg) => {
        const match = msg.message.match(/complexity of (\d+)/);
        if (!match) return;

        const complexity = parseInt(match[1], 10);
        if (!Number.isFinite(complexity) || complexity <= 0) return;

        const functionName =
          msg.message.match(/Function '([^']+)'/)?.[1] ||
          (msg.message.includes("Arrow function") ? "arrow" : "anonymous");

        results.functions.push({
          file: path.relative(repoPath, result.filePath),
          functionName,
          line: msg.line,
          complexity,
        });

        totalComplexity += complexity;
        funcCount++;

        if (complexity > results.maxComplexity) {
          results.maxComplexity = complexity;
        }
        if (complexity > HIGH_COMPLEXITY_THRESHOLD) {
          highCount++;
        }
      });
    });

    results.functionCount = funcCount;
    results.highComplexityCount = highCount;
    results.averageComplexity =
      funcCount > 0 ? Math.round((totalComplexity / funcCount) * 10) / 10 : 0;

    // Maintainability index approximation. The classic McCabe/Halstead MI is
    //   171 - 5.2*ln(HV) - 0.23*CC - 16.2*ln(LOC)
    // We don't have Halstead Volume or LOC easily, so use a piecewise curve
    // over average cyclomatic complexity that maps to a 0-100 range.
    const avg = results.averageComplexity;
    let mi;
    if (avg <= 2) mi = 100;
    else if (avg <= 4) mi = 100 - (avg - 2) * 3; //    2→100,  4→94
    else if (avg <= 8) mi = 94 - (avg - 4) * 4; //     4→94,   8→78
    else if (avg <= 15) mi = 78 - (avg - 8) * 3; //    8→78,  15→57
    else if (avg <= 25) mi = 57 - (avg - 15) * 2; //  15→57,  25→37
    else mi = Math.max(0, 37 - (avg - 25)); //        25→37,  descending
    results.maintainability = Math.round(Math.max(0, Math.min(100, mi)));

    // Sort by complexity descending, keep the top N for the report.
    results.functions.sort((a, b) => b.complexity - a.complexity);
    results.functions = results.functions.slice(0, MAX_FUNCTIONS_IN_REPORT);

    return results;
  } catch (err) {
    console.error("Complexity scan error:", err.message);
    return results;
  }
}

async function findFiles(dir, extensions) {
  const results = [];
  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      const nested = await findFiles(fullPath, extensions);
      results.push(...nested);
    } else if (entry.isFile()) {
      if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }

  return results;
}