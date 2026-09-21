// backend/models/Report.js
import mongoose from "mongoose";

// ---- Existing sub-schemas ----
const ArchitectureSchema = new mongoose.Schema(
  {
    component: String,
    description: String,
    recommendation: String,
  },
  { _id: false }
);

// ---- Static analysis sub-schemas ----
const SecurityVulnerabilitySchema = new mongoose.Schema(
  {
    severity: { type: String, enum: ["critical", "high", "medium", "low"] },
    title: String,
    file: String,
    line: Number,
    description: String,
    recommendation: String,
  },
  { _id: false }
);

const DependencyVulnerabilitySchema = new mongoose.Schema(
  {
    package: String,
    version: String,
    cve: String,
    severity: String,
    fixedIn: String,
  },
  { _id: false }
);

const SecretSchema = new mongoose.Schema(
  {
    pattern: String,
    file: String,
    line: Number,
    confidence: Number,
  },
  { _id: false }
);

const TechDebtIssueSchema = new mongoose.Schema(
  {
    file: String,
    severity: { type: String, enum: ["low", "medium", "high", "critical"] },
    effort: { type: Number, default: 0 },
    description: String,
  },
  { _id: false }
);

const GraphNodeSchema = new mongoose.Schema(
  {
    id: String,
    label: String,
    type: { type: String, enum: ["module", "component", "file"] },
  },
  { _id: false }
);

const GraphEdgeSchema = new mongoose.Schema(
  {
    from: String,
    to: String,
    type: { type: String, enum: ["import", "dependency", "call"] },
  },
  { _id: false }
);

// ---- Unified findings sub-schema (new) ----
const FindingSchema = new mongoose.Schema(
  {
    id: String,
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low", "info"],
      default: "medium",
    },
    category: {
      type: String,
      default: "general",
    },
    source: {
      type: String,
      default: "unknown", // ai | security-scan | secret-scan | npm-audit | cve | complexity
    },
    file: { type: String, default: null },
    line: { type: Number, default: null },
    endLine: { type: Number, default: null },
    title: String,
    description: String,
    whyItMatters: { type: String, default: null },
    suggestedFix: { type: String, default: null },
    references: { type: [String], default: [] },
    raw: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const FindingsSummarySchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0 },
    bySeverity: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
    },
    byCategory: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

// ---- Main Report Schema ----
const ReportSchema = new mongoose.Schema(
  {
    // ---- User & Workspace ----
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    repoUrl: {
      type: String,
      required: true,
    },

    // ═══════════════════════════════════════════════════════
    // AI analysis (legacy shape  kept for backwards compat)
    // ═══════════════════════════════════════════════════════
    summary: String,
    strengths: { type: [String], default: [] },
    risks: { type: [String], default: [] },
    topPriority: String,
    actionPlan: { type: [String], default: [] },

    architecture: {
      type: [ArchitectureSchema],
      default: [],
    },
    bugs: {
      type: Array,
      default: [],
    },
    securityIssues: {
      type: Array,
      default: [],
    },
    futureRoadmap: {
      type: Array,
      default: [],
    },
    toolsAndPackages: {
      type: [String],
      default: [],
    },
    scores: {
      codeQuality: { type: Number, default: 0 },
      security: { type: Number, default: 0 },
      performance: { type: Number, default: 0 },
      maintainability: { type: Number, default: 0 },
    },
    grade: {
      type: String,
      default: "C",
    },
    finalVerdict: String,

    // ═══════════════════════════════════════════════════════
    // Unified findings (new)
    // ═══════════════════════════════════════════════════════
    findings: {
      type: [FindingSchema],
      default: [],
    },
    findingsSummary: {
      type: FindingsSummarySchema,
      default: () => ({}),
    },

    // ═══════════════════════════════════════════════════════
    // Namespaced payloads (new)
    // ═══════════════════════════════════════════════════════
    ai: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    static: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ═══════════════════════════════════════════════════════
    // Static analysis results (already used)
    // ═══════════════════════════════════════════════════════
    // healthScore is Mixed because computeHealthScore() may return
    // a number, an object, or a custom shape depending on the scanner.
    healthScore: {
      type: mongoose.Schema.Types.Mixed,
      default: 0,
    },
    securityVulnerabilities: {
      type: [SecurityVulnerabilitySchema],
      default: [],
    },
    dependencyVulnerabilities: {
      type: [DependencyVulnerabilitySchema],
      default: [],
    },
    secrets: {
      type: [SecretSchema],
      default: [],
    },
    techDebt: {
      estimatedHours: { type: Number, default: 0 },
      issues: {
        type: [TechDebtIssueSchema],
        default: [],
      },
    },
    architectureGraph: {
      nodes: {
        type: [GraphNodeSchema],
        default: [],
      },
      edges: {
        type: [GraphEdgeSchema],
        default: [],
      },
    },

    // ═══════════════════════════════════════════════════════
    // Previously MISSING  being silently dropped
    // ═══════════════════════════════════════════════════════
    complexity: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        maxComplexity: 0,
        averageComplexity: 0,
        maintainability: 0,
        functions: [],
      },
    },
    cveList: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    readmeScore: {
      type: mongoose.Schema.Types.Mixed,
      default: { score: 0, details: {} },
    },

    // ═══════════════════════════════════════════════════════
    // Source code (optional) & token metadata
    // ═══════════════════════════════════════════════════════
    _sourceCode: { type: String, default: "" },

    tokensUsed: { type: Number, default: 0 },
    tokensRemaining: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    // Keep strict on so unknown fields still fail loudly.
    strict: true,
  }
);

// ─── Indexes ──────────────────────────────────────
ReportSchema.index({ userId: 1, createdAt: -1 });
ReportSchema.index({ workspaceId: 1, createdAt: -1 });
ReportSchema.index({ userId: 1, repoUrl: 1 });

// Index for querying reports by finding severity (useful for dashboards)
ReportSchema.index({ workspaceId: 1, "findingsSummary.bySeverity.critical": 1 });

export default mongoose.model("Report", ReportSchema);