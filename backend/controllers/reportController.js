// backend/controllers/reportController.js
import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import Report from "../models/Report.js";
import User from "../models/User.js";
import WorkSpace from "../models/WorkSpace.js";
import { addAuditLog } from "./workspaceController.js";

// ─── Project theme palette (dark, violet accent) ──────────────
const THEME = {
  // Backgrounds (matches --bg-primary / --bg-card in the app)
  bgPrimary: "#0b0b12",
  bgCard: "#14141d",
  bgElevated: "#1c1c28",
  // Text
  textPrimary: "#f4f4f6",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  // Borders
  border: "#27272a",
  borderSoft: "#1f1f28",
  // Semantic
  red: "#ef4444",
  redSoft: "rgba(239, 68, 68, 0.15)",
  orange: "#f59e0b",
  orangeSoft: "rgba(245, 158, 11, 0.15)",
  yellow: "#facc15",
  green: "#22c55e",
  greenSoft: "rgba(34, 197, 94, 0.15)",
  blue: "#3b82f6",
  blueSoft: "rgba(59, 130, 246, 0.15)",
  // Accent (violet matches --accent)
  accent: "#a855f7",
  accentSoft: "rgba(168, 85, 247, 0.15)",
  accentStrong: "rgba(168, 85, 247, 0.35)",
  // Base
  white: "#ffffff",
};

const FALLBACK_ACCENT_RGB = { r: 168, g: 85, b: 247 }; // violet

// ─── Helper: hex → RGB (handles #fff, #ffffff, and invalid) ────
function hexToRgb(hex) {
  if (!hex || typeof hex !== "string") return FALLBACK_ACCENT_RGB;

  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6) return FALLBACK_ACCENT_RGB;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : FALLBACK_ACCENT_RGB;
}

// ─── Build theme-aware color palette from a user's accent ─────
function getThemeColors(accentHex) {
  const accent = accentHex || THEME.accent;
  const rgb = hexToRgb(accent);
  return {
    ...THEME,
    accent,
    accentSoft: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
    accentStrong: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`,
    accentDim: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`,
  };
}

// ─── Hoisted chart canvases (avoid per-request startup cost) ───
const radarCanvas = new ChartJSNodeCanvas({
  width: 500,
  height: 500,
  backgroundColour: THEME.bgPrimary,
});
const healthCanvas = new ChartJSNodeCanvas({
  width: 220,
  height: 220,
  backgroundColour: THEME.bgPrimary,
});

// ─── Paint a dark page background ──────────────────────────────
// PDFKit doesn't repaint on addPage, so we call this after every
// addPage(). It draws a full-bleed rect in the theme background.
function paintPageBackground(doc, color) {
  const { width, height } = doc.page;
  doc.save();
  doc.rect(0, 0, width, height).fill(color);
  doc.restore();
}

// ─── Draw the CodeVerity shield logo (vector, no image) ────────
function drawShieldLogo(doc, x, y, size, color) {
  const w = size;
  const h = size * 1.15;
  const halfW = w / 2;

  doc.save();

  // Shield silhouette
  doc.fillColor(color);
  doc
    .path(
      `M ${x + w * 0.1} ${y + h * 0.18} ` +
        `L ${x + w * 0.9} ${y + h * 0.05} ` +
        `L ${x + w * 0.9} ${y + h * 0.55} ` +
        `C ${x + w * 0.9} ${y + h * 0.82}, ${x + w * 0.7} ${y + h * 0.95}, ${x + halfW} ${y + h} ` +
        `C ${x + w * 0.3} ${y + h * 0.95}, ${x + w * 0.1} ${y + h * 0.82}, ${x + w * 0.1} ${y + h * 0.55} ` +
        `Z`,
    )
    .fill();

  // Checkmark
  doc
    .strokeColor(THEME.bgPrimary)
    .lineWidth(size * 0.13)
    .lineCap("round")
    .lineJoin("round")
    .moveTo(x + w * 0.3, y + h * 0.5)
    .lineTo(x + w * 0.45, y + h * 0.65)
    .lineTo(x + w * 0.72, y + h * 0.32)
    .stroke();

  doc.restore();
}

// ─── Helper: Ensure user has a workspace ──────────────────────
async function ensureWorkspace(user) {
  if (user.workspaceId) {
    const existing = await WorkSpace.findById(user.workspaceId);
    if (existing) return existing;
  }
  const newWorkspace = await WorkSpace.create({
    name: `${user.name}'s Workspace`,
    ownerId: user._id,
    members: [{ userId: user._id, role: "owner" }],
  });
  user.workspaceId = newWorkspace._id;
  user.role = "owner";
  await user.save();
  return newWorkspace;
}

// ─── Helper: Atomic scan-counter increment ─────────────────────
async function incrementWorkspaceScans(workspaceId) {
  try {
    await WorkSpace.findByIdAndUpdate(workspaceId, {
      $inc: { totalScans: 1 },
    });
  } catch (err) {
    console.error("Failed to increment workspace scans:", err);
  }
}

// ─── Access-control helper ────────────────────────────────────
async function loadReportWithAccess(reportId, requestingUserId) {
  const report = await Report.findById(reportId);
  if (!report) return { error: "not_found" };

  const user = await User.findById(requestingUserId);
  if (!user) return { error: "unauthorized" };

  const workspace = await ensureWorkspace(user);

  if (
    !report.workspaceId ||
    report.workspaceId.toString() !== workspace._id.toString()
  ) {
    return { error: "not_found" };
  }

  const member = workspace.members.find(
    (m) => m.userId.toString() === user._id.toString(),
  );
  if (!member) return { error: "not_found" };

  const isPrivileged = member.role === "owner" || member.role === "admin";
  const isOwnerOfReport = report.userId.toString() === user._id.toString();

  if (!isPrivileged && !isOwnerOfReport) {
    return { error: "not_found" };
  }

  return { report, user, workspace, member };
}

// ─── Build the list-scope filter for a workspace member ────────
function buildListFilter(workspace, member, userId) {
  const isPrivileged = member.role === "owner" || member.role === "admin";

  if (isPrivileged) {
    return {
      $or: [
        { workspaceId: workspace._id },
        { workspaceId: { $exists: false }, userId },
      ],
    };
  }

  return { userId };
}

// ─── PDF Helpers ───────────────────────────────────────────────

// Section title with a vertical accent bar + horizontal rule.
function sectionTitle(doc, title, COLORS) {
  const x = 50;
  const y = doc.y;

  // Accent bar (4px wide, ~20px tall)
  doc.save();
  doc.rect(x, y + 2, 3, 18).fill(COLORS.accent);
  doc.restore();

  // Title text next to the bar
  doc
    .fontSize(15)
    .fillColor(COLORS.textPrimary)
    .text(title, x + 14, y, { width: 480 });

  doc.moveDown(0.35);

  // Thin underline
  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.8)
    .moveTo(x, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(0.8);
}

// Horizontal score bar in the accent color
function drawScoreBar(doc, label, value, color, COLORS) {
  const x = 50;
  const y = doc.y;
  const barWidth = 300;
  const barHeight = 10;

  doc
    .fontSize(11)
    .fillColor(COLORS.textSecondary)
    .text(`${label}`, x, y);

  doc
    .fontSize(11)
    .fillColor(COLORS.textPrimary)
    .text(`${value}%`, x + barWidth - 40, y, { width: 40, align: "right" });

  doc.moveDown(0.35);

  // Track
  doc.save();
  doc.rect(x, doc.y, barWidth, barHeight).fill(COLORS.bgElevated);
  doc.restore();

  // Fill
  const fillWidth = Math.min((value / 100) * barWidth, barWidth);
  if (fillWidth > 0) {
    doc.save();
    doc.rect(x, doc.y, fillWidth, barHeight).fill(color);
    doc.restore();
  }

  doc.moveDown(1.1);
}

// Dark-themed table
function drawTable(doc, headers, rows, columnWidths, COLORS) {
  const startX = 50;
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  let y = doc.y;
  const rowHeight = 22;

  // Header background
  doc.save();
  doc.rect(startX - 6, y - 4, totalWidth + 12, rowHeight).fill(COLORS.bgElevated);
  doc.restore();

  doc.fontSize(9).fillColor(COLORS.accent);
  headers.forEach((h, i) => {
    const x = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(h.toUpperCase(), x, y + 2, { width: columnWidths[i], align: "left" });
  });
  y += rowHeight;

  // Rows
  doc.fontSize(9).fillColor(COLORS.textPrimary);
  rows.forEach((row, rowIdx) => {
    if (y > 760) {
      doc.addPage();
      paintPageBackground(doc, COLORS.bgPrimary);
      y = 50;
    }

    // Alternating row background
    if (rowIdx % 2 === 1) {
      doc.save();
      doc.rect(startX - 6, y, totalWidth + 12, rowHeight).fill(COLORS.bgCard);
      doc.restore();
    }

    row.forEach((cell, i) => {
      const x = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc
        .fillColor(COLORS.textPrimary)
        .text(String(cell || "—"), x, y + 5, {
          width: columnWidths[i] - 4,
          align: "left",
          lineBreak: false,
          ellipsis: true,
        });
    });
    y += rowHeight;

    doc
      .strokeColor(COLORS.borderSoft)
      .lineWidth(0.5)
      .moveTo(startX - 6, y)
      .lineTo(startX + totalWidth + 6, y)
      .stroke();
  });
  doc.moveDown(0.6);
}

// Severity badge returns hex color for a given severity string
function severityColor(severity, COLORS) {
  const s = String(severity || "").toLowerCase();
  if (s === "critical") return COLORS.red;
  if (s === "high") return COLORS.red;
  if (s === "medium") return COLORS.orange;
  if (s === "low") return COLORS.blue;
  return COLORS.textMuted;
}

// Footer with page number and brand on every page
function addPageFooter(doc, pageNum, COLORS) {
  const bottom = doc.page.height - 30;
  doc
    .fontSize(8)
    .fillColor(COLORS.textMuted)
    .text(`CodeVerity · AI Code Audit`, 50, bottom, { width: 200 });
  doc
    .fillColor(COLORS.textMuted)
    .text(`${pageNum}`, 495, bottom, { width: 50, align: "right" });
}

// ─── CREATE REPORT ─────────────────────────────────────────────
export const createReport = async (req, res) => {
  try {
    const { repoUrl, analysis, sourceCode } = req.body;
    if (!repoUrl || !analysis) {
      return res
        .status(400)
        .json({ error: "repoUrl and analysis are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const report = new Report({
      userId: user._id,
      workspaceId: workspace._id,
      repoUrl,
      summary: analysis.summary || "",
      architecture: analysis.architecture || [],
      bugs: analysis.bugs || [],
      securityIssues: analysis.securityIssues || [],
      futureRoadmap: analysis.futureRoadmap || [],
      toolsAndPackages: analysis.toolsAndPackages || [],
      scores: analysis.scores || {},
      grade: analysis.grade || "N/A",
      finalVerdict: analysis.finalVerdict || "",
      _sourceCode: sourceCode || "",
      healthScore: analysis.healthScore || null,
      securityVulnerabilities: analysis.securityVulnerabilities || [],
      dependencyVulnerabilities: analysis.dependencyVulnerabilities || [],
      secrets: analysis.secrets || [],
      techDebt: analysis.techDebt || null,
      architectureGraph: analysis.architectureGraph || null,
    });

    await report.save();
    await incrementWorkspaceScans(workspace._id);

    await addAuditLog(
      workspace._id,
      user._id,
      "scan",
      `Scanned repository: ${repoUrl}`,
      { repoUrl, reportId: report._id },
    );

    res.status(201).json({
      success: true,
      reportId: report._id,
      report,
    });
  } catch (err) {
    console.error("Create report error:", err);
    res.status(500).json({ error: "Failed to create report" });
  }
};

// ─── GET REPORTS (history, paginated) ──────────────────────────
export const getReports = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);

    const member = workspace.members.find(
      (m) => m.userId.toString() === user._id.toString(),
    );
    if (!member) {
      return res.status(403).json({ error: "Not a workspace member" });
    }

    const filter = buildListFilter(workspace, member, user._id);

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .select("-sourceCode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("Get reports error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

// ─── GET SINGLE REPORT ─────────────────────────────────────────
export const getReport = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await loadReportWithAccess(id, req.user.id);
    if (result.error === "unauthorized") {
      return res.status(401).json({ error: "User not found" });
    }
    if (result.error === "not_found") {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ success: true, report: result.report });
  } catch (err) {
    console.error("Get report error:", err);
    res.status(500).json({ error: "Failed to fetch report" });
  }
};

// ─── DELETE REPORT ─────────────────────────────────────────────
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await loadReportWithAccess(id, req.user.id);
    if (result.error === "unauthorized") {
      return res.status(401).json({ error: "User not found" });
    }
    if (result.error === "not_found") {
      return res.status(404).json({ error: "Report not found" });
    }

    const { report, user, workspace, member } = result;

    const isPrivileged = member.role === "owner" || member.role === "admin";
    const isOwner = report.userId.toString() === user._id.toString();
    if (!isPrivileged && !isOwner) {
      return res.status(404).json({ error: "Report not found" });
    }

    await report.deleteOne();

    try {
      await WorkSpace.findByIdAndUpdate(workspace._id, {
        $inc: { totalScans: -1 },
      });
    } catch (err) {
      console.error("Failed to decrement totalScans:", err);
    }

    await addAuditLog(
      workspace._id,
      user._id,
      "report_delete",
      `Deleted report for ${report.repoUrl}`,
      { reportId: report._id },
    );

    res.json({ success: true, message: "Report deleted" });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ error: "Failed to delete report" });
  }
};

// ─── DOWNLOAD PDF ──────────────────────────────────────────────
export const downloadReportPDF = async (req, res) => {
  let result;
  try {
    result = await loadReportWithAccess(req.params.id, req.user.id);
  } catch (err) {
    console.error("PDF access check error:", err);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }

  if (result.error === "unauthorized") {
    return res.status(401).json({ error: "User not found" });
  }
  if (result.error === "not_found") {
    return res.status(404).json({ error: "Report not found" });
  }

  const { report, user, workspace } = result;

  try {
    // Prefer the user's accent if they've customised it, otherwise
    // use the project's theme accent (violet).
    const COLORS = getThemeColors(user.accentColor || THEME.accent);

    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      bufferPages: true, // needed to add footers after all pages are written
      info: {
        Title: `CodeVerity Audit ${report.repoUrl}`,
        Author: "CodeVerity",
        Subject: "AI-Powered Code Audit Report",
      },
    });

    const repoName = (report.repoUrl.split("/").pop() || "report").replace(
      /[^a-zA-Z0-9._-]/g,
      "_",
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${repoName}-AI-Code-Audit.pdf"`,
    );

    doc.pipe(res);

    // Paint dark background on the first page + every page added after.
    paintPageBackground(doc, COLORS.bgPrimary);
    doc.on("pageAdded", () => paintPageBackground(doc, COLORS.bgPrimary));

    // ═══════════════════════════════════════════════════════
    //  COVER PAGE
    // ═══════════════════════════════════════════════════════
    const pageWidth = doc.page.width;

    // Top accent strip
    doc.save();
    doc.rect(0, 0, pageWidth, 4).fill(COLORS.accent);
    doc.restore();

    // Logo + wordmark
    const logoX = (pageWidth - 64) / 2;
    drawShieldLogo(doc, logoX, 110, 64, COLORS.accent);

    doc
      .fontSize(26)
      .fillColor(COLORS.textPrimary)
      .text("CodeVerity", 0, 200, { align: "center", width: pageWidth });

    doc
      .fontSize(9)
      .fillColor(COLORS.accent)
      .text("AI-POWERED CODE INTELLIGENCE", 0, 232, {
        align: "center",
        width: pageWidth,
        characterSpacing: 2,
      });

    // Divider
    doc
      .strokeColor(COLORS.border)
      .lineWidth(0.8)
      .moveTo(pageWidth / 2 - 100, 262)
      .lineTo(pageWidth / 2 + 100, 262)
      .stroke();

    // Report title
    doc
      .fontSize(20)
      .fillColor(COLORS.textPrimary)
      .text("Code Audit Report", 0, 290, { align: "center", width: pageWidth });

    // Grade badge large circle with letter
    const gradeY = 370;
    const gradeR = 46;
    const gradeCx = pageWidth / 2;

    doc.save();
    doc
      .circle(gradeCx, gradeY, gradeR)
      .fillAndStroke(COLORS.accentSoft, COLORS.accent);
    doc.restore();

    const grade = (report.grade || "N/A").toString();
    doc
      .fontSize(grade.length > 2 ? 28 : 40)
      .fillColor(COLORS.accent)
      .text(grade, gradeCx - gradeR, gradeY - 20, {
        width: gradeR * 2,
        align: "center",
      });

    doc
      .fontSize(9)
      .fillColor(COLORS.textMuted)
      .text("OVERALL GRADE", 0, gradeY + gradeR + 12, {
        align: "center",
        width: pageWidth,
        characterSpacing: 1.5,
      });

    // Repo + metadata card
    const cardY = 520;
    const cardW = pageWidth - 120;
    const cardX = 60;

    doc.save();
    doc
      .roundedRect(cardX, cardY, cardW, 120, 8)
      .fillAndStroke(COLORS.bgCard, COLORS.border);
    doc.restore();

    doc
      .fontSize(8)
      .fillColor(COLORS.textMuted)
      .text("REPOSITORY", cardX + 20, cardY + 20, {
        characterSpacing: 1.5,
      });
    doc
      .fontSize(11)
      .fillColor(COLORS.textPrimary)
      .text(report.repoUrl, cardX + 20, cardY + 36, {
        width: cardW - 40,
        link: report.repoUrl,
        underline: false,
      });

    // Generated date
    doc
      .fontSize(8)
      .fillColor(COLORS.textMuted)
      .text("GENERATED", cardX + 20, cardY + 70, {
        characterSpacing: 1.5,
      });
    doc
      .fontSize(11)
      .fillColor(COLORS.textPrimary)
      .text(new Date().toLocaleString(), cardX + 20, cardY + 86);

    // Confidential badge
    doc
      .fontSize(8)
      .fillColor(COLORS.textMuted)
      .text("CONFIDENTIAL FOR INTERNAL USE ONLY", 0, 740, {
        align: "center",
        width: pageWidth,
        characterSpacing: 1.2,
      });

    doc.addPage();

    // ═══════════════════════════════════════════════════════
    //  EXECUTIVE SUMMARY
    // ═══════════════════════════════════════════════════════
    sectionTitle(doc, "Executive Summary", COLORS);
    doc
      .fontSize(10.5)
      .fillColor(COLORS.textSecondary)
      .text(report.summary || "No summary available.", {
        align: "justify",
        lineGap: 3,
      });
    doc.moveDown(1.2);

    // ═══════════════════════════════════════════════════════
    //  ARCHITECTURE REVIEW
    // ═══════════════════════════════════════════════════════
    if (report.architecture?.length) {
      sectionTitle(doc, "Architecture Review", COLORS);
      report.architecture.forEach((a) => {
        doc
          .fontSize(11)
          .fillColor(COLORS.accent)
          .text(`${a.component || "Component"}`, { continued: true })
          .fontSize(10.5)
          .fillColor(COLORS.textSecondary)
          .text(` ${a.recommendation || a.description || ""}`, {
            lineGap: 2,
          });
        doc.moveDown(0.4);
      });
      doc.moveDown(0.8);
    }

    // ═══════════════════════════════════════════════════════
    //  QUALITY SCORES
    // ═══════════════════════════════════════════════════════
    sectionTitle(doc, "Quality Scores", COLORS);
    const scores = report.scores || {};
    drawScoreBar(doc, "Code Quality", scores.codeQuality || 0, COLORS.accent, COLORS);
    drawScoreBar(doc, "Security", scores.security || 0, COLORS.red, COLORS);
    drawScoreBar(doc, "Performance", scores.performance || 0, COLORS.blue, COLORS);
    drawScoreBar(doc, "Maintainability", scores.maintainability || 0, COLORS.green, COLORS);

    // Radar chart
    try {
      const chartImage = await generateRadarChart(scores, COLORS);
      doc.moveDown(0.5);
      const chartW = 320;
      const chartX = (doc.page.width - chartW) / 2;
      doc.image(chartImage, chartX, doc.y, { fit: [chartW, chartW] });
    } catch (chartErr) {
      console.error("Radar chart failed:", chartErr);
    }

    doc.addPage();

    // ═══════════════════════════════════════════════════════
    //  HEALTH SCORE
    // ═══════════════════════════════════════════════════════
    if (report.healthScore) {
      sectionTitle(doc, "Health Score", COLORS);

      const chartY = doc.y;

      try {
        const healthChart = await generateHealthChart(report.healthScore, COLORS);
        doc.image(healthChart, 50, chartY, { fit: [180, 180] });
      } catch (chartErr) {
        console.error("Health chart failed:", chartErr);
      }

      // Stats next to the chart
      const statX = 260;
      let statY = chartY + 10;

      doc
        .fontSize(28)
        .fillColor(COLORS.accent)
        .text(`${report.healthScore.overall || 0}`, statX, statY, {
          continued: true,
        })
        .fontSize(12)
        .fillColor(COLORS.textMuted)
        .text(" / 100");
      statY += 42;

      doc
        .fontSize(10)
        .fillColor(COLORS.textMuted)
        .text("GRADE", statX, statY, { characterSpacing: 1 });
      statY += 14;
      doc
        .fontSize(20)
        .fillColor(COLORS.accent)
        .text(report.healthScore.grade || "N/A", statX, statY);
      statY += 36;

      const breakdown = report.healthScore.breakdown || {};
      doc
        .fontSize(10)
        .fillColor(COLORS.textMuted)
        .text("BREAKDOWN", statX, statY, { characterSpacing: 1 });
      statY += 18;

      Object.entries(breakdown).forEach(([key, val]) => {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
        doc
          .fontSize(10)
          .fillColor(COLORS.textSecondary)
          .text(`${label}`, statX, statY, { continued: true })
          .fillColor(COLORS.textPrimary)
          .text(`  ${val}%`, { align: "right", width: 200 });
        statY += 16;
      });

      doc.y = Math.max(doc.y, chartY + 200);
      doc.moveDown(1);
    }

    // ═══════════════════════════════════════════════════════
    //  SECURITY VULNERABILITIES
    // ═══════════════════════════════════════════════════════
    if (report.securityVulnerabilities?.length) {
      sectionTitle(
        doc,
        `Security Vulnerabilities (${report.securityVulnerabilities.length})`,
        COLORS,
      );

      // Summary pills
      const counts = report.securityVulnerabilities.reduce((acc, v) => {
        const k = String(v.severity || "unknown").toLowerCase();
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {});

      let pillX = 50;
      const pillY = doc.y;
      Object.entries(counts).forEach(([sev, count]) => {
        const label = `${count} ${sev}`;
        const pillW = doc.widthOfString(label) + 20;
        doc.save();
        doc
          .roundedRect(pillX, pillY, pillW, 20, 10)
          .fill(severityColor(sev, COLORS) + "22");
        doc.restore();
        doc
          .fontSize(9)
          .fillColor(severityColor(sev, COLORS))
          .text(label, pillX, pillY + 6, { width: pillW, align: "center" });
        pillX += pillW + 8;
      });

      doc.y = pillY + 30;

      const headers = ["Severity", "Title", "File", "Line"];
      const colWidths = [70, 210, 140, 40];
      const rows = report.securityVulnerabilities.map((v) => [
        String(v.severity || "N/A").toUpperCase(),
        v.title || "",
        v.file || "—",
        v.line || "—",
      ]);
      drawTable(doc, headers, rows, colWidths, COLORS);
    }

    // ═══════════════════════════════════════════════════════
    //  DEPENDENCY VULNERABILITIES
    // ═══════════════════════════════════════════════════════
    if (report.dependencyVulnerabilities?.length) {
      sectionTitle(
        doc,
        `Dependency Vulnerabilities (${report.dependencyVulnerabilities.length})`,
        COLORS,
      );
      const headers = ["Package", "Version", "CVE", "Severity", "Fixed In"];
      const colWidths = [110, 60, 90, 70, 80];
      const rows = report.dependencyVulnerabilities.map((v) => [
        v.package || "—",
        v.version || "—",
        v.cve || "—",
        v.severity || "—",
        v.fixedIn || "—",
      ]);
      drawTable(doc, headers, rows, colWidths, COLORS);
    }

    // ═══════════════════════════════════════════════════════
    //  SECRETS
    // ═══════════════════════════════════════════════════════
    if (report.secrets?.length) {
      sectionTitle(doc, `Detected Secrets (${report.secrets.length})`, COLORS);
      report.secrets.forEach((s, i) => {
        doc
          .fontSize(10.5)
          .fillColor(COLORS.textPrimary)
          .text(`${i + 1}. `, { continued: true })
          .fillColor(COLORS.red)
          .text(`${s.pattern || "Unknown"}`, { continued: true })
          .fillColor(COLORS.textSecondary)
          .text(`  ${s.file || "—"} (line ${s.line || "?"})`);
        doc
          .fontSize(9)
          .fillColor(COLORS.textMuted)
          .text(`   Confidence: ${s.confidence || 0}%`);
        doc.moveDown(0.3);
      });
      doc.moveDown(0.8);
    }

    // ═══════════════════════════════════════════════════════
    //  TECHNICAL DEBT
    // ═══════════════════════════════════════════════════════
    if (report.techDebt) {
      sectionTitle(doc, "Technical Debt", COLORS);
      const techDebt = report.techDebt;

      // Big hours display
      doc.save();
      doc
        .roundedRect(50, doc.y, 200, 60, 8)
        .fillAndStroke(COLORS.accentSoft, COLORS.accentStrong);
      doc.restore();

      const hoursY = doc.y;
      doc
        .fontSize(26)
        .fillColor(COLORS.accent)
        .text(`${techDebt.estimatedHours || 0}h`, 70, hoursY + 10);
      doc
        .fontSize(8)
        .fillColor(COLORS.textMuted)
        .text("ESTIMATED EFFORT", 70, hoursY + 42, { characterSpacing: 1.2 });

      doc.y = hoursY + 70;

      if (techDebt.issues?.length) {
        const headers = ["#", "Description", "Severity", "Effort"];
        const colWidths = [30, 260, 80, 60];
        const rows = techDebt.issues.map((issue, i) => [
          String(i + 1),
          issue.description || "—",
          String(issue.severity || "low").toUpperCase(),
          `${issue.effort || 0}h`,
        ]);
        drawTable(doc, headers, rows, colWidths, COLORS);
      }
    }

    // ═══════════════════════════════════════════════════════
    //  ARCHITECTURE GRAPH
    // ═══════════════════════════════════════════════════════
    if (report.architectureGraph?.nodes?.length) {
      doc.addPage();
      sectionTitle(doc, "Architecture Graph", COLORS);
      const graph = report.architectureGraph;

      doc
        .fontSize(10)
        .fillColor(COLORS.textMuted)
        .text(`NODES (${graph.nodes.length})`, { characterSpacing: 1.2 });
      doc.moveDown(0.4);

      // Node chips in a flowing layout
      const chipFontSize = 8.5;
      doc.fontSize(chipFontSize);

      let cx = 50;
      let cy = doc.y;
      const maxX = 545;
      const chipH = 20;
      const chipPad = 5;

      graph.nodes.forEach((node) => {
        const label = node.label || node.id || "node";
        const textW = doc.widthOfString(label);
        const chipW = textW + chipPad * 2 + 4;

        if (cx + chipW > maxX) {
          cx = 50;
          cy += chipH + 6;
        }

        if (cy + chipH > 780) {
          doc.addPage();
          paintPageBackground(doc, COLORS.bgPrimary);
          cx = 50;
          cy = 50;
        }

        doc.save();
        doc
          .roundedRect(cx, cy, chipW, chipH, 10)
          .fillAndStroke(COLORS.bgCard, COLORS.border);
        doc.restore();
        doc
          .fillColor(COLORS.textPrimary)
          .text(label, cx + chipPad + 2, cy + 6, {
            width: chipW - chipPad * 2,
            height: chipH,
            lineBreak: false,
          });

        cx += chipW + 6;
      });

      doc.y = cy + chipH + 20;
      doc.moveDown(0.5);

      if (graph.edges?.length) {
        doc
          .fontSize(10)
          .fillColor(COLORS.textMuted)
          .text(`DEPENDENCIES (${graph.edges.length})`, { characterSpacing: 1.2 });
        doc.moveDown(0.4);

        doc.font("Courier").fontSize(8.5).fillColor(COLORS.textSecondary);
        graph.edges.slice(0, 40).forEach((edge) => {
          if (doc.y > 780) {
            doc.addPage();
            paintPageBackground(doc, COLORS.bgPrimary);
            doc.font("Courier").fontSize(8.5).fillColor(COLORS.textSecondary);
          }
          doc.text(`  ${edge.from}  →  ${edge.to}`, { lineGap: 1 });
        });
        doc.font("Helvetica");

        if (graph.edges.length > 40) {
          doc
            .fontSize(8.5)
            .fillColor(COLORS.textMuted)
            .text(`  … and ${graph.edges.length - 40} more`);
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    //  IDENTIFIED BUGS
    // ═══════════════════════════════════════════════════════
    doc.addPage();
    sectionTitle(doc, "Identified Bugs", COLORS);

    if (report.bugs?.length) {
      report.bugs.forEach((b, i) => {
        if (doc.y > 720) {
          doc.addPage();
          paintPageBackground(doc, COLORS.bgPrimary);
        }

        const itemY = doc.y;
        const boxW = doc.page.width - 100;

        doc.save();
        doc
          .roundedRect(50, itemY, boxW, 4, 2)
          .fill(COLORS.red);
        doc.restore();

        doc.y = itemY + 12;

        doc
          .fontSize(11.5)
          .fillColor(COLORS.textPrimary)
          .text(`${i + 1}. ${b.title || "Untitled bug"}`, { continued: true })
          .fontSize(9)
          .fillColor(COLORS.red)
          .text(`  (${b.impact || "Unknown impact"})`);

        doc.moveDown(0.3);
        doc
          .fontSize(10)
          .fillColor(COLORS.textSecondary)
          .text(`Issue: ${b.description || "No description"}`, { lineGap: 2 });
        doc
          .fillColor(COLORS.accent)
          .text(`Fix: ${b.fix || b.suggestedFix || "Not specified"}`, {
            lineGap: 2,
          });
        doc.moveDown(0.9);
      });
    } else {
      doc
        .fontSize(11)
        .fillColor(COLORS.green)
        .text("No major bugs detected. 🎉");
    }
    doc.moveDown(1);

    // ═══════════════════════════════════════════════════════
    //  SECURITY ISSUES (AI)
    // ═══════════════════════════════════════════════════════
    if (report.securityIssues?.length) {
      if (doc.y > 600) {
        doc.addPage();
        paintPageBackground(doc, COLORS.bgPrimary);
      }
      sectionTitle(doc, "Security Issues", COLORS);

      report.securityIssues.forEach((s, i) => {
        const itemY = doc.y;
        const boxW = doc.page.width - 100;

        const sevColor = severityColor(s.severity, COLORS);
        doc.save();
        doc.roundedRect(50, itemY, boxW, 4, 2).fill(sevColor);
        doc.restore();
        doc.y = itemY + 12;

        doc
          .fontSize(11.5)
          .fillColor(COLORS.textPrimary)
          .text(`${i + 1}. ${s.issue || "Issue"}`, { continued: true })
          .fontSize(9)
          .fillColor(sevColor)
          .text(`  (${(s.severity || "N/A").toString().toUpperCase()})`);

        doc.moveDown(0.3);
        doc
          .fontSize(10)
          .fillColor(COLORS.textSecondary)
          .text(`Recommendation: ${s.recommendation || "N/A"}`, { lineGap: 2 });
        doc.moveDown(0.9);
      });
    }

    // ═══════════════════════════════════════════════════════
    //  FUTURE ROADMAP
    // ═══════════════════════════════════════════════════════
    if (report.futureRoadmap?.length) {
      if (doc.y > 620) {
        doc.addPage();
        paintPageBackground(doc, COLORS.bgPrimary);
      }
      sectionTitle(doc, "Future Roadmap", COLORS);

      report.futureRoadmap.forEach((f, i) => {
        doc
          .fontSize(12)
          .fillColor(COLORS.accent)
          .text(`${i + 1}. ${f.phase || "Phase"}`);
        doc.moveDown(0.2);
        doc
          .fontSize(10.5)
          .fillColor(COLORS.textSecondary)
          .text(f.details || "", { lineGap: 2 });
        doc.moveDown(0.7);
      });
      doc.moveDown(0.5);
    }

    // ═══════════════════════════════════════════════════════
    //  TOOLS & PACKAGES
    // ═══════════════════════════════════════════════════════
    if (report.toolsAndPackages?.length) {
      if (doc.y > 680) {
        doc.addPage();
        paintPageBackground(doc, COLORS.bgPrimary);
      }
      sectionTitle(doc, "Tools & Packages", COLORS);

      // Chip layout
      const chipFontSize = 9;
      doc.fontSize(chipFontSize);

      let cx = 50;
      let cy = doc.y;
      const maxX = 545;
      const chipH = 22;
      const chipPad = 8;

      report.toolsAndPackages.forEach((t) => {
        const label = String(t);
        const textW = doc.widthOfString(label);
        const chipW = textW + chipPad * 2 + 4;

        if (cx + chipW > maxX) {
          cx = 50;
          cy += chipH + 6;
        }

        if (cy + chipH > 780) {
          doc.addPage();
          paintPageBackground(doc, COLORS.bgPrimary);
          cx = 50;
          cy = 50;
        }

        doc.save();
        doc
          .roundedRect(cx, cy, chipW, chipH, 11)
          .fillAndStroke(COLORS.bgCard, COLORS.border);
        doc.restore();
        doc
          .fillColor(COLORS.textPrimary)
          .text(label, cx + chipPad + 2, cy + 6, {
            width: chipW - chipPad * 2,
            height: chipH,
            lineBreak: false,
          });

        cx += chipW + 6;
      });

      doc.y = cy + chipH + 20;
    }

    // ═══════════════════════════════════════════════════════
    //  FINAL GRADE + VERDICT
    // ═══════════════════════════════════════════════════════
    if (doc.y > 580) {
      doc.addPage();
      paintPageBackground(doc, COLORS.bgPrimary);
    }

    sectionTitle(doc, "Final Grade", COLORS);

    const finalGrade = (report.grade || "N/A").toString();
    doc
      .fontSize(56)
      .fillColor(COLORS.accent)
      .text(finalGrade, { align: "center", width: doc.page.width - 100 });

    doc.moveDown(1);
    sectionTitle(doc, "Final Verdict", COLORS);
    doc
      .fontSize(11)
      .fillColor(COLORS.textSecondary)
      .text(report.finalVerdict || "No verdict provided.", {
        align: "justify",
        lineGap: 3,
      });

    // ── FOOTERS ON EVERY PAGE ──────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      // Skip footer on cover page (page 0)
      if (i > 0) {
        addPageFooter(doc, i + 1, COLORS);
      }
    }

    doc.end();

    addAuditLog(
      workspace._id,
      user._id,
      "report_download",
      `Downloaded PDF report for ${report.repoUrl}`,
      { reportId: report._id },
    ).catch((err) => console.error("Audit log failed:", err));
  } catch (err) {
    console.error("PDF generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF" });
    } else {
      res.end();
    }
  }
};

// ─── Chart Generators (dark theme, accent colors) ─────────────

async function generateRadarChart(scores, COLORS) {
  const rgb = hexToRgb(COLORS.accent);

  const config = {
    type: "radar",
    data: {
      labels: ["Code Quality", "Security", "Performance", "Maintainability"],
      datasets: [
        {
          label: "Score",
          data: [
            scores.codeQuality || 0,
            scores.security || 0,
            scores.performance || 0,
            scores.maintainability || 0,
          ],
          backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
          borderColor: COLORS.accent,
          borderWidth: 2,
          pointBackgroundColor: COLORS.accent,
          pointBorderColor: COLORS.bgPrimary,
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            backdropColor: "transparent",
            color: COLORS.textMuted,
            font: { size: 10 },
          },
          grid: { color: "rgba(255, 255, 255, 0.08)" },
          angleLines: { color: "rgba(255, 255, 255, 0.08)" },
          pointLabels: {
            color: COLORS.textPrimary,
            font: { size: 12, weight: "600" },
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: COLORS.textSecondary,
            font: { size: 12 },
            boxWidth: 12,
            boxHeight: 12,
          },
        },
      },
    },
  };

  return await radarCanvas.renderToBuffer(config);
}

async function generateHealthChart(healthScore, COLORS) {
  const overall = healthScore.overall || 0;
  const remaining = Math.max(100 - overall, 0);

  const config = {
    type: "doughnut",
    data: {
      labels: ["Health Score", "Remaining"],
      datasets: [
        {
          data: [overall, remaining],
          backgroundColor: [COLORS.accent, COLORS.bgElevated],
          borderColor: [COLORS.bgPrimary, COLORS.bgPrimary],
          borderWidth: 2,
        },
      ],
    },
    options: {
      cutout: "72%",
      plugins: { legend: { display: false } },
    },
  };

  return await healthCanvas.renderToBuffer(config);
}