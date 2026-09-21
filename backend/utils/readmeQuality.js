// backend/utils/readmeQuality.js
import fs from "fs/promises";
import path from "path";

// Try common README filenames. GitHub is case-insensitive on the web UI
// but the filesystem isn't, so we have to check each explicitly.
const README_CANDIDATES = [
  "README.md",
  "Readme.md",
  "readme.md",
  "README.MD",
  "README.markdown",
  "README.rst",
  "README.txt",
];

const MAX_README_BYTES = 500_000; // 500 KB is way more than any real README

// Human-readable section labels used both for scoring and for the frontend.
const SECTIONS = {
  title:          { label: "Title",          re: /^#\s+\S/m },
  description:    { label: "Description",    re: /^##?\s*(?:overview|description|about|introduction)\b/im },
  installation:   { label: "Installation",   re: /^##?\s*(?:installation|install|setup|getting started|quick start)\b/im },
  usage:          { label: "Usage",          re: /^##?\s*(?:usage|how to use|how it works|example|examples)\b/im },
  api:            { label: "API",            re: /^##?\s*(?:api|endpoints|methods|reference)\b/im },
  contributing:   { label: "Contributing",   re: /^##?\s*(?:contributing|development|dev setup|building)\b/im },
  license:        { label: "License",        re: /^##?\s*(?:license|licence|mit|apache|gpl|bsd|unlicense)\b/im },
};

async function findReadme(repoPath) {
  for (const name of README_CANDIDATES) {
    const full = path.join(repoPath, name);
    try {
      const stat = await fs.stat(full);
      if (stat.isFile()) return { path: full, name, size: stat.size };
    } catch {
      // keep looking
    }
  }
  return null;
}

export async function scoreReadme(repoPath) {
  const readme = await findReadme(repoPath);

  if (!readme) {
    return {
      score: 0,
      details: {
        found: false,
        fileName: null,
        sectionsFound: {},
        missingSections: Object.values(SECTIONS).map((s) => s.label),
        lines: 0,
        codeBlocks: 0,
        message: "No README file found",
      },
    };
  }

  if (readme.size > MAX_README_BYTES) {
    return {
      score: 0,
      details: {
        found: true,
        fileName: readme.name,
        sectionsFound: {},
        missingSections: Object.values(SECTIONS).map((s) => s.label),
        lines: 0,
        codeBlocks: 0,
        message: `README exceeds ${Math.round(MAX_README_BYTES / 1000)} KB  skipping`,
      },
    };
  }

  let content;
  try {
    content = await fs.readFile(readme.path, "utf-8");
  } catch (err) {
    return {
      score: 0,
      details: {
        found: true,
        fileName: readme.name,
        sectionsFound: {},
        missingSections: Object.values(SECTIONS).map((s) => s.label),
        lines: 0,
        codeBlocks: 0,
        message: `Failed to read README: ${err.message}`,
      },
    };
  }

  // ─── Sections ────────────────────────────────────────────
  const found = {};
  const missing = [];
  for (const [key, { label, re }] of Object.entries(SECTIONS)) {
    if (re.test(content)) {
      found[key] = label;
    } else {
      missing.push(label);
    }
  }

  const sectionCount = Object.keys(found).length;

  // 12 points per section, max 84 from sections
  let score = sectionCount * 12;

  // ─── Code block bonus (max 8) ────────────────────────────
  const codeBlocks = (content.match(/```/g) || []).length;
  const pairedCodeBlocks = Math.floor(codeBlocks / 2);
  if (pairedCodeBlocks >= 1) score += 4;
  if (pairedCodeBlocks >= 3) score += 4;

  // ─── Length bonus (max 8) ────────────────────────────────
  const lines = content.split("\n").length;
  if (lines >= 30) score += 4;
  if (lines >= 80) score += 4;

  // ─── Link bonus (max 4) ──────────────────────────────────
  const links = (content.match(/\[[^\]]+\]\([^)]+\)/g) || []).length;
  if (links >= 3) score += 4;

  const finalScore = Math.min(100, Math.round(score));

  return {
    score: finalScore,
    details: {
      found: true,
      fileName: readme.name,
      sectionsFound: found,
      missingSections: missing,
      sectionCount,
      totalSections: Object.keys(SECTIONS).length,
      lines,
      codeBlocks: pairedCodeBlocks,
      links,
      // Human-readable summary the frontend can render directly
      summary:
        missing.length === 0
          ? "All key sections present"
          : `${sectionCount}/${Object.keys(SECTIONS).length} sections, missing: ${missing.join(", ")}`,
    },
  };
}