// backend/models/Report.js
import mongoose from "mongoose";

// ---- Existing sub‑schemas ----
const ArchitectureSchema = new mongoose.Schema(
  {
    component: String,
    description: String,
    recommendation: String,
  },
  { _id: false }
);

// ---- NEW sub‑schemas for Phase 1 ----
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

    // ---- Existing fields (AI analysis) ----
    summary: String,
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

    // ---- Phase 1 Enhanced Fields ----
    healthScore: {
      overall: { type: Number, default: 0 },
      grade: { type: String, default: "N/A" },
      breakdown: {
        codeQuality: { type: Number, default: 0 },
        security: { type: Number, default: 0 },
        performance: { type: Number, default: 0 },
        maintainability: { type: Number, default: 0 },
        testCoverage: { type: Number, default: 0 },
      },
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

    // ---- Source code (optional) ----
    _sourceCode: { type: String, default: "" },

    // ---- Token usage metadata ----
    tokensUsed: { type: Number, default: 0 },
    tokensRemaining: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Report", ReportSchema);
