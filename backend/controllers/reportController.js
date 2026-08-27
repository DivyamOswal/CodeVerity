// backend/controllers/reportController.js
import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import Report from "../models/Report.js";
import User from "../models/User.js"; 
import WorkSpace from "../models/WorkSpace.js";

// ── Theme: Indigo Slate ──────────────────────────────────────
const COLORS = {
  primary: "#6366f1",
  primaryLight: "#818cf8",
  primarySoft: "rgba(99, 102, 241, 0.15)",
  textDark: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
  white: "#ffffff",
  red: "#ef4444",
  orange: "#f59e0b",
  yellow: "#facc15",
  blue: "#3b82f6",
  green: "#22c55e",
  gray: "#9ca3af",
};

const SEVERITY_COLORS = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#facc15",
  low: "#3b82f6",
};

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

// ── Helpers ──────────────────────────────────────────────────

function sectionTitle(doc, title, color = COLORS.primary) {
  doc.fontSize(16).fillColor(color).text(title);
  doc.moveDown(0.2);
  doc.strokeColor(color).lineWidth(1.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.8);
}

function drawScoreBar(doc, label, value, color = COLORS.primary) {
  const x = 50;
  const y = doc.y;
  const barWidth = 300;
  const barHeight = 12;
  const max = 100;

  doc.fontSize(11).fillColor(COLORS.textDark).text(`${label}: ${value}%`, x, y);
  doc.moveDown(0.4);
  doc.rect(x, doc.y, barWidth, barHeight).fill(COLORS.border);
  const fillWidth = Math.min((value / max) * barWidth, barWidth);
  doc.rect(x, doc.y, fillWidth, barHeight).fill(color);
  doc.moveDown(1.2);
}

function drawTable(doc, headers, rows, columnWidths) {
  const startX = 50;
  let y = doc.y;
  const rowHeight = 20;

  // Header
  doc.fontSize(10).fillColor(COLORS.primary);
  headers.forEach((h, i) => {
    const x = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(h, x, y, { width: columnWidths[i], align: 'left' });
  });
  y += rowHeight;
  doc.moveTo(startX, y).lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), y).stroke(COLORS.border);

  // Rows
  doc.fontSize(9).fillColor(COLORS.textDark);
  rows.forEach((row) => {
    if (y > 750) { doc.addPage(); y = 50; }
    row.forEach((cell, i) => {
      const x = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(String(cell || ""), x, y + 2, { width: columnWidths[i], align: 'left' });
    });
    y += rowHeight;
    doc.moveTo(startX, y).lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), y).stroke(COLORS.border);
  });
  doc.moveDown(0.5);
}

// ── GET REPORTS (history) ──────────────────────────────────

export const getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const workspace = await ensureWorkspace(user);
    const workspaceId = workspace._id;

    // ── Build filter ──────────────────────────────────────
    let filter;

    // If user is owner or admin: show all workspace reports + old reports without workspaceId
    if (user.role === 'owner' || user.role === 'admin') {
      filter = {
        $or: [
          { workspaceId: workspaceId },
          { workspaceId: { $exists: false }, userId: userId } // fallback for old reports
        ]
      };
    } else {
      // Members/Viewers: only their own reports (regardless of workspaceId)
      filter = { userId: userId };
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, reports });
  } catch (err) {
    console.error("Get reports error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

// ── DOWNLOAD PDF ──────────────────────────────────────────

export const downloadReportPDF = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    // Ensure user has a workspace and verify ownership
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const workspace = await ensureWorkspace(user);
    if (report.workspaceId?.toString() !== workspace._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${report.repoUrl.split("/").pop()}-AI-Code-Audit.pdf`
    );
    doc.pipe(res);

    // ── Cover Page ──────────────────────────────────────────
    doc.fontSize(32).fillColor(COLORS.primary).text("CodeVerity", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor(COLORS.textLight).text("AI-Powered Code Audit Report", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(12).fillColor(COLORS.textDark).text(`Repository: ${report.repoUrl}`, { align: "center" });
    doc.fontSize(10).fillColor(COLORS.textLight).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.fontSize(10).fillColor(COLORS.textLight).text(`Grade: ${report.grade || "N/A"}`, { align: "center" });
    doc.moveDown(1);
    doc.fontSize(10).fillColor(COLORS.textLight).text("_______________________________________________", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor(COLORS.textLight).text("Confidential – For internal use only", { align: "center" });
    doc.addPage();

    // ── Executive Summary ──────────────────────────────────
    sectionTitle(doc, "Executive Summary", COLORS.primary);
    doc.fontSize(11).fillColor(COLORS.textDark).text(report.summary || "No summary available.", { align: "justify" });
    doc.moveDown(1);

    // ── Architecture Review ────────────────────────────────
    sectionTitle(doc, "Architecture Review", COLORS.primaryLight);
    if (report.architecture?.length) {
      report.architecture.forEach((a) => {
        doc.fontSize(12).fillColor(COLORS.primary).text(`${a.component || "Component"}:`, { continued: true })
          .fontSize(11).fillColor(COLORS.textDark).text(` ${a.recommendation || a.description || ""}`);
        doc.moveDown(0.4);
      });
    } else {
      doc.fontSize(11).fillColor(COLORS.textLight).text("No architecture details provided.");
    }
    doc.moveDown(1);

    // ── Quality Scores ──────────────────────────────────────
    sectionTitle(doc, "Quality Scores", COLORS.primary);
    const scores = report.scores || {};
    drawScoreBar(doc, "Code Quality", scores.codeQuality || 0, COLORS.primary);
    drawScoreBar(doc, "Security", scores.security || 0, COLORS.primaryLight);
    drawScoreBar(doc, "Performance", scores.performance || 0, "#818cf8");
    drawScoreBar(doc, "Maintainability", scores.maintainability || 0, COLORS.gray);

    // ── Radar Chart ────────────────────────────────────────
    const chartImage = await generateRadarChart(scores);
    doc.moveDown(1);
    doc.image(chartImage, { fit: [400, 400], align: "center" });
    doc.addPage();

    // ── Health Score ──────────────────────────────────────
    if (report.healthScore) {
      sectionTitle(doc, "Health Score", COLORS.primary);
      const healthChart = await generateHealthChart(report.healthScore);
      doc.image(healthChart, { fit: [180, 180], align: "left" });
      const x = 250;
      let y = doc.y;
      doc.fontSize(14).fillColor(COLORS.primary).text(`Grade: ${report.healthScore.grade || "N/A"}`, x, y);
      y += 20;
      doc.fontSize(11).fillColor(COLORS.textDark).text(`Overall: ${report.healthScore.overall || 0} / 100`, x, y);
      y += 18;
      const breakdown = report.healthScore.breakdown || {};
      Object.entries(breakdown).forEach(([key, val]) => {
        doc.fontSize(10).fillColor(COLORS.textLight).text(`${key}: ${val}%`, x + 10, y);
        y += 15;
      });
      doc.moveDown(1);
    }

    // ── Security Vulnerabilities ────────────────────────────
    if (report.securityVulnerabilities?.length) {
      sectionTitle(doc, `Security Vulnerabilities (${report.securityVulnerabilities.length})`, COLORS.red);
      const headers = ["Severity", "Title", "File", "Line"];
      const colWidths = [60, 200, 150, 50];
      const rows = report.securityVulnerabilities.map(v => [
        v.severity || "N/A",
        v.title || "",
        v.file || "",
        v.line || ""
      ]);
      drawTable(doc, headers, rows, colWidths);
      doc.moveDown(0.5);
    }

    // ── Dependency Vulnerabilities ──────────────────────
    if (report.dependencyVulnerabilities?.length) {
      sectionTitle(doc, `Dependency Vulnerabilities (${report.dependencyVulnerabilities.length})`, COLORS.orange);
      const headers = ["Package", "Version", "CVE", "Severity", "Fixed In"];
      const colWidths = [100, 60, 80, 60, 80];
      const rows = report.dependencyVulnerabilities.map(v => [
        v.package || "",
        v.version || "",
        v.cve || "",
        v.severity || "",
        v.fixedIn || ""
      ]);
      drawTable(doc, headers, rows, colWidths);
      doc.moveDown(0.5);
    }

    // ── Secrets ────────────────────────────────────────────
    if (report.secrets?.length) {
      sectionTitle(doc, `Detected Secrets (${report.secrets.length})`, COLORS.red);
      report.secrets.forEach((s, i) => {
        doc.fontSize(10).fillColor(COLORS.textDark)
          .text(`${i+1}. ${s.pattern || "Unknown"} — ${s.file || ""} (line ${s.line || "?"})`);
        doc.fillColor(COLORS.textLight).text(`   Confidence: ${s.confidence || 0}%`);
        doc.moveDown(0.3);
      });
      doc.moveDown(0.5);
    }

    // ── Technical Debt ──────────────────────────────────
    if (report.techDebt) {
      sectionTitle(doc, "Technical Debt", COLORS.orange);
      const techDebt = report.techDebt;
      doc.fontSize(14).fillColor(COLORS.primary).text(`Estimated Hours: ${techDebt.estimatedHours || 0}h`);
      doc.moveDown(0.5);
      if (techDebt.issues?.length) {
        doc.fontSize(11).fillColor(COLORS.textDark).text("Breakdown:");
        techDebt.issues.forEach((issue, i) => {
          doc.fontSize(10).fillColor(COLORS.textDark)
            .text(`${i+1}. ${issue.description || "No description"} (${issue.severity || "low"}) — ${issue.effort || 0}h`);
          doc.fillColor(COLORS.textLight).text(`   File: ${issue.file || "unknown"}`);
          doc.moveDown(0.2);
        });
      } else {
        doc.fontSize(11).fillColor(COLORS.textLight).text("No technical debt issues listed.");
      }
      doc.moveDown(0.5);
    }

    // ── Architecture Graph ──────────────────────────────
    if (report.architectureGraph?.nodes?.length) {
      sectionTitle(doc, "Architecture Graph", COLORS.primaryLight);
      const graph = report.architectureGraph;
      doc.fontSize(10).fillColor(COLORS.textDark).text("Nodes:");
      graph.nodes.forEach(node => {
        doc.text(`  • ${node.label || node.id} (${node.type || "module"})`);
      });
      doc.moveDown(0.5);
      if (graph.edges?.length) {
        doc.fontSize(10).fillColor(COLORS.textDark).text("Dependencies:");
        graph.edges.forEach(edge => {
          doc.text(`  • ${edge.from} → ${edge.to} (${edge.type || "import"})`);
        });
      }
      doc.moveDown(0.5);
    }

    // ── Identified Bugs ──────────────────────────────────
    sectionTitle(doc, "Identified Bugs", COLORS.red);
    if (report.bugs?.length) {
      report.bugs.forEach((b, i) => {
        doc.fontSize(12).fillColor(COLORS.red).text(`${i + 1}. ${b.title} (${b.impact || "Unknown impact"})`);
        doc.fontSize(11).fillColor(COLORS.textDark).text(`Issue: ${b.description || "No description"}`);
        doc.fillColor(COLORS.primary).text(`Fix: ${b.fix || b.suggestedFix || "Not specified"}`);
        doc.moveDown(0.6);
      });
    } else {
      doc.fontSize(11).fillColor(COLORS.textLight).text("No major bugs detected.");
    }
    doc.moveDown(1);

    // ── Security Issues (AI) ────────────────────────────
    if (report.securityIssues?.length) {
      sectionTitle(doc, "Security Issues (AI)", COLORS.orange);
      report.securityIssues.forEach((s, i) => {
        doc.fontSize(12).fillColor(COLORS.orange).text(`${i + 1}. ${s.issue || "Issue"}`);
        doc.fontSize(11).fillColor(COLORS.textDark).text(`Severity: ${s.severity || "N/A"}`);
        doc.fillColor(COLORS.primary).text(`Recommendation: ${s.recommendation || "N/A"}`);
        doc.moveDown(0.6);
      });
      doc.moveDown(1);
    }

    // ── Future Roadmap ──────────────────────────────────
    sectionTitle(doc, "Future Roadmap", COLORS.primary);
    if (report.futureRoadmap?.length) {
      report.futureRoadmap.forEach((f, i) => {
        doc.fontSize(12).fillColor(COLORS.primaryLight).text(`${i + 1}. ${f.phase || "Phase"}`);
        doc.fontSize(11).fillColor(COLORS.textDark).text(f.details || "");
        doc.moveDown(0.4);
      });
    } else {
      doc.fontSize(11).fillColor(COLORS.textLight).text("No roadmap defined.");
    }
    doc.moveDown(1);

    // ── Tools & Packages ────────────────────────────────
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
    doc.fontSize(12).fillColor(COLORS.textDark).text(report.finalVerdict || "No verdict provided.", { align: "justify" });

    doc.moveDown(2);
    doc.fontSize(8).fillColor(COLORS.textLight).text("Generated by CodeVerity AI · Confidential", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

// ── Chart Generators ─────────────────────────────────────────

async function generateRadarChart(scores) {
  const width = 500;
  const height = 500;
  const canvas = new ChartJSNodeCanvas({ width, height });

  const config = {
    type: "radar",
    data: {
      labels: ["Code Quality", "Security", "Performance", "Maintainability"],
      datasets: [{
        label: "Score",
        data: [
          scores.codeQuality || 0,
          scores.security || 0,
          scores.performance || 0,
          scores.maintainability || 0,
        ],
        backgroundColor: "rgba(99, 102, 241, 0.25)",
        borderColor: "#6366f1",
        borderWidth: 2,
        pointBackgroundColor: "#6366f1",
      }],
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
        legend: { labels: { color: "#1f2937", font: { size: 12 } } },
      },
    },
  };

  return await canvas.renderToBuffer(config);
}

async function generateHealthChart(healthScore) {
  const width = 200;
  const height = 200;
  const canvas = new ChartJSNodeCanvas({ width, height });
  const overall = healthScore.overall || 0;
  const remaining = 100 - overall;

  const config = {
    type: "doughnut",
    data: {
      labels: ["Health Score", "Remaining"],
      datasets: [{
        data: [overall, remaining],
        backgroundColor: ["#6366f1", "#e5e7eb"],
        borderWidth: 0,
      }],
    },
    options: {
      cutout: "70%",
      plugins: { legend: { display: false } },
    },
  };

  return await canvas.renderToBuffer(config);
}