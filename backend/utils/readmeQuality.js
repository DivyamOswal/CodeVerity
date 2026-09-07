// backend/utils/readmeQuality.js
import fs from "fs";
import path from "path";

export function scoreReadme(repoPath) {
  const readmePath = path.join(repoPath, "README.md");
  if (!fs.existsSync(readmePath)) {
    return { score: 0, details: "README file missing" };
  }

  const content = fs.readFileSync(readmePath, "utf-8");
  const sections = {
    title: /^#\s+.+/m,
    description: /^##?\s*(?:Overview|Description|About)/m,
    installation: /^##?\s*(?:Installation|Setup|Getting Started)/m,
    usage: /^##?\s*(?:Usage|How to use)/m,
    api: /^##?\s*(?:API|Endpoints|Methods)/m,
    contributing: /^##?\s*(?:Contributing|Development)/m,
    license: /^##?\s*(?:License|MIT|Apache|GPL)/m,
  };

  let score = 0;
  const found = {};
  for (const [key, regex] of Object.entries(sections)) {
    if (regex.test(content)) {
      score += 15; // 15 points per section
      found[key] = true;
    }
  }

  // Bonus for code blocks
  const codeBlocks = (content.match(/```/g) || []).length;
  if (codeBlocks > 1) score += 10;

  // Bonus for length
  const lines = content.split("\n").length;
  if (lines > 50) score += 10;

  // Cap at 100
  const finalScore = Math.min(100, score);

  return {
    score: finalScore,
    details: {
      sectionsFound: found,
      lines: lines,
      codeBlocks: codeBlocks,
      missingSections: Object.keys(sections).filter(key => !found[key]),
    },
  };
}