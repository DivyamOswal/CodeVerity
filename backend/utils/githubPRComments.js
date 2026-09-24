// backend/utils/githubPRComments.js
/**
 * Compute the set of line numbers in a patch that GitHub will accept an
 * inline review comment on. Lines that are outside the diff's hunks
 * cannot be commented on — GitHub returns 422.
 *
 * Patch format:
 *   @@ -oldStart,oldCount +newStart,newCount @@
 *    context line
 *   -removed line
 *   +added line
 *
 * For RIGHT-side comments, a line is commentable if it's either a
 * context line or an added line. The line number is its position in
 * the NEW file.
 */
function extractCommentableLines(patch) {
  if (!patch) return null;
  const lines = new Set();
  let newLineNum = 0;

  for (const raw of patch.split("\n")) {
    if (raw.startsWith("@@")) {
      const m = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) newLineNum = parseInt(m[1], 10);
      continue;
    }

    if (raw.startsWith("+")) {
      lines.add(newLineNum);
      newLineNum++;
    } else if (raw.startsWith("-")) {
      // Removed line — doesn't exist in the new file.
    } else if (raw.startsWith(" ")) {
      lines.add(newLineNum);
      newLineNum++;
    }
    // Lines like "\ No newline at end of file" are skipped.
  }
  return lines;
}

function severityEmoji(sev) {
  return (
    { critical: "🔴", high: "🟠", medium: "🟡", low: "🔵", info: "⚪" }[
      String(sev || "").toLowerCase()
    ] || "⚪"
  );
}

function formatCommentBody(finding, reportUrl) {
  const lines = [];
  lines.push(`### ${severityEmoji(finding.severity)} ${finding.title || "Issue"}`);
  lines.push("");
  lines.push(
    `**Severity:** ${finding.severity || "medium"} · **Category:** ${finding.category || "general"}`,
  );
  lines.push("");

  if (finding.description) {
    lines.push(finding.description);
    lines.push("");
  }
  if (finding.whyItMatters) {
    lines.push(`> ${finding.whyItMatters}`);
    lines.push("");
  }
  if (finding.suggestedFix) {
    lines.push("**Suggested fix**");
    lines.push("```");
    lines.push(finding.suggestedFix);
    lines.push("```");
    lines.push("");
  }
  if (reportUrl) {
    lines.push("---");
    lines.push(`[View full report on CodeVerity](${reportUrl})`);
  }
  return lines.join("\n");
}

function formatSummaryBody(findings, reportUrl) {
  const lines = [];
  lines.push("## 🛡️ CodeVerity findings");
  lines.push("");
  lines.push(
    `${findings.length} finding${findings.length === 1 ? "" : "s"} couldn't be placed inline (the referenced lines aren't part of this PR's diff). Full list below.`,
  );
  lines.push("");

  const byFile = new Map();
  for (const f of findings) {
    const key = f.file || "General";
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key).push(f);
  }

  for (const [file, items] of byFile) {
    lines.push(`### \`${file}\``);
    lines.push("");
    for (const f of items) {
      const lineRef = f.line ? ` — line ${f.line}` : "";
      lines.push(`- ${severityEmoji(f.severity)} **${f.title}**${lineRef}`);
      if (f.description) {
        lines.push(`  <sub>${f.description}</sub>`);
      }
    }
    lines.push("");
  }

  if (reportUrl) {
    lines.push("---");
    lines.push(`[View full report on CodeVerity](${reportUrl})`);
  }
  return lines.join("\n");
}

/**
 * Post findings to a GitHub PR.
 *
 * Strategy:
 *   1. Fetch the PR diff → build a map of commentable line numbers.
 *   2. Route findings: those whose line is commentable go inline;
 *      everything else goes into a single summary comment.
 *   3. Post inline comments in ONE review call (one notification).
 *   4. If the batched review fails with 422, retry each comment
 *      individually and reroute failures to the summary.
 */
export async function postFindingsToPR({
  octokit,
  owner,
  repo,
  pullNumber,
  findings,
  reportUrl,
  severityThreshold = ["critical", "high"],
}) {
  // ── 1. Fetch the changed files and their patches ──
  const files = await octokit.paginate(octokit.pulls.listFiles, {
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });

  const commentableByFile = new Map();
  for (const f of files) {
    if (f.status === "removed") continue;
    const set = extractCommentableLines(f.patch);
    if (set) commentableByFile.set(f.filename, set);
  }

  // ── 2. Route each finding ──
  const threshold = new Set(severityThreshold.map((s) => s.toLowerCase()));
  const inlineCandidates = [];
  const summaryFindings = [];
  let skipped = 0;

  for (const f of findings) {
    const sev = String(f.severity || "medium").toLowerCase();
    if (!threshold.has(sev)) {
      skipped++;
      continue;
    }

    const fileLines = commentableByFile.get(f.file);
    const canInline =
      fileLines && typeof f.line === "number" && fileLines.has(f.line);

    if (canInline) {
      inlineCandidates.push({
        path: f.file,
        line: f.line,
        side: "RIGHT",
        body: formatCommentBody(f, reportUrl),
        __finding: f,
      });
    } else {
      summaryFindings.push(f);
    }
  }

  // ── 3. Post the batched review ──
  let reviewUrl = null;
  let inlinePosted = 0;

  if (inlineCandidates.length > 0) {
    const body = `**CodeVerity** found ${inlineCandidates.length} issue${
      inlineCandidates.length === 1 ? "" : "s"
    } in this PR.`;

    try {
      const review = await octokit.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        event: "COMMENT",
        body,
        comments: inlineCandidates.map((c) => ({
          path: c.path,
          line: c.line,
          side: c.side,
          body: c.body,
        })),
      });
      reviewUrl = review.data.html_url;
      inlinePosted = inlineCandidates.length;
    } catch (err) {
      // 422 → one of the comments has a line GitHub rejects. Fall back
      // to posting each individually so a single bad one doesn't kill
      // the whole batch.
      if (err.status === 422 && inlineCandidates.length > 1) {
        for (const c of inlineCandidates) {
          try {
            await octokit.pulls.createReviewComment({
              owner,
              repo,
              pull_number: pullNumber,
              path: c.path,
              line: c.line,
              side: c.side,
              body: c.body,
            });
            inlinePosted++;
          } catch {
            summaryFindings.push(c.__finding);
          }
        }
      } else {
        // Can't recover — push all inline candidates into the summary.
        for (const c of inlineCandidates) summaryFindings.push(c.__finding);
      }
    }
  }

  // ── 4. Post the summary comment ──
  let summaryUrl = null;
  if (summaryFindings.length > 0) {
    const summary = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: formatSummaryBody(summaryFindings, reportUrl),
    });
    summaryUrl = summary.data.html_url;
  }

  return {
    inlineCount: inlinePosted,
    summaryCount: summaryFindings.length,
    skippedCount: skipped,
    reviewUrl: reviewUrl || summaryUrl,
  };
}   