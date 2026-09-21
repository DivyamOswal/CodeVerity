// src/components/Result.jsx
import { useState } from "react";
import { useAuth } from "../App";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Terminal,
  LayoutGrid,
  Shield,
  ShieldCheck,
  TrendingUp,
  Target,
  CircleDot,
  AlertCircle,
  Star,
  Check,
  AlertTriangle,
  ArrowRight,
  Zap,
  Battery,
  Download,
  Plus,
  RotateCw,
  ChevronDown,
  ChevronRight,
  Copy as CopyIcon,
  Boxes,
  FileCode2,
  ClipboardCheck,
  Wrench,
} from "lucide-react";

import { generateTests as defaultGenerateTests } from "../api/github";
import { usePreferences } from "../context/PreferencesContext";
import RepoEditor from "../components/CodeEditor/RepoEditor";
import { useToast } from "../hooks/useToast";

// ── Grade → text color ──
function gradeAccent(grade) {
  const map = {
    A: "text-[var(--color-success)]",
    B: "text-[var(--color-info)]",
    C: "text-[var(--color-warning)]",
    D: "text-[var(--color-caution)]",
    F: "text-[var(--color-danger)]",
  };
  return map[grade?.[0]] ?? "text-[var(--text-muted)]";
}

// ── Grade → glow shadow ──
function gradeGlow(grade) {
  const map = {
    A: "shadow-[0_0_24px_-8px_var(--color-success)]",
    B: "shadow-[0_0_24px_-8px_var(--color-info)]",
    C: "shadow-[0_0_24px_-8px_var(--color-warning)]",
    D: "shadow-[0_0_24px_-8px_var(--color-caution)]",
    F: "shadow-[0_0_24px_-8px_var(--color-danger)]",
  };
  return map[grade?.[0]] ?? "";
}

// ── Severity → pill styling ──
function severityColor(severity) {
  const map = {
    critical:
      "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/30",
    high: "bg-[var(--color-caution-soft)] text-[var(--color-caution)] border-[var(--color-caution)]/30",
    medium:
      "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30",
    low: "bg-[var(--color-info-soft)] text-[var(--color-info)] border-[var(--color-info)]/30",
    info: "bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border-light)]",
  };
  return (
    map[severity?.toLowerCase()] ??
    "bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border-light)]"
  );
}

// ── Category → Lucide icon for finding rows ──
const CATEGORY_ICONS = {
  security: ShieldCheck,
  bug: AlertCircle,
  performance: TrendingUp,
  maintainability: Target,
  style: LayoutGrid,
  test: ClipboardCheck,
  docs: FileCode2,
  architecture: Boxes,
  general: CircleDot,
};

function sizeFor(compact) {
  return compact
    ? {
        containerPadding: "px-3 py-4 sm:px-5 lg:px-6",
        headerMargin: "pb-3",
        headingSize: "text-lg sm:text-xl md:text-2xl",
        gradeBoxPadding: "px-3 py-2",
        gradeTextSize: "text-lg sm:text-xl",
        scoreCardGap: "gap-2",
        tabPadding: "px-2 py-2 text-[11px] sm:px-3",
        buttonPadding: "px-2 py-1 text-[11px]",
        testFilePadding: "px-2 py-1.5",
        testFileFont: "text-[11px]",
        codeBlockPadding: "p-3",
        codeBlockFont: "text-[11px]",
      }
    : {
        containerPadding: "px-3 py-5 sm:px-6 lg:px-8",
        headerMargin: "pb-5",
        headingSize: "text-xl sm:text-2xl md:text-3xl",
        gradeBoxPadding: "px-4 py-2.5",
        gradeTextSize: "text-xl sm:text-2xl",
        scoreCardGap: "gap-3",
        tabPadding: "px-3 py-2.5 text-[11px] sm:px-4 sm:text-xs",
        buttonPadding: "px-3 py-1.5 text-[11px]",
        testFilePadding: "px-3 py-2",
        testFileFont: "text-[11px]",
        codeBlockPadding: "p-4",
        codeBlockFont: "text-[11px]",
      };
}

// ── Main Component ──
export default function Result({
  data,
  sourceCode: sourceCodeProp = "",
  onDownload,
  generateTestsFn,
  repoUrl: repoUrlProp = "",
  autoFixFn,
  reportId,
}) {
  const { token } = useAuth();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState("audit");
  const [testData, setTestData] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [fixing, setFixing] = useState({});

  const { compact } = usePreferences();
  const s = sizeFor(compact);

  if (!data) return null;

  const sourceCode = sourceCodeProp || data?._sourceCode || "";
  const doGenerateTests = generateTestsFn ?? defaultGenerateTests;

  const {
    summary = "No summary generated.",
    architecture = [],
    bugs = [],
    securityIssues = [],
    futureRoadmap = [],
    toolsAndPackages = [],
    scores = {},
    grade = "N/A",
    finalVerdict = "No verdict provided.",
    repoUrl = repoUrlProp || data?.repoUrl || "",
  } = data;

  const {
    healthScore = { overall: 0, grade: "N/A", breakdown: {} },
    securityVulnerabilities = [],
    dependencyVulnerabilities = [],
    secrets = [],
    techDebt = { estimatedHours: 0, issues: [] },
    architectureGraph = { nodes: [], edges: [] },
    tokensUsed = 0,
    tokensRemaining = 0,
    complexity = {
      maxComplexity: 0,
      averageComplexity: 0,
      maintainability: 0,
      functions: [],
    },
    cveList = [],
    readmeScore = { score: 0, details: {} },
    findings = [],
    findingsSummary = null,
    strengths = [],
    risks = [],
    topPriority = "",
    actionPlan = [],
  } = data;

  const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const sortedFindings = [...findings].sort(
    (a, b) =>
      (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
      (a.file || "").localeCompare(b.file || "") ||
      (a.line || 0) - (b.line || 0)
  );

  const severityCounts =
    findingsSummary?.bySeverity ||
    (() => {
      const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
      for (const f of findings) {
        if (counts[f.severity] !== undefined) counts[f.severity] += 1;
      }
      return counts;
    })();

  const chartData = [
    { metric: "Code Quality", value: scores.codeQuality || 0 },
    { metric: "Security", value: scores.security || 0 },
    { metric: "Performance", value: scores.performance || 0 },
    { metric: "Maintainability", value: scores.maintainability || 0 },
  ];

  const runGenerateTests = async () => {
    if (!sourceCode?.trim()) {
      setTestError("No source code available. Please re-run the analysis.");
      return;
    }
    setTestLoading(true);
    setTestError(null);
    try {
      const result = await doGenerateTests(sourceCode);
      setTestData(result);
    } catch (err) {
      setTestError(err.message ?? "Test generation failed.");
    } finally {
      setTestLoading(false);
    }
  };

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (id === "tests" && !testData && !testLoading) {
      runGenerateTests();
    }
  };

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleAutoFix = async (issue, type = "bug") => {
    const issueId = issue._id || issue.id || Date.now();
    setFixing((prev) => ({ ...prev, [issueId]: true }));

    try {
      if (autoFixFn) {
        await autoFixFn(issue);
        setFixing((prev) => ({ ...prev, [issueId]: false }));
        return;
      }

      const repo = repoUrl || data?.repoUrl || repoUrlProp;
      if (!repo) {
        error("Repository URL not available. Cannot create a fix PR.");
        setFixing((prev) => ({ ...prev, [issueId]: false }));
        return;
      }

      const filePath = issue.file || issue.location || issue.filePath || "";
      const lineNumber = issue.line || issue.lineNumber || "";
      const description =
        issue.title || issue.issue || issue.description || "Fix issue";
      const suggestedFix = issue.suggestedFix || issue.fix || "";

      const response = await fetch("/api/github/auto-fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repoUrl: repo,
          issueId,
          filePath,
          lineNumber,
          description,
          currentCode: sourceCode || data?._sourceCode || "",
          suggestedFix,
        }),
      });

      const result = await response.json();
      if (result.success) {
        success(`Fix PR #${result.prNumber} created!`);
        window.open(result.prUrl, "_blank", "noopener,noreferrer");
      } else {
        error(result.error || "Failed to create fix PR.");
        if (result.action === "connect_github") {
          error(
            "Please connect your GitHub account in settings to use Auto-Fix."
          );
        }
      }
    } catch (err) {
      console.error("Auto-fix error:", err);
      error("An error occurred while creating the fix PR.");
    } finally {
      setFixing((prev) => ({ ...prev, [issueId]: false }));
    }
  };

  const TABS = [
    { id: "audit", label: "Audit Report", Icon: CircleDot },
    { id: "full", label: "Full Report", Icon: LayoutGrid },
    { id: "tests", label: "Test Cases", Icon: ClipboardCheck },
  ];

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] ${s.containerPadding}`}
    >
      {/* Background effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[30%] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--accent-soft) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--accent-soft) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl space-y-5">
        {/* Corner brackets */}
        <div className="relative">
          <span className="absolute -left-px -top-px z-10 h-4 w-4 rounded-tl-2xl border-l-2 border-t-2 border-[var(--accent)]/50" />
          <span className="absolute -right-px -top-px z-10 h-4 w-4 rounded-tr-2xl border-r-2 border-t-2 border-[var(--accent)]/50" />
          <span className="absolute -bottom-px -left-px z-10 h-4 w-4 rounded-bl-2xl border-b-2 border-l-2 border-[var(--accent)]/50" />
          <span className="absolute -bottom-px -right-px z-10 h-4 w-4 rounded-br-2xl border-b-2 border-r-2 border-[var(--accent)]/50" />
        </div>

        {/* HEADER */}
        <div
          className={`result-panel flex flex-col gap-4 border-b border-[var(--border-dark)] ${s.headerMargin} md:flex-row md:items-center md:justify-between`}
        >
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div
                className={`relative flex shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent-soft-strong)] ${
                  compact ? "h-6 w-6" : "h-8 w-8"
                }`}
              >
                <Terminal size={compact ? 13 : 16} strokeWidth={2} aria-hidden="true" />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg-primary)]" />
              </div>
              <span
                className={`font-semibold uppercase tracking-[0.2em] text-[var(--accent)] ${
                  compact ? "text-[10px]" : "text-[11px]"
                }`}
              >
                CodeVerity
              </span>
            </div>
            <h1
              className={`font-bold tracking-tight text-[var(--text-primary)] ${s.headingSize}`}
            >
              AI Code Analysis Report
            </h1>
            <p
              className={`mt-1 flex items-center gap-1.5 text-[var(--text-muted)] ${
                compact ? "text-[11px]" : "text-xs"
              }`}
            >
              <span className="h-1 w-1 rounded-full bg-[var(--color-success)]" />
              Detailed analysis of your GitHub repository.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div
              className={`rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_10px_25px_-18px_var(--accent-soft-strong)] transition-shadow duration-300 ${gradeGlow(
                grade
              )} ${s.gradeBoxPadding}`}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Final Grade
              </p>
              <div
                className={`mt-0.5 font-bold ${s.gradeTextSize} ${gradeAccent(
                  grade
                )}`}
              >
                {grade}
              </div>
            </div>
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className={`result-cta-shine group relative inline-flex items-center gap-2 overflow-hidden rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] font-semibold text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97] ${
                  compact ? "px-3 py-2 text-[11px]" : "px-4 py-2.5 text-xs"
                }`}
              >
                <Download size={14} strokeWidth={2} aria-hidden="true" className="relative z-10" />
                <span className="relative z-10">
                  {compact ? "PDF" : "Download Report"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* SCORE CARDS */}
        <div
          className={`result-panel grid grid-cols-2 ${s.scoreCardGap} md:grid-cols-4`}
          style={{ animationDelay: "0.05s" }}
        >
          <ScoreCard label="Code Quality" value={scores.codeQuality} Icon={LayoutGrid} compact={compact} />
          <ScoreCard label="Security" value={scores.security} Icon={ShieldCheck} compact={compact} />
          <ScoreCard label="Performance" value={scores.performance} Icon={TrendingUp} compact={compact} />
          <ScoreCard label="Maintainability" value={scores.maintainability} Icon={Target} compact={compact} />
        </div>

        {/* TAB BAR */}
        <div className="flex flex-col gap-2 border-b border-[var(--border-dark)] sm:flex-row sm:items-center sm:gap-0">
          <div className="flex items-center gap-0.5 overflow-x-auto sm:gap-1">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleTabClick(id)}
                aria-pressed={activeTab === id}
                className={`relative flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${s.tabPadding} ${
                  activeTab === id
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <Icon
                  size={13}
                  strokeWidth={2}
                  aria-hidden="true"
                  className={
                    activeTab === id
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-muted)]"
                  }
                />
                {label}
                {activeTab === id && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent-soft-strong)]" />
                )}
              </button>
            ))}
          </div>
          {!testData && !testLoading && activeTab === "audit" && (
            <button
              type="button"
              onClick={() => handleTabClick("tests")}
              className={`flex items-center justify-center gap-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] font-semibold text-[var(--accent)] transition-all duration-150 hover:bg-[var(--accent-soft-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97] ${s.buttonPadding} sm:mb-1 sm:ml-auto`}
            >
              <Plus size={13} strokeWidth={2.2} aria-hidden="true" />
              {compact ? "Tests" : "Generate Tests"}
            </button>
          )}
        </div>

        {/* ─────────────────────────── AUDIT TAB ─────────────────────────── */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            {topPriority && (
              <div className="result-panel rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4 shadow-[0_0_28px_-14px_var(--accent-soft-strong)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)]">
                    <Star size={16} strokeWidth={2.2} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                      Top Priority
                    </p>
                    <p
                      className={`mt-1 leading-6 text-[var(--text-primary)] ${
                        compact ? "text-xs" : "text-sm"
                      }`}
                    >
                      {topPriority}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <GlassCard title="Executive Summary" Icon={LayoutGrid} compact={compact}>
              <p
                className={`leading-6 text-[var(--text-secondary)] ${
                  compact ? "text-xs" : "text-sm"
                }`}
              >
                {summary}
              </p>

              {(strengths.length > 0 || risks.length > 0) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {strengths.length > 0 && (
                    <div className="rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-3">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-success)]">
                        <Check size={12} strokeWidth={3} aria-hidden="true" />
                        Strengths
                      </p>
                      <ul className="space-y-1.5">
                        {strengths.map((sItem, i) => (
                          <li
                            key={i}
                            className={`leading-5 text-[var(--text-secondary)] ${
                              compact ? "text-[11px]" : "text-xs"
                            }`}
                          >
                            • {sItem}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {risks.length > 0 && (
                    <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] p-3">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-danger)]">
                        <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" />
                        Risks
                      </p>
                      <ul className="space-y-1.5">
                        {risks.map((r, i) => (
                          <li
                            key={i}
                            className={`leading-5 text-[var(--text-secondary)] ${
                              compact ? "text-[11px]" : "text-xs"
                            }`}
                          >
                            • {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>

            {sortedFindings.length > 0 && (
              <GlassCard
                title={`Findings (${sortedFindings.length})`}
                Icon={AlertCircle}
                compact={compact}
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {["critical", "high", "medium", "low", "info"].map((sev) =>
                    severityCounts[sev] > 0 ? (
                      <span
                        key={sev}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${severityColor(
                          sev
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {severityCounts[sev]} {sev}
                      </span>
                    ) : null
                  )}
                </div>

                <div className="space-y-2">
                  {sortedFindings.map((finding, i) => (
                    <FindingRow
                      key={finding.id || `finding-${i}`}
                      finding={finding}
                      onFix={handleAutoFix}
                      fixing={fixing}
                      compact={compact}
                    />
                  ))}
                </div>
              </GlassCard>
            )}

            {actionPlan.length > 0 && (
              <GlassCard title="Action Plan" Icon={ArrowRight} compact={compact}>
                <ol className="space-y-2">
                  {actionPlan.map((step, i) => (
                    <li
                      key={i}
                      className={`flex gap-3 rounded-lg border border-[var(--border-dark)] bg-[var(--bg-primary)] ${
                        compact ? "p-2" : "p-3"
                      }`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)]">
                        {i + 1}
                      </span>
                      <span
                        className={`leading-6 text-[var(--text-secondary)] ${
                          compact ? "text-[11px]" : "text-xs"
                        }`}
                      >
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </GlassCard>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard title="Quality Score Analysis" Icon={Target} compact={compact}>
                <div
                  style={{
                    width: "100%",
                    height: compact ? 220 : 280,
                    minHeight: compact ? 220 : 280,
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                    <RadarChart data={chartData}>
                      <PolarGrid stroke="var(--border-light)" />
                      <PolarAngleAxis
                        dataKey="metric"
                        stroke="var(--text-muted)"
                        tick={{
                          fill: "var(--text-secondary)",
                          fontSize: compact ? 9 : 11,
                        }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 100]}
                        stroke="var(--border-light)"
                        tick={{
                          fill: "var(--text-muted)",
                          fontSize: compact ? 7 : 9,
                        }}
                      />
                      <Radar
                        dataKey="value"
                        stroke="var(--accent)"
                        fill="var(--accent)"
                        fillOpacity={0.18}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard title="Final Verdict" Icon={Check} compact={compact}>
                <div
                  className={`flex h-full items-center ${
                    compact ? "min-h-[200px]" : "min-h-[280px]"
                  }`}
                >
                  <div className="w-full">
                    <div
                      className={`flex items-center gap-3 ${
                        compact ? "mb-3" : "mb-5"
                      }`}
                    >
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_0_20px_-6px_var(--accent-soft-strong)] ${
                          compact ? "h-8 w-8" : "h-10 w-10"
                        }`}
                      >
                        <Check size={compact ? 16 : 18} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`uppercase tracking-wider text-[var(--text-muted)] ${
                            compact ? "text-[10px]" : "text-[11px]"
                          }`}
                        >
                          Overall Assessment
                        </p>
                        <p
                          className={`font-semibold text-[var(--text-primary)] ${
                            compact ? "text-xs" : "text-sm"
                          }`}
                        >
                          Repository Analysis Complete
                        </p>
                      </div>
                    </div>
                    <p
                      className={`leading-6 text-[var(--text-secondary)] ${
                        compact ? "text-xs" : "text-sm"
                      }`}
                    >
                      {finalVerdict}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            <GlassCard title="Architecture Review" Icon={Boxes} compact={compact}>
              {architecture.length ? (
                <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
                  {architecture.map((a, i) => (
                    <div
                      key={i}
                      className={`group rounded-lg border border-[var(--border-dark)] bg-[var(--bg-primary)] transition-all duration-150 hover:border-[var(--accent)]/30 hover:bg-[var(--bg-hover)]/40 ${
                        compact ? "p-2" : "p-3"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`flex shrink-0 items-center justify-center rounded bg-[var(--accent-soft)] text-[var(--accent)] transition-colors duration-150 group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-contrast)] ${
                            compact ? "h-5 w-5 text-[10px]" : "h-5 w-5 text-[10px]"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <p
                          className={`font-semibold text-[var(--accent)] ${
                            compact ? "text-[11px]" : "text-xs"
                          }`}
                        >
                          {a.component}
                        </p>
                      </div>
                      <p
                        className={`pl-7 leading-5 text-[var(--text-secondary)] ${
                          compact ? "text-[11px]" : "text-xs"
                        }`}
                      >
                        {a.recommendation || a.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No architecture insights provided." compact={compact} />
              )}
            </GlassCard>

            <GlassCard title="Identified Bugs" Icon={AlertCircle} compact={compact}>
              {bugs.length ? (
                <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
                  {bugs.map((b, i) => {
                    const issueId = b._id || b.id || i;
                    return (
                      <AlertCard key={i} type="error" compact={compact}>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div
                            className={`flex shrink-0 items-center justify-center rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] ${
                              compact ? "h-6 w-6" : "h-7 w-7"
                            }`}
                          >
                            <AlertCircle
                              size={compact ? 12 : 14}
                              strokeWidth={2.2}
                              aria-hidden="true"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`font-semibold text-[var(--text-primary)] ${
                                compact ? "text-[11px]" : "text-xs"
                              }`}
                            >
                              {b.title}{" "}
                              <span className="text-[var(--color-danger)]">
                                ({b.impact})
                              </span>
                            </p>
                            <p
                              className={`mt-1 leading-5 text-[var(--text-secondary)] ${
                                compact ? "text-[11px]" : "text-xs"
                              }`}
                            >
                              {b.description}
                            </p>
                            <p
                              className={`mt-2 text-[var(--accent)] ${
                                compact ? "text-[11px]" : "text-xs"
                              }`}
                            >
                              <span className="font-semibold">Fix:</span>{" "}
                              {b.suggestedFix || b.fix}
                            </p>
                            <AutoFixButton
                              onClick={() => handleAutoFix(b, "bug")}
                              busy={fixing[issueId]}
                              compact={compact}
                            />
                          </div>
                        </div>
                      </AlertCard>
                    );
                  })}
                </div>
              ) : (
                <EmptyState text="No major bugs detected." compact={compact} />
              )}
            </GlassCard>

            <GlassCard title="Security Assessment" Icon={Shield} compact={compact}>
              {securityIssues.length ? (
                <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
                  {securityIssues.map((sec, i) => {
                    const issueId = sec._id || sec.id || i;
                    return (
                      <AlertCard key={i} type="warning" compact={compact}>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div
                            className={`flex shrink-0 items-center justify-center rounded-lg bg-[var(--color-warning-soft)] text-[var(--color-warning)] ${
                              compact ? "h-6 w-6" : "h-7 w-7"
                            }`}
                          >
                            <AlertTriangle
                              size={compact ? 12 : 14}
                              strokeWidth={2.2}
                              aria-hidden="true"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`font-semibold text-[var(--text-primary)] ${
                                compact ? "text-[11px]" : "text-xs"
                              }`}
                            >
                              {sec.issue}
                            </p>
                            {sec.risk && (
                              <p
                                className={`mt-1 text-[var(--color-danger)] ${
                                  compact ? "text-[11px]" : "text-xs"
                                }`}
                              >
                                Risk: {sec.risk}
                              </p>
                            )}
                            <p
                              className={`mt-2 text-[var(--accent)] ${
                                compact ? "text-[11px]" : "text-xs"
                              }`}
                            >
                              Recommendation: {sec.recommendation}
                            </p>
                            <AutoFixButton
                              onClick={() => handleAutoFix(sec, "security")}
                              busy={fixing[issueId]}
                              compact={compact}
                            />
                          </div>
                        </div>
                      </AlertCard>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  text="No critical security issues reported."
                  compact={compact}
                />
              )}
            </GlassCard>

            <GlassCard title="Future Roadmap" Icon={ArrowRight} compact={compact}>
              {futureRoadmap.length ? (
                <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
                  {futureRoadmap.map((f, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 rounded-lg border border-[var(--border-dark)] bg-[var(--bg-primary)] transition-colors duration-150 hover:border-[var(--accent)]/20 sm:gap-3 ${
                        compact ? "p-2" : "p-3"
                      }`}
                    >
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] ${
                          compact ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-[10px]"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <p
                        className={`leading-5 text-[var(--text-secondary)] ${
                          compact ? "text-[11px]" : "text-xs"
                        }`}
                      >
                        <b className="text-[var(--text-primary)]">
                          {f.phase || f.feature}:
                        </b>{" "}
                        {f.details || f.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No roadmap generated." compact={compact} />
              )}
            </GlassCard>

            <GlassCard title="Tools & Packages" Icon={Wrench} compact={compact}>
              {toolsAndPackages.length ? (
                <div className={`flex flex-wrap gap-2 ${compact ? "gap-1.5" : ""}`}>
                  {toolsAndPackages.map((t, i) => (
                    <span
                      key={i}
                      className={`rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] font-mono text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] ${
                        compact
                          ? "px-2 py-0.5 text-[10px]"
                          : "px-2.5 py-1 text-[11px]"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyState text="No tools info available." compact={compact} />
              )}
            </GlassCard>
          </div>
        )}

        {/* ─────────────────────────── FULL REPORT TAB ─────────────────────────── */}
        {activeTab === "full" && (
          <div className="space-y-4">
            {(tokensUsed > 0 || tokensRemaining > 0) && (
              <div
                className={`flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] sm:gap-4 ${
                  compact ? "p-3" : "p-4"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap size={14} strokeWidth={2} aria-hidden="true" className="text-[var(--accent)]" />
                  <span
                    className={`text-[var(--text-muted)] ${
                      compact ? "text-[11px]" : "text-sm"
                    }`}
                  >
                    Tokens Used:{" "}
                    <strong className="text-[var(--text-primary)]">
                      {tokensUsed.toLocaleString()}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Battery size={14} strokeWidth={2} aria-hidden="true" className="text-[var(--accent)]" />
                  <span
                    className={`text-[var(--text-muted)] ${
                      compact ? "text-[11px]" : "text-sm"
                    }`}
                  >
                    Remaining:{" "}
                    <strong className="text-[var(--text-primary)]">
                      {tokensRemaining.toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            <GlassCard title="Health Score" Icon={LayoutGrid} compact={compact}>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <div className="flex shrink-0 flex-col items-center">
                  <div className="relative">
                    <svg
                      width={compact ? 120 : 160}
                      height={compact ? 120 : 160}
                      viewBox="0 0 120 120"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="var(--border-light)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="10"
                        strokeDasharray={`${(healthScore.overall / 100) * 314.16}, 314.16`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        style={{
                          filter: "drop-shadow(0 0 6px var(--accent-soft-strong))",
                        }}
                      />
                      <text
                        x="60"
                        y="56"
                        textAnchor="middle"
                        fontSize="24"
                        fontWeight="bold"
                        fill="var(--text-primary)"
                      >
                        {healthScore.overall}
                      </text>
                      <text
                        x="60"
                        y="76"
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--text-muted)"
                      >
                        / 100
                      </text>
                    </svg>
                  </div>
                  <div
                    className={`mt-2 flex items-center gap-2 rounded-lg border border-[var(--border-light)] px-3 py-1 font-bold ${gradeAccent(
                      healthScore.grade
                    )} ${compact ? "text-sm" : "text-base"}`}
                  >
                    Grade: {healthScore.grade}
                  </div>
                </div>
                <div className="w-full flex-1">
                  <div
                    className={`grid grid-cols-2 gap-2 ${compact ? "gap-1.5" : ""}`}
                  >
                    <ScoreMini
                      label="Code Quality"
                      value={healthScore.breakdown?.codeQuality || 0}
                      compact={compact}
                    />
                    <ScoreMini
                      label="Security"
                      value={healthScore.breakdown?.security || 0}
                      compact={compact}
                    />
                    <ScoreMini
                      label="Performance"
                      value={healthScore.breakdown?.performance || 0}
                      compact={compact}
                    />
                    <ScoreMini
                      label="Maintainability"
                      value={healthScore.breakdown?.maintainability || 0}
                      compact={compact}
                    />
                  </div>
                  <p
                    className={`mt-3 text-[var(--text-muted)] ${
                      compact ? "text-[11px]" : "text-xs"
                    }`}
                  >
                    Health score combines code quality, security, performance,
                    and maintainability, with penalties for vulnerabilities and
                    technical debt.
                  </p>
                </div>
              </div>
            </GlassCard>

            {complexity.functions && complexity.functions.length > 0 && (
              <GlassCard title="Cyclomatic Complexity" Icon={LayoutGrid} compact={compact}>
                <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
                  <MetricBox label="Max Complexity" value={complexity.maxComplexity} />
                  <MetricBox label="Average" value={complexity.averageComplexity} />
                  <MetricBox label="Maintainability" value={`${complexity.maintainability}%`} />
                </div>
                <div className="max-h-40 overflow-y-auto text-xs">
                  {complexity.functions.slice(0, 10).map((fn, i) => (
                    <div
                      key={i}
                      className="flex justify-between gap-2 border-b border-[var(--border-dark)] py-1"
                    >
                      <span className="max-w-[70%] truncate font-mono">
                        {fn.functionName}
                      </span>
                      <span className="shrink-0 text-[var(--text-muted)]">
                        complexity {fn.complexity}
                      </span>
                    </div>
                  ))}
                  {complexity.functions.length > 10 && (
                    <p className="pt-1 text-[11px] text-[var(--text-muted)]">
                      + {complexity.functions.length - 10} more functions
                    </p>
                  )}
                </div>
              </GlassCard>
            )}

            {cveList && cveList.length > 0 && (
              <GlassCard
                title="Dependency Vulnerabilities (CVEs)"
                Icon={Shield}
                compact={compact}
              >
                <div className="space-y-2">
                  {cveList.map((cve, i) => (
                    <div
                      key={i}
                      className={`flex flex-col gap-2 rounded-lg border p-2 transition-transform duration-150 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between ${severityColor(
                        cve.severity
                      )}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-mono text-xs sm:text-sm">
                          {cve.package}@{cve.version}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {cve.title}
                        </p>
                        {cve.cve && cve.cve !== "N/A" && (
                          <p className="text-xs text-[var(--text-muted)]">
                            CVE: {cve.cve}
                          </p>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-[var(--text-muted)]">
                          Fix: <span className="font-mono">{cve.fixedIn}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {readmeScore && readmeScore.score > 0 && (
              <GlassCard title="README Quality" Icon={LayoutGrid} compact={compact}>
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <div className="relative h-20 w-20 shrink-0">
                    <svg viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="var(--border-light)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="8"
                        strokeDasharray={`${readmeScore.score * 2.83}, 283`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <text
                        x="50"
                        y="56"
                        textAnchor="middle"
                        fontSize="20"
                        fontWeight="bold"
                        fill="var(--text-primary)"
                      >
                        {readmeScore.score}%
                      </text>
                    </svg>
                  </div>
                  <div className="min-w-0 text-center sm:text-left">
                    <p className="text-sm text-[var(--text-secondary)]">
                      {readmeScore.score >= 80
                        ? "Well documented"
                        : readmeScore.score >= 50
                          ? "Needs improvement"
                          : "Missing documentation"}
                    </p>
                    {readmeScore.details &&
                      readmeScore.details.missingSections && (
                        <p className="text-xs text-[var(--text-muted)]">
                          Missing:{" "}
                          {readmeScore.details.missingSections.join(", ") ||
                            "All sections present!"}
                        </p>
                      )}
                  </div>
                </div>
              </GlassCard>
            )}

            {securityVulnerabilities.length > 0 && (
              <GlassCard
                title={`Security Vulnerabilities (${securityVulnerabilities.length})`}
                Icon={Shield}
                compact={compact}
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-dark)]">
                        {["Severity", "Title", "File", "Line"].map((h) => (
                          <th
                            key={h}
                            className="whitespace-nowrap pb-2 pr-4 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {securityVulnerabilities.map((v, i) => (
                        <tr
                          key={i}
                          className="border-b border-[var(--border-dark)] transition-colors duration-150 last:border-none hover:bg-[var(--bg-hover)]/40"
                        >
                          <td className="py-2 pr-4">
                            <span
                              className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium ${severityColor(
                                v.severity
                              )}`}
                            >
                              {v.severity}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-[var(--text-secondary)]">
                            {v.title}
                          </td>
                          <td className="py-2 pr-4 font-mono text-[var(--text-muted)]">
                            {v.file || ""}
                          </td>
                          <td className="py-2 font-mono text-[var(--text-muted)]">
                            {v.line || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            {dependencyVulnerabilities.length > 0 && (
              <GlassCard
                title={`Dependency Vulnerabilities (${dependencyVulnerabilities.length})`}
                Icon={Shield}
                compact={compact}
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-dark)]">
                        {["Package", "Version", "CVE", "Severity", "Fixed In"].map(
                          (h) => (
                            <th
                              key={h}
                              className="whitespace-nowrap pb-2 pr-4 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {dependencyVulnerabilities.map((v, i) => (
                        <tr
                          key={i}
                          className="border-b border-[var(--border-dark)] transition-colors duration-150 last:border-none hover:bg-[var(--bg-hover)]/40"
                        >
                          <td className="py-2 pr-4 font-mono text-[var(--text-secondary)]">
                            {v.package}
                          </td>
                          <td className="py-2 pr-4 font-mono text-[var(--text-muted)]">
                            {v.version}
                          </td>
                          <td className="py-2 pr-4 font-mono text-[var(--accent)]">
                            {v.cve}
                          </td>
                          <td className="py-2 pr-4">
                            <span
                              className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium ${severityColor(
                                v.severity
                              )}`}
                            >
                              {v.severity}
                            </span>
                          </td>
                          <td className="py-2 font-mono text-[var(--text-muted)]">
                            {v.fixedIn}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            {(() => {
              const filteredSecrets = secrets.filter((sec) => {
                if (
                  sec.file?.includes("package-lock.json") ||
                  sec.file?.includes("package.json")
                )
                  return false;
                if (
                  sec.file?.includes("yarn.lock") ||
                  sec.file?.includes("pnpm-lock.yaml")
                )
                  return false;
                if (
                  sec.pattern === "Generic Secret" ||
                  sec.pattern?.toLowerCase().includes("generic")
                )
                  return false;
                if (sec.confidence && sec.confidence < 40) return false;
                return true;
              });
              if (filteredSecrets.length === 0) return null;
              return (
                <GlassCard
                  title={`Detected Secrets (${filteredSecrets.length})`}
                  Icon={AlertCircle}
                  compact={compact}
                >
                  <div className="space-y-2">
                    {filteredSecrets.map((sec, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] p-2"
                      >
                        <span className="rounded bg-[var(--color-danger-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-danger)]">
                          {sec.pattern}
                        </span>
                        <span className="break-all font-mono text-xs text-[var(--text-secondary)]">
                          {sec.file}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          line {sec.line}
                        </span>
                        <span className="ml-auto text-[10px] text-[var(--text-muted)]">
                          Confidence: {sec.confidence}%
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              );
            })()}

            <GlassCard title="Technical Debt" Icon={Shield} compact={compact}>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-2 shadow-[0_0_20px_-10px_var(--accent-soft-strong)]">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      Estimated Hours
                    </p>
                    <p className="result-metric-glow text-2xl font-bold">
                      {techDebt.estimatedHours}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Estimated effort to fix all identified issues.
                  </p>
                </div>
                {techDebt.issues?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-[var(--text-muted)]">
                      Breakdown:
                    </p>
                    {techDebt.issues.map((issue, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border-dark)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs transition-colors duration-150 hover:border-[var(--border-light)] sm:gap-3"
                      >
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            issue.severity === "critical"
                              ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                              : issue.severity === "major"
                                ? "bg-[var(--color-caution-soft)] text-[var(--color-caution)]"
                                : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                          }`}
                        >
                          {issue.severity}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[var(--text-secondary)]">
                          {issue.description}
                        </span>
                        <span className="shrink-0 font-mono text-[var(--text-muted)]">
                          {issue.effort}h
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>

            {architectureGraph.nodes?.length > 0 && (
              <GlassCard title="Architecture Graph" Icon={Boxes} compact={compact}>
                <div className="overflow-x-auto">
                  <div className="min-w-[300px]">
                    <svg
                      width="100%"
                      height="400"
                      viewBox="0 0 800 400"
                      className="mx-auto"
                    >
                      {(() => {
                        const nodes = architectureGraph.nodes || [];
                        const edges = architectureGraph.edges || [];
                        const centerX = 400,
                          centerY = 200;
                        const radius = 150;
                        const n = nodes.length;
                        if (n === 0) return null;
                        const positions = nodes.map((node, i) => {
                          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
                          return {
                            x: centerX + radius * Math.cos(angle),
                            y: centerY + radius * Math.sin(angle),
                          };
                        });
                        const nodeMap = Object.fromEntries(
                          nodes.map((node, i) => [node.id, i])
                        );
                        return (
                          <>
                            {edges.map((edge, i) => {
                              const fromIdx = nodeMap[edge.from];
                              const toIdx = nodeMap[edge.to];
                              if (fromIdx === undefined || toIdx === undefined)
                                return null;
                              return (
                                <line
                                  key={`edge-${i}`}
                                  x1={positions[fromIdx].x}
                                  y1={positions[fromIdx].y}
                                  x2={positions[toIdx].x}
                                  y2={positions[toIdx].y}
                                  stroke="var(--border-light)"
                                  strokeWidth="2"
                                  opacity="0.5"
                                />
                              );
                            })}
                            {nodes.map((node, i) => (
                              <g key={node.id}>
                                <circle
                                  cx={positions[i].x}
                                  cy={positions[i].y}
                                  r="20"
                                  fill="var(--bg-card)"
                                  stroke="var(--accent)"
                                  strokeWidth="2"
                                />
                                <text
                                  x={positions[i].x}
                                  y={positions[i].y + 5}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill="var(--text-secondary)"
                                  className="font-mono"
                                >
                                  {node.label}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                  Visualisation of module dependencies. Each node represents a
                  file or module; edges show import relationships.
                </p>
              </GlassCard>
            )}

            {!healthScore.overall &&
              !securityVulnerabilities.length &&
              !dependencyVulnerabilities.length &&
              !secrets.length &&
              !techDebt.estimatedHours &&
              !architectureGraph.nodes?.length &&
              !complexity.functions?.length &&
              !cveList?.length &&
              !readmeScore?.score && (
                <EmptyState
                  text="No enhanced analysis data available. Run a fresh analysis to see health score, vulnerabilities, and more."
                  compact={compact}
                />
              )}
          </div>
        )}

        {/* ─────────────────────────── TESTS TAB ─────────────────────────── */}
        {activeTab === "tests" && (
          <div className="space-y-4">
            {testLoading && (
              <GlassCard title="Generating Tests..." Icon={CircleDot} compact={compact}>
                <div
                  className={`flex flex-col items-center gap-4 ${
                    compact ? "py-8" : "py-12"
                  }`}
                >
                  <div className="relative flex h-12 w-12 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
                    <div
                      className="absolute inset-2 rounded-full border-2 border-transparent border-b-[var(--accent)]/40"
                      style={{ animation: "spin 1s linear infinite reverse" }}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className={`font-medium text-[var(--text-secondary)] ${
                        compact ? "text-xs" : "text-sm"
                      }`}
                    >
                      Analysing repository
                    </p>
                    <p
                      className={`mt-1 text-[var(--text-muted)] ${
                        compact ? "text-[11px]" : "text-xs"
                      }`}
                    >
                      Writing test cases based on your code...
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            {testError && !testLoading && (
              <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
                    <AlertCircle size={16} strokeWidth={2.2} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Test Generation Failed
                    </p>
                    <p className="mt-1 whitespace-pre-line text-xs leading-5 text-[var(--text-secondary)]">
                      {testError}
                    </p>
                    <button
                      type="button"
                      onClick={runGenerateTests}
                      className="mt-3 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition-all duration-150 hover:bg-[var(--color-danger)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97]"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {testData && !testLoading && (
              <>
                <div
                  className={`flex flex-wrap items-center gap-2 ${
                    compact ? "gap-1.5" : ""
                  }`}
                >
                  <Badge color="accent" compact={compact}>
                    Framework: {testData.framework ?? "jest"}
                  </Badge>
                  <Badge color="accent" compact={compact}>
                    Est. Coverage:{" "}
                    {testData.coverageSummary?.estimatedCoverage ?? 0}%
                  </Badge>
                  <span
                    className={`w-full text-[var(--text-muted)] sm:ml-auto sm:w-auto ${
                      compact ? "text-[10px]" : "text-[11px]"
                    }`}
                  >
                    {testData.setupInstructions}
                  </span>
                </div>

                {testData.coverageSummary && (
                  <GlassCard title="Coverage Summary" Icon={CircleDot} compact={compact}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-[var(--text-secondary)] ${
                            compact ? "text-[11px]" : "text-xs"
                          }`}
                        >
                          Estimated Coverage
                        </span>
                        <span
                          className={`result-metric-glow font-bold ${
                            compact ? "text-xs" : "text-sm"
                          }`}
                        >
                          {testData.coverageSummary.estimatedCoverage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--border-dark)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent-soft-strong)] transition-all duration-700"
                          style={{
                            width: `${testData.coverageSummary.estimatedCoverage}%`,
                          }}
                        />
                      </div>
                      <p
                        className={`leading-5 text-[var(--text-secondary)] ${
                          compact ? "text-[11px]" : "text-xs"
                        }`}
                      >
                        {testData.coverageSummary.recommendation}
                      </p>
                      {testData.coverageSummary.uncoveredAreas?.length > 0 && (
                        <div
                          className={`flex flex-wrap gap-2 pt-1 ${
                            compact ? "gap-1.5" : ""
                          }`}
                        >
                          {testData.coverageSummary.uncoveredAreas.map((a, i) => (
                            <span
                              key={i}
                              className={`rounded-md border border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] text-[var(--color-warning)] ${
                                compact
                                  ? "px-1.5 py-0.5 text-[10px]"
                                  : "px-2 py-1 text-[11px]"
                              }`}
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                )}

                {testData.testFiles?.length > 0 && (
                  <GlassCard title="Generated Test Files" Icon={Shield} compact={compact}>
                    <div className={`space-y-3 ${compact ? "space-y-2" : ""}`}>
                      {testData.testFiles.map((file, i) => (
                        <div
                          key={i}
                          className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] transition-colors duration-150 hover:border-[var(--accent)]/30"
                        >
                          <div
                            className={`flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-dark)] bg-[var(--bg-card)] ${s.testFilePadding}`}
                          >
                            <span
                              className={`max-w-[60%] truncate font-mono text-[var(--accent)] ${s.testFileFont}`}
                            >
                              {file.fileName}
                            </span>
                            <div className="flex items-center gap-3">
                              <span
                                className={`hidden max-w-[300px] truncate text-[var(--text-muted)] md:block ${
                                  compact ? "text-[10px]" : "text-[11px]"
                                }`}
                              >
                                {file.description}
                              </span>
                              <CopyButton
                                id={`file-${i}`}
                                text={file.testCode}
                                copiedId={copiedId}
                                onCopy={copy}
                                compact={compact}
                              />
                            </div>
                          </div>
                          <pre
                            className={`overflow-x-auto bg-[var(--bg-primary)] text-[var(--text-secondary)] ${s.codeBlockPadding} ${s.codeBlockFont}`}
                          >
                            <code>{file.testCode}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {testData.unitTests?.length > 0 && (
                  <GlassCard title="Unit Tests" Icon={Shield} compact={compact}>
                    <div className={`space-y-5 ${compact ? "space-y-3" : ""}`}>
                      {testData.unitTests.map((fn, i) => (
                        <div key={i}>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span
                              className={`font-mono font-semibold text-[var(--accent)] ${
                                compact ? "text-[11px]" : "text-xs"
                              }`}
                            >
                              {fn.functionName}()
                            </span>
                            <span
                              className={`break-all text-[var(--text-muted)] ${
                                compact ? "text-[10px]" : "text-[11px]"
                              }`}
                            >
                              {fn.filePath}
                            </span>
                          </div>
                          <p
                            className={`mb-3 text-[var(--text-muted)] ${
                              compact ? "text-[11px]" : "text-[11px]"
                            }`}
                          >
                            {fn.description}
                          </p>
                          <div
                            className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}
                          >
                            {fn.cases?.map((c, j) => (
                              <TestCaseRow
                                key={j}
                                testCase={c}
                                id={`unit-${i}-${j}`}
                                copiedId={copiedId}
                                onCopy={copy}
                                compact={compact}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {testData.edgeCases?.length > 0 && (
                  <GlassCard title="Edge Cases" Icon={AlertCircle} compact={compact}>
                    <div className={`space-y-3 ${compact ? "space-y-2" : ""}`}>
                      {testData.edgeCases.map((c, i) => (
                        <div key={i}>
                          <p
                            className={`mb-1 font-mono text-[var(--color-warning)] ${
                              compact ? "text-[10px]" : "text-[11px]"
                            }`}
                          >
                            {c.functionName}()
                          </p>
                          <TestCaseRow
                            testCase={c}
                            id={`edge-${i}`}
                            copiedId={copiedId}
                            onCopy={copy}
                            accent="warning"
                            compact={compact}
                          />
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {testData.integrationTests?.length > 0 && (
                  <GlassCard title="Integration Tests" Icon={TrendingUp} compact={compact}>
                    <div className={`space-y-3 ${compact ? "space-y-2" : ""}`}>
                      {testData.integrationTests.map((t, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border border-[var(--border-dark)] bg-[var(--bg-primary)] transition-colors duration-150 hover:border-[var(--accent)]/20 ${
                            compact ? "p-3" : "p-4"
                          }`}
                        >
                          <p
                            className={`font-semibold text-[var(--text-primary)] ${
                              compact ? "text-[11px]" : "text-xs"
                            }`}
                          >
                            {t.label}
                          </p>
                          <p
                            className={`mb-3 mt-1 text-[var(--text-muted)] ${
                              compact ? "text-[11px]" : "text-[11px]"
                            }`}
                          >
                            {t.description}
                          </p>
                          <div className="relative">
                            <pre
                              className={`overflow-x-auto rounded-lg border border-[var(--border-dark)] bg-[var(--bg-primary)] pr-16 text-[var(--accent)] ${s.codeBlockPadding} ${s.codeBlockFont}`}
                            >
                              <code>{t.codeSnippet}</code>
                            </pre>
                            <div className="absolute right-2 top-2">
                              <CopyButton
                                id={`int-${i}`}
                                text={t.codeSnippet}
                                copiedId={copiedId}
                                onCopy={copy}
                                compact={compact}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {testData.mocks?.length > 0 && (
                  <GlassCard title="Mocks & Stubs" Icon={Shield} compact={compact}>
                    <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
                      {testData.mocks.map((m, i) => (
                        <AlertCard key={i} type="warning" compact={compact}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                            <div className="min-w-0 flex-1">
                              <p
                                className={`break-all font-mono font-semibold text-[var(--color-warning)] ${
                                  compact ? "text-[11px]" : "text-xs"
                                }`}
                              >
                                {m.target}
                              </p>
                              <p
                                className={`mt-1 text-[var(--text-secondary)] ${
                                  compact ? "text-[11px]" : "text-[11px]"
                                }`}
                              >
                                {m.reason}
                              </p>
                              <pre
                                className={`mt-2 overflow-x-auto text-[var(--color-warning)] ${
                                  compact ? "text-[10px]" : "text-[11px]"
                                }`}
                              >
                                <code>{m.snippet}</code>
                              </pre>
                            </div>
                            <div className="shrink-0 self-start">
                              <CopyButton
                                id={`mock-${i}`}
                                text={m.snippet}
                                copiedId={copiedId}
                                onCopy={copy}
                                compact={compact}
                              />
                            </div>
                          </div>
                        </AlertCard>
                      ))}
                    </div>
                  </GlassCard>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={runGenerateTests}
                    disabled={testLoading}
                    className={`flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${
                      compact ? "px-2 py-1.5 text-[11px]" : "px-3 py-2 text-[11px]"
                    }`}
                  >
                    <RotateCw size={13} strokeWidth={2} aria-hidden="true" />
                    {compact ? "Re-gen" : "Re-generate Tests"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Quick Fix Editor ─────────────────────────── */}
        {data && data.repoUrl && reportId && (
          <div className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Quick Fix Editor
            </h3>
            <RepoEditor repoUrl={data.repoUrl} reportId={reportId} />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function GlassCard({ title, children, Icon, compact }) {
  return (
    <div className="result-glass-card overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[var(--shadow-md)]">
      <div
        className={`flex items-center gap-2 border-b border-[var(--border-dark)] ${
          compact ? "px-3 py-2" : "px-4 py-3"
        }`}
      >
        {Icon && (
          <span
            className={`flex shrink-0 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)] ${
              compact ? "h-5 w-5" : "h-6 w-6"
            }`}
          >
            <Icon size={compact ? 11 : 13} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
        <h2
          className={`font-semibold uppercase tracking-wide text-[var(--text-secondary)] ${
            compact ? "text-[11px]" : "text-xs"
          }`}
        >
          {title}
        </h2>
      </div>
      <div className={compact ? "p-3" : "p-4"}>{children}</div>
    </div>
  );
}

function AlertCard({ children, type, compact }) {
  const styles = {
    error:
      "border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] border-l-2 border-l-[var(--color-danger)]",
    warning:
      "border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] border-l-2 border-l-[var(--color-warning)]",
  };
  return (
    <div
      className={`rounded-lg border transition-colors duration-150 ${
        compact ? "p-2" : "p-3"
      } ${styles[type] || "border-[var(--border-light)] bg-[var(--bg-card)]"}`}
    >
      {children}
    </div>
  );
}

function ScoreCard({ label, value, Icon, compact }) {
  const val = typeof value === "number" ? Math.min(Math.max(value, 0), 100) : 0;
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-[0_14px_30px_-20px_var(--accent-soft-strong)] ${
        compact ? "p-2.5" : "p-3.5"
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[var(--accent-soft)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-60"
      />
      <div className="relative flex items-center justify-between">
        <div
          className={`flex items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] transition-colors duration-200 group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-contrast)] ${
            compact ? "h-6 w-6" : "h-7 w-7"
          }`}
        >
          <Icon size={compact ? 12 : 14} strokeWidth={2} aria-hidden="true" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
          Score
        </span>
      </div>
      <div
        className={`relative flex items-end justify-between ${
          compact ? "mt-2" : "mt-3"
        }`}
      >
        <div className="min-w-0">
          <p
            className={`text-[var(--text-muted)] ${
              compact ? "text-[10px]" : "text-[11px]"
            }`}
          >
            {label}
          </p>
          <p
            className={`result-metric-glow mt-0.5 font-bold ${
              compact ? "text-lg" : "text-xl"
            }`}
          >
            {val || "N/A"}
          </p>
        </div>
        <span
          className={`mb-1 shrink-0 text-[var(--text-muted)] ${
            compact ? "text-[10px]" : "text-[11px]"
          }`}
        >
          /100
        </span>
      </div>
      <div
        className={`relative overflow-hidden rounded-full bg-[var(--border-dark)] ${
          compact ? "mt-1.5 h-0.5" : "mt-2 h-1"
        }`}
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-soft-strong)] transition-all duration-700"
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}

function Badge({ children, color = "accent", compact }) {
  const colors = {
    accent:
      "border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]",
    warning:
      "border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  };
  return (
    <span
      className={`rounded-md border font-medium ${
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      } ${colors[color] || colors.accent}`}
    >
      {children}
    </span>
  );
}

function CopyButton({ id, text, copiedId, onCopy, compact }) {
  const isCopied = copiedId === id;
  return (
    <button
      type="button"
      onClick={() => onCopy(text, id)}
      aria-label={isCopied ? "Copied" : "Copy code"}
      className={`inline-flex items-center gap-1 rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 active:scale-[0.95] ${
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
      }`}
    >
      {isCopied ? (
        <>
          <Check size={11} strokeWidth={2.6} aria-hidden="true" />
          {compact ? "" : "Copied"}
        </>
      ) : (
        <>
          <CopyIcon size={11} strokeWidth={2} aria-hidden="true" />
          {compact ? "" : "Copy"}
        </>
      )}
    </button>
  );
}

function AutoFixButton({ onClick, busy, compact }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`mt-2 inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_4px_14px_-6px_var(--accent-soft-strong)] transition-all duration-150 hover:bg-[var(--accent-hover)] hover:shadow-[0_6px_18px_-6px_var(--accent-soft-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.96] disabled:opacity-50 disabled:active:scale-100 ${
        compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]"
      }`}
    >
      {busy ? (
        <>
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-t-transparent border-current" />
          Fixing…
        </>
      ) : (
        <>
          <Zap size={12} strokeWidth={2.4} aria-hidden="true" />
          Auto-Fix
        </>
      )}
    </button>
  );
}

function TestCaseRow({
  testCase: c,
  id,
  copiedId,
  onCopy,
  accent = "secondary",
  compact,
}) {
  const accentColors = {
    secondary: "text-[var(--accent-secondary)]",
    warning: "text-[var(--color-warning)]",
  };
  return (
    <div
      className={`rounded-lg border border-[var(--border-dark)] bg-[var(--bg-primary)] transition-colors duration-150 hover:border-[var(--border-light)] ${
        compact ? "p-2" : "p-3"
      }`}
    >
      <div className={`flex items-center gap-2 ${compact ? "mb-1.5" : "mb-2"}`}>
        <TypeBadge type={c.type} compact={compact} />
        <span
          className={`text-[var(--text-secondary)] ${
            compact ? "text-[11px]" : "text-[11px]"
          }`}
        >
          {c.label}
        </span>
      </div>
      <div
        className={`flex flex-col gap-1 text-[var(--text-muted)] sm:flex-row sm:gap-5 ${
          compact ? "text-[10px]" : "text-[11px]"
        }`}
      >
        <span className="break-all">
          Input: <span className="text-[var(--text-secondary)]">{c.input}</span>
        </span>
        <span className="break-all">
          Expected:{" "}
          <span className="text-[var(--text-secondary)]">{c.expected}</span>
        </span>
      </div>
      {c.codeSnippet && (
        <div className="relative">
          <pre
            className={`overflow-x-auto rounded-lg border border-[var(--border-dark)] bg-[var(--bg-primary)] pr-12 ${
              accentColors[accent] || "text-[var(--accent)]"
            } ${compact ? "p-2 text-[10px]" : "p-3 text-[11px]"}`}
          >
            <code>{c.codeSnippet}</code>
          </pre>
          <div className="absolute right-2 top-2">
            <CopyButton
              id={id}
              text={c.codeSnippet}
              copiedId={copiedId}
              onCopy={onCopy}
              compact={compact}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type, compact }) {
  const map = {
    unit: {
      label: "unit",
      cls: "border-[var(--accent-secondary)]/20 bg-[var(--accent-secondary-soft)] text-[var(--accent-secondary)]",
    },
    edge: {
      label: "edge",
      cls: "border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    },
    integration: {
      label: "integration",
      cls: "border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]",
    },
  };
  const { label, cls } = map[type] ?? {
    label: type,
    cls: "border-[var(--border-light)] bg-[var(--bg-hover)] text-[var(--text-secondary)]",
  };
  return (
    <span
      className={`rounded border font-mono uppercase tracking-wide ${
        compact ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-[10px]"
      } ${cls}`}
    >
      {label}
    </span>
  );
}

function EmptyState({ text, compact }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] ${
        compact ? "px-2 py-2" : "px-3 py-4"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)] ${
          compact ? "h-5 w-5" : "h-6 w-6"
        }`}
      >
        <Check size={compact ? 11 : 13} strokeWidth={2.4} aria-hidden="true" />
      </span>
      <p
        className={`text-[var(--text-muted)] ${
          compact ? "text-[11px]" : "text-xs"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function ScoreMini({ label, value, compact }) {
  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-2 text-center transition-colors duration-150 hover:border-[var(--accent)]/30">
      <p
        className={`text-[var(--text-muted)] ${
          compact ? "text-[10px]" : "text-[11px]"
        }`}
      >
        {label}
      </p>
      <p
        className={`result-metric-glow font-bold ${
          compact ? "text-sm" : "text-base"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MetricBox({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-2 text-center transition-colors duration-150 hover:border-[var(--accent)]/30">
      <p className="text-[10px] text-[var(--text-muted)] sm:text-xs">{label}</p>
      <p className="result-metric-glow text-lg font-bold sm:text-xl">{value}</p>
    </div>
  );
}

// ─── FindingRow: expandable finding card ──────────────────────
function FindingRow({ finding, onFix, fixing, compact }) {
  const [expanded, setExpanded] = useState(false);

  const {
    id,
    severity = "medium",
    category = "general",
    file,
    line,
    endLine,
    title,
    description,
    whyItMatters,
    suggestedFix,
    references = [],
    source,
  } = finding;

  const issueId = id || title;
  const isFixing = fixing?.[issueId];

  const hasFix = Boolean(suggestedFix);
  const hasRefs = references.length > 0;

  const CategoryIcon = CATEGORY_ICONS[category] ?? CircleDot;

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-colors duration-150 ${severityColor(
        severity
      )}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 p-3 text-left transition-colors duration-150 hover:bg-[var(--bg-hover)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-inset"
      >
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-black/10">
          <CategoryIcon size={12} strokeWidth={2.2} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-current/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {severity}
            </span>
            <span className="rounded border border-[var(--border-light)] bg-[var(--bg-card)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {category}
            </span>
            {source && (
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                {source}
              </span>
            )}
          </div>

          <p
            className={`mt-1.5 font-semibold text-[var(--text-primary)] ${
              compact ? "text-[11px]" : "text-xs"
            }`}
          >
            {title}
          </p>

          {file && (
            <p
              className={`mt-0.5 font-mono text-[var(--text-muted)] ${
                compact ? "text-[10px]" : "text-[11px]"
              }`}
            >
              {file}
              {line ? `:${line}` : ""}
              {endLine && endLine !== line ? `–${endLine}` : ""}
            </p>
          )}
        </div>

        <span className="mt-1 shrink-0 text-[var(--text-muted)]" aria-hidden="true">
          {expanded ? (
            <ChevronDown size={14} strokeWidth={2} />
          ) : (
            <ChevronRight size={14} strokeWidth={2} />
          )}
        </span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-current/20 bg-[var(--bg-primary)]/40 p-3">
          {description && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Description
              </p>
              <p
                className={`leading-5 text-[var(--text-secondary)] ${
                  compact ? "text-[11px]" : "text-xs"
                }`}
              >
                {description}
              </p>
            </div>
          )}

          {whyItMatters && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Why it matters
              </p>
              <p
                className={`leading-5 text-[var(--text-secondary)] ${
                  compact ? "text-[11px]" : "text-xs"
                }`}
              >
                {whyItMatters}
              </p>
            </div>
          )}

          {hasFix && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                Suggested fix
              </p>
              <pre
                className={`overflow-x-auto rounded-lg border border-[var(--border-dark)] bg-[var(--bg-card)] p-3 text-[var(--accent)] ${
                  compact ? "text-[10px]" : "text-[11px]"
                }`}
              >
                <code>{suggestedFix}</code>
              </pre>
            </div>
          )}

          {hasRefs && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                References
              </p>
              <ul className="space-y-1">
                {references.map((ref, i) => (
                  <li key={i}>
                    <a
                      href={ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`break-all text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2 hover:decoration-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 rounded ${
                        compact ? "text-[10px]" : "text-[11px]"
                      }`}
                    >
                      {ref}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {file && (
            <AutoFixButton
              onClick={() =>
                onFix(
                  {
                    _id: issueId,
                    title,
                    description,
                    file,
                    line,
                    suggestedFix,
                  },
                  category
                )
              }
              busy={isFixing}
              compact={compact}
            />
          )}
        </div>
      )}
    </div>
  );
}