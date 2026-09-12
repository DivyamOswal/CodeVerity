// backend/utils/complexity.js
import { ESLint } from "eslint";
import path from "path";
import fs from "fs";

export async function getComplexity(repoPath) {
  const results = {
    functions: [],
    maxComplexity: 0,
    averageComplexity: 0,
    maintainability: 0,
  };

  try {
    // Use ESLint to analyze JS/TS files
    const eslint = new ESLint({
      overrideConfigFile: null,
      baseConfig: {
        parserOptions: { ecmaVersion: 2020, sourceType: "module" },
        rules: {
          complexity: ["error", { max: 10 }],
        },
      },
      overrideConfig: {
        rules: {
          complexity: ["error", { max: 10 }],
        },
      },
    });

    const files = await findFiles(repoPath, [".js", ".jsx", ".ts", ".tsx"]);
    if (files.length === 0) return results;

    const lintResults = await eslint.lintFiles(files);

    let totalComplexity = 0;
    let funcCount = 0;

    lintResults.forEach((result) => {
      const messages = result.messages.filter((msg) => msg.ruleId === "complexity");
      messages.forEach((msg) => {
        // Extract line and complexity value (e.g., "Function 'foo' has a complexity of 15")
        const match = msg.message.match(/complexity of (\d+)/);
        if (match) {
          const complexity = parseInt(match[1], 10);
          const functionName = msg.message.match(/Function '([^']+)'/)?.[1] || "anonymous";
          results.functions.push({
            file: path.relative(repoPath, result.filePath),
            functionName,
            line: msg.line,
            complexity,
          });
          totalComplexity += complexity;
          funcCount++;
          if (complexity > results.maxComplexity) results.maxComplexity = complexity;
        }
      });
    });

    results.averageComplexity = funcCount > 0 ? Math.round(totalComplexity / funcCount) : 0;
    // Maintainability index: 100 - (avg complexity * 5) – rough estimate
    results.maintainability = Math.max(0, Math.min(100, 100 - results.averageComplexity * 5));

    return results;
  } catch (err) {
    console.error("Complexity scan error:", err);
    return results;
  }
}

async function findFiles(dir, extensions) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      results.push(...await findFiles(fullPath, extensions));
    } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}
