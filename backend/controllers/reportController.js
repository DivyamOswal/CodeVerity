import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import Report from "../models/Report.js";

// ── Theme colors ──────────────────────────────────────────────
const COLORS = {
  primary: "#3fb950",      // green
  secondary: "#10b981",    // emerald
  accent: "#2dd4bf",       // teal
  textDark: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
  white: "#ffffff",
  red: "#ef4444",
  blue: "#3b82f6",
  yellow: "#f59e0b",
};

/* ====== GET HISTORY ====== */
export const getReports = async (req, res) => {
  const reports = await Report.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });
  res.json({ success: true, reports });
};

/* ====== DOWNLOAD PDF ====== */
export const downloadReportPDF = async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${report.repoUrl
      .split("/")
      .pop()}-AI-Code-Audit.pdf`
  );
  doc.pipe(res);

  // ── Cover Page ──────────────────────────────────────────────
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
    .text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
  doc
    .fontSize(10)
    .fillColor(COLORS.textLight)
    .text(`Grade: ${report.grade || "N/A"}`, { align: "center" });

  doc.moveDown(1);
  doc
    .fontSize(10)
    .fillColor(COLORS.textLight)
    .text("_______________________________________________", { align: "center" });
  doc.moveDown(0.5);
  doc
    .fontSize(8)
    .fillColor(COLORS.textLight)
    .text("Confidential – For internal use only", { align: "center" });

  doc.addPage();

  // ── Helper: Section Header ──────────────────────────────────
  const sectionTitle = (title, color = COLORS.primary) => {
    doc
      .fontSize(16)
      .fillColor(color)
      .text(title);
    doc
      .moveDown(0.2)
      .strokeColor(color)
      .lineWidth(1.5)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown(0.8);
  };

  // ── Helper: Score Bar ──────────────────────────────────────
  const drawScoreBar = (label, value, color = COLORS.primary) => {
    const x = 50;
    const y = doc.y;
    const barWidth = 300;
    const barHeight = 12;
    const max = 100;

    doc.fontSize(11).fillColor(COLORS.textDark).text(`${label}: ${value}%`, x, y);
    doc.moveDown(0.4);
    // background
    doc
      .rect(x, doc.y, barWidth, barHeight)
      .fill(COLORS.border);
    // fill
    const fillWidth = Math.min((value / max) * barWidth, barWidth);
    doc
      .rect(x, doc.y, fillWidth, barHeight)
      .fill(color);
    doc.moveDown(1.2);
  };

  // ── Executive Summary ──────────────────────────────────────
  sectionTitle("Executive Summary", COLORS.primary);
  doc
    .fontSize(11)
    .fillColor(COLORS.textDark)
    .text(report.summary || "No summary available.", {
      align: "justify",
    });
  doc.moveDown(1);

  // ── Architecture Review ────────────────────────────────────
  sectionTitle("Architecture Review", COLORS.secondary);
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
    doc.fontSize(11).fillColor(COLORS.textLight).text("No architecture details provided.");
  }
  doc.moveDown(1);

  // ── Quality Scores ──────────────────────────────────────────
  sectionTitle("Quality Scores", COLORS.accent);
  const scores = report.scores || {};
  drawScoreBar("Code Quality", scores.codeQuality || 0, COLORS.primary);
  drawScoreBar("Security", scores.security || 0, COLORS.secondary);
  drawScoreBar("Performance", scores.performance || 0, COLORS.accent);
  drawScoreBar("Maintainability", scores.maintainability || 0, "#6b7280");

  // ── Radar Chart ─────────────────────────────────────────────
  const chartImage = await generateRadarChart(scores);
  doc.moveDown(1);
  doc.image(chartImage, {
    fit: [400, 400],
    align: "center",
  });
  doc.addPage();

  // ── Identified Bugs ─────────────────────────────────────────
  sectionTitle("Identified Bugs", "#ef4444");
  if (report.bugs?.length) {
    report.bugs.forEach((b, i) => {
      doc
        .fontSize(12)
        .fillColor("#dc2626")
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

  // ── Security Issues ─────────────────────────────────────────
  if (report.securityIssues?.length) {
    sectionTitle("Security Issues", "#f59e0b");
    report.securityIssues.forEach((s, i) => {
      doc
        .fontSize(12)
        .fillColor("#d97706")
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

  // ── Future Roadmap ──────────────────────────────────────────
  sectionTitle("Future Roadmap", COLORS.primary);
  if (report.futureRoadmap?.length) {
    report.futureRoadmap.forEach((f, i) => {
      doc
        .fontSize(12)
        .fillColor(COLORS.secondary)
        .text(`${i + 1}. ${f.phase || "Phase"}`);
      doc
        .fontSize(11)
        .fillColor(COLORS.textDark)
        .text(f.details || "");
      doc.moveDown(0.4);
    });
  } else {
    doc.fontSize(11).fillColor(COLORS.textLight).text("No roadmap defined.");
  }
  doc.moveDown(1);

  // ── Tools & Packages ────────────────────────────────────────
  sectionTitle("Tools & Packages Used", COLORS.accent);
  if (report.toolsAndPackages?.length) {
    report.toolsAndPackages.forEach((t) => {
      doc.fontSize(11).fillColor(COLORS.textDark).text(`• ${t}`);
    });
  } else {
    doc.fontSize(11).fillColor(COLORS.textLight).text("No tools listed.");
  }
  doc.moveDown(1);

  // ── Final Grade & Verdict ──────────────────────────────────
  sectionTitle("Final Grade", COLORS.primary);
  doc
    .fontSize(28)
    .fillColor(COLORS.primary)
    .text(report.grade || "N/A");
  doc.moveDown(0.5);
  sectionTitle("Final Verdict", COLORS.secondary);
  doc
    .fontSize(12)
    .fillColor(COLORS.textDark)
    .text(report.finalVerdict || "No verdict provided.", {
      align: "justify",
    });

  // ── Footer ──────────────────────────────────────────────────
  doc.moveDown(2);
  doc
    .fontSize(8)
    .fillColor(COLORS.textLight)
    .text("Generated by CodeVerity AI · Confidential", { align: "center" });

  doc.end();
};

/* ===== RADAR CHART (themed) ===== */
async function generateRadarChart(scores) {
  const width = 500;
  const height = 500;
  const canvas = new ChartJSNodeCanvas({ width, height });

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
          backgroundColor: "rgba(63, 185, 80, 0.25)",   // green with opacity
          borderColor: "#3fb950",
          borderWidth: 2,
          pointBackgroundColor: "#3fb950",
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
          },
          grid: {
            color: "rgba(0,0,0,0.1)",
          },
          angleLines: {
            color: "rgba(0,0,0,0.1)",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#1f2937",
            font: { size: 12 },
          },
        },
      },
    },
  };

  return await canvas.renderToBuffer(config);
}