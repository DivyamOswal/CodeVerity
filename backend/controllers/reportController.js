// backend/controllers/reportController.js
import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import Report from "../models/Report.js";
import User from "../models/User.js";
import WorkSpace from "../models/WorkSpace.js";
import { addAuditLog } from "./workspaceController.js";

// ── Base colors (not theme-dependent) ─────────────────────────
const BASE_COLORS = {
  red: "#ef4444",
  orange: "#f59e0b",
  yellow: "#facc15",
  blue: "#3b82f6",
  green: "#22c55e",
  gray: "#9ca3af",
  white: "#ffffff",
  textDark: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
};

const FALLBACK_ACCENT_RGB = { r: 34, g: 211, b: 238 }; // cyan

// ── Helper: hex → RGB (handles #fff, #ffffff, and invalid) ────
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

// ── Build theme-aware color palette ───────────────────────────
function getThemeColors(accentHex) {
  const rgb = hexToRgb(accentHex);
  return {
    primary: accentHex,
    primaryLight: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    primarySoft: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
    ...BASE_COLORS,
  };
}

// ── Hoisted chart canvases (avoid per-request startup cost) ───
const radarCanvas = new ChartJSNodeCanvas({ width: 500, height: 500 });
const healthCanvas = new ChartJSNodeCanvas({ width: 200, height: 200 });

// ── Helper: Ensure user has a workspace ──────────────────────
// NOTE: this has a side effect (creates a workspace if missing).
// Only call from write paths or from endpoints where the user is
// expected to already have a workspace.
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

// ── Helper: Atomic scan-counter increment ─────────────────────
async function incrementWorkspaceScans(workspaceId) {
  try {
    await WorkSpace.findByIdAndUpdate(workspaceId, {
      $inc: { totalScans: 1 },
    });
  } catch (err) {
    console.error("Failed to increment workspace scans:", err);
  }
}

// ── Access-control helper ────────────────────────────────────
// Loads a report and confirms the requesting user is allowed to see it.
//
// Rules (consistent across list, single, delete, and PDF):
//   owner / admin  → any report in their workspace
//   member / viewer → only their own reports
//
// Always returns "not_found" for both "doesn't exist" and "not yours"
// so we don't leak the existence of report IDs.
async function loadReportWithAccess(reportId, requestingUserId) {
  const report = await Report.findById(reportId);
  if (!report) return { error: "not_found" };

  const user = await User.findById(requestingUserId);
  if (!user) return { error: "unauthorized" };

  const workspace = await ensureWorkspace(user);

  // Report must belong to the requester's workspace.
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

// ── Build the list-scope filter for a workspace member ────────
// Used by getReports so list results match the single-report rules.
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

  // Members and viewers only see their own reports.
  return { userId };
}

// ── PDF Helpers ───────────────────────────────────────────────

function sectionTitle(doc, title, color) {
  doc.fontSize(16).fillColor(color).text(title);
  doc.moveDown(0.2);
  doc
    .strokeColor(color)
    .lineWidth(1.5)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();
  doc.moveDown(0.8);
}

function drawScoreBar(doc, label, value, color) {
  const x = 50;
  const y = doc.y;
  const barWidth = 300;
  const barHeight = 12;
  const max = 100;

  doc
    .fontSize(11)
    .fillColor(BASE_COLORS.textDark)
    .text(`${label}: ${value}%`, x, y);
  doc.moveDown(0.4);
  doc.rect(x, doc.y, barWidth, barHeight).fill(BASE_COLORS.border);
  const fillWidth = Math.min((value / max) * barWidth, barWidth);
  doc.rect(x, doc.y, fillWidth, barHeight).fill(color);
  doc.moveDown(1.2);
}

function drawTable(doc, headers, rows, columnWidths) {
  const startX = 50;
  let y = doc.y;
  const rowHeight = 20;

  doc.fontSize(10).fillColor(BASE_COLORS.primary);
  headers.forEach((h, i) => {
    const x = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(h, x, y, { width: columnWidths[i], align: "left" });
  });
  y += rowHeight;
  doc
    .moveTo(startX, y)
    .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), y)
    .stroke(BASE_COLORS.border);

  doc.fontSize(9).fillColor(BASE_COLORS.textDark);
  rows.forEach((row) => {
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
    row.forEach((cell, i) => {
      const x = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(String(cell || ""), x, y + 2, {
        width: columnWidths[i],
        align: "left",
      });
    });
    y += rowHeight;
    doc
      .moveTo(startX, y)
      .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), y)
      .stroke(BASE_COLORS.border);
  });
  doc.moveDown(0.5);
}

// ── CREATE REPORT ─────────────────────────────────────────────
// NOTE: currently not mounted on any route. Reports are created
// inside githubController.analyzeGithubRepo(). Kept here for callers
// who want a direct create endpoint.
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

// ── GET REPORTS (history, paginated) ──────────────────────────
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
        .select("-sourceCode") // full source is only needed on the detail page
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

// ── GET SINGLE REPORT ─────────────────────────────────────────
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

// ── DELETE REPORT ─────────────────────────────────────────────
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

    // Only the report owner, an admin, or the workspace owner can delete.
    const isPrivileged = member.role === "owner" || member.role === "admin";
    const isOwner = report.userId.toString() === user._id.toString();
    if (!isPrivileged && !isOwner) {
      return res.status(404).json({ error: "Report not found" });
    }

    await report.deleteOne();

    // Decrement scan counter atomically
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

// ── DOWNLOAD PDF ──────────────────────────────────────────────
export const downloadReportPDF = async (req, res) => {
  // Load access first, BEFORE piping the PDF. Once PDFKit starts
  // writing to res, we can no longer send a JSON error.
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
    const accent = user.accentColor || "#22d3ee";
    const COLORS = getThemeColors(accent);

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Sanitize the filename to avoid header injection if repoUrl ever
    // contains unusual characters (not the case for GitHub, but cheap).
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

    // ── Cover Page ──────────────────────────────────────────
    doc
      .fontSize(32)
      .fillColor(COLORS.primary)
      .text("CodeVerity", { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(14)
      .fillColor(COLORS.textLight)
      .text("AI-Powered Code Audit Report", { align: "center" });
    doc.moveDown(2);
    doc
      .fontSize(12)
      .fillColor(COLORS.textDark)
      .text(`Repository: ${report.repoUrl}`, { align: "center" });
    doc
      .fontSize(10)
      .fillColor(COLORS.textLight)
      .text(`Generated: ${new Date().toLocaleDateString()}`, {
        align: "center",
      });
    doc
      .fontSize(10)
      .fillColor(COLORS.textLight)
      .text(`Grade: ${report.grade || "N/A"}`, { align: "center" });
    doc.moveDown(1);
    doc
      .fontSize(10)
      .fillColor(COLORS.textLight)
      .text("_______________________________________________", {
        align: "center",
      });
    doc.moveDown(0.5);
    doc
      .fontSize(8)
      .fillColor(COLORS.textLight)
      .text("Confidential – For internal use only", { align: "center" });
    doc.addPage();

    // ── Executive Summary ──────────────────────────────────
    sectionTitle(doc, "Executive Summary", COLORS.primary);
    doc
      .fontSize(11)
      .fillColor(COLORS.textDark)
      .text(report.summary || "No summary available.", { align: "justify" });
    doc.moveDown(1);

    // ── Architecture Review ────────────────────────────────
    sectionTitle(doc, "Architecture Review", COLORS.primaryLight);
    if (report.architecture?.length) {
      report.architecture.forEach((a) => {
        doc
          .fontSize(12)
          .fillColor(COLORS.primary)
          .text(`${a.component || "Component"}:`, { continued: true })
          .fontSize(11)
          .fillColor(COLORS.textDark)
          .text(` ${a.recommendation || a.description || ""}`);
        doc.moveDown(0.4);
      });
    } else {
      doc
        .fontSize(11)
        .fillColor(COLORS.textLight)
        .text("No architecture details provided.");
    }
    doc.moveDown(1);

    // ── Quality Scores ──────────────────────────────────────
    sectionTitle(doc, "Quality Scores", COLORS.primary);
    const scores = report.scores || {};
    drawScoreBar(doc, "Code Quality", scores.codeQuality || 0, COLORS.primary);
    drawScoreBar(doc, "Security", scores.security || 0, COLORS.primaryLight);
    drawScoreBar(doc, "Performance", scores.performance || 0, COLORS.blue);
    drawScoreBar(
      doc,
      "Maintainability",
      scores.maintainability || 0,
      COLORS.gray,
    );

    // ── Radar Chart ────────────────────────────────────────
    try {
      const chartImage = await generateRadarChart(scores, COLORS);
      doc.moveDown(1);
      doc.image(chartImage, { fit: [400, 400], align: "center" });
    } catch (chartErr) {
      console.error("Radar chart failed:", chartErr);
    }
    doc.addPage();

    // ── Health Score ──────────────────────────────────────
    if (report.healthScore) {
      sectionTitle(doc, "Health Score", COLORS.primary);
      try {
        const healthChart = await generateHealthChart(
          report.healthScore,
          COLORS,
        );
        doc.image(healthChart, { fit: [180, 180], align: "left" });
      } catch (chartErr) {
        console.error("Health chart failed:", chartErr);
      }
      const x = 250;
      let y = doc.y;
      doc
        .fontSize(14)
        .fillColor(COLORS.primary)
        .text(`Grade: ${report.healthScore.grade || "N/A"}`, x, y);
      y += 20;
      doc
        .fontSize(11)
        .fillColor(COLORS.textDark)
        .text(`Overall: ${report.healthScore.overall || 0} / 100`, x, y);
      y += 18;
      const breakdown = report.healthScore.breakdown || {};
      Object.entries(breakdown).forEach(([key, val]) => {
        doc
          .fontSize(10)
          .fillColor(COLORS.textLight)
          .text(`${key}: ${val}%`, x + 10, y);
        y += 15;
      });
      doc.moveDown(1);
    }

    // ── Security Vulnerabilities ────────────────────────────
    if (report.securityVulnerabilities?.length) {
      sectionTitle(
        doc,
        `Security Vulnerabilities (${report.securityVulnerabilities.length})`,
        COLORS.red,
      );
      const headers = ["Severity", "Title", "File", "Line"];
      const colWidths = [60, 200, 150, 50];
      const rows = report.securityVulnerabilities.map((v) => [
        v.severity || "N/A",
        v.title || "",
        v.file || "",
        v.line || "",
      ]);
      drawTable(doc, headers, rows, colWidths);
      doc.moveDown(0.5);
    }

    // ── Dependency Vulnerabilities ──────────────────────────
    if (report.dependencyVulnerabilities?.length) {
      sectionTitle(
        doc,
        `Dependency Vulnerabilities (${report.dependencyVulnerabilities.length})`,
        COLORS.orange,
      );
      const headers = ["Package", "Version", "CVE", "Severity", "Fixed In"];
      const colWidths = [100, 60, 80, 60, 80];
      const rows = report.dependencyVulnerabilities.map((v) => [
        v.package || "",
        v.version || "",
        v.cve || "",
        v.severity || "",
        v.fixedIn || "",
      ]);
      drawTable(doc, headers, rows, colWidths);
      doc.moveDown(0.5);
    }

    // ── Secrets ─────────────────────────────────────────────
    if (report.secrets?.length) {
      sectionTitle(doc, `Detected Secrets (${report.secrets.length})`, COLORS.red);
      report.secrets.forEach((s, i) => {
        doc
          .fontSize(10)
          .fillColor(COLORS.textDark)
          .text(
            `${i + 1}. ${s.pattern || "Unknown"} ${s.file || ""} (line ${s.line || "?"})`,
          );
        doc
          .fillColor(COLORS.textLight)
          .text(`   Confidence: ${s.confidence || 0}%`);
        doc.moveDown(0.3);
      });
      doc.moveDown(0.5);
    }

    // ── Technical Debt ──────────────────────────────────────
    if (report.techDebt) {
      sectionTitle(doc, "Technical Debt", COLORS.orange);
      const techDebt = report.techDebt;
      doc
        .fontSize(14)
        .fillColor(COLORS.primary)
        .text(`Estimated Hours: ${techDebt.estimatedHours || 0}h`);
      doc.moveDown(0.5);
      if (techDebt.issues?.length) {
        doc.fontSize(11).fillColor(COLORS.textDark).text("Breakdown:");
        techDebt.issues.forEach((issue, i) => {
          doc
            .fontSize(10)
            .fillColor(COLORS.textDark)
            .text(
              `${i + 1}. ${issue.description || "No description"} (${issue.severity || "low"}) ${issue.effort || 0}h`,
            );
          doc
            .fillColor(COLORS.textLight)
            .text(`   File: ${issue.file || "unknown"}`);
          doc.moveDown(0.2);
        });
      } else {
        doc
          .fontSize(11)
          .fillColor(COLORS.textLight)
          .text("No technical debt issues listed.");
      }
      doc.moveDown(0.5);
    }

    // ── Architecture Graph ──────────────────────────────────
    if (report.architectureGraph?.nodes?.length) {
      sectionTitle(doc, "Architecture Graph", COLORS.primaryLight);
      const graph = report.architectureGraph;
      doc.fontSize(10).fillColor(COLORS.textDark).text("Nodes:");
      graph.nodes.forEach((node) => {
        doc.text(`  • ${node.label || node.id} (${node.type || "module"})`);
      });
      doc.moveDown(0.5);
      if (graph.edges?.length) {
        doc.fontSize(10).fillColor(COLORS.textDark).text("Dependencies:");
        graph.edges.forEach((edge) => {
          doc.text(`  • ${edge.from} → ${edge.to} (${edge.type || "import"})`);
        });
      }
      doc.moveDown(0.5);
    }

    // ── Identified Bugs ──────────────────────────────────────
    sectionTitle(doc, "Identified Bugs", COLORS.red);
    if (report.bugs?.length) {
      report.bugs.forEach((b, i) => {
        doc
          .fontSize(12)
          .fillColor(COLORS.red)
          .text(`${i + 1}. ${b.title} (${b.impact || "Unknown impact"})`);
        doc
          .fontSize(11)
          .fillColor(COLORS.textDark)
          .text(`Issue: ${b.description || "No description"}`);
        doc
          .fillColor(COLORS.primary)
          .text(`Fix: ${b.fix || b.suggestedFix || "Not specified"}`);
        doc.moveDown(0.6);
      });
    } else {
      doc.fontSize(11).fillColor(COLORS.textLight).text("No major bugs detected.");
    }
    doc.moveDown(1);

    // ── Security Issues (AI) ─────────────────────────────────
    if (report.securityIssues?.length) {
      sectionTitle(doc, "Security Issues (AI)", COLORS.orange);
      report.securityIssues.forEach((s, i) => {
        doc
          .fontSize(12)
          .fillColor(COLORS.orange)
          .text(`${i + 1}. ${s.issue || "Issue"}`);
        doc
          .fontSize(11)
          .fillColor(COLORS.textDark)
          .text(`Severity: ${s.severity || "N/A"}`);
        doc
          .fillColor(COLORS.primary)
          .text(`Recommendation: ${s.recommendation || "N/A"}`);
        doc.moveDown(0.6);
      });
      doc.moveDown(1);
    }

    // ── Future Roadmap ──────────────────────────────────────
    sectionTitle(doc, "Future Roadmap", COLORS.primary);
    if (report.futureRoadmap?.length) {
      report.futureRoadmap.forEach((f, i) => {
        doc
          .fontSize(12)
          .fillColor(COLORS.primaryLight)
          .text(`${i + 1}. ${f.phase || "Phase"}`);
        doc.fontSize(11).fillColor(COLORS.textDark).text(f.details || "");
        doc.moveDown(0.4);
      });
    } else {
      doc.fontSize(11).fillColor(COLORS.textLight).text("No roadmap defined.");
    }
    doc.moveDown(1);

    // ── Tools & Packages ──────────────────────────────────
    sectionTitle(doc, "Tools & Packages Used", COLORS.primary);
    if (report.toolsAndPackages?.length) {
      report.toolsAndPackages.forEach((t) => {
        doc.fontSize(11).fillColor(COLORS.textDark).text(`• ${t}`);
      });
    } else {
      doc.fontSize(11).fillColor(COLORS.textLight).text("No tools listed.");
    }
    doc.moveDown(1);

    // ── Final Grade & Verdict ──────────────────────────
    sectionTitle(doc, "Final Grade", COLORS.primary);
    doc.fontSize(28).fillColor(COLORS.primary).text(report.grade || "N/A");
    doc.moveDown(0.5);
    sectionTitle(doc, "Final Verdict", COLORS.primaryLight);
    doc
      .fontSize(12)
      .fillColor(COLORS.textDark)
      .text(report.finalVerdict || "No verdict provided.", { align: "justify" });

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor(COLORS.textLight)
      .text("Generated by CodeVerity AI · Confidential", { align: "center" });

    doc.end();

    // Fire-and-forget audit log (after streaming starts).
    // Don't await  we don't want to delay the response.
    addAuditLog(
      workspace._id,
      user._id,
      "report_download",
      `Downloaded PDF report for ${report.repoUrl}`,
      { reportId: report._id },
    ).catch((err) => console.error("Audit log failed:", err));
  } catch (err) {
    console.error("PDF generation error:", err);
    // If headers were already sent, we can only end the stream.
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF" });
    } else {
      res.end();
    }
  }
};

// ── Chart Generators (use hoisted canvases) ──────────────────

async function generateRadarChart(scores, COLORS) {
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
          backgroundColor: COLORS.primarySoft,
          borderColor: COLORS.primary,
          borderWidth: 2,
          pointBackgroundColor: COLORS.primary,
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
          ticks: { stepSize: 20, backdropColor: "transparent" },
          grid: { color: "rgba(0,0,0,0.1)" },
          angleLines: { color: "rgba(0,0,0,0.1)" },
        },
      },
      plugins: {
        legend: { labels: { color: COLORS.textDark, font: { size: 12 } } },
      },
    },
  };

  return await radarCanvas.renderToBuffer(config);
}

async function generateHealthChart(healthScore, COLORS) {
  const overall = healthScore.overall || 0;
  const remaining = 100 - overall;

  const config = {
    type: "doughnut",
    data: {
      labels: ["Health Score", "Remaining"],
      datasets: [
        {
          data: [overall, remaining],
          backgroundColor: [COLORS.primary, COLORS.border],
          borderWidth: 0,
        },
      ],
    },
    options: {
      cutout: "70%",
      plugins: { legend: { display: false } },
    },
  };

  return await healthCanvas.renderToBuffer(config);
}