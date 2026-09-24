// src/pages/Dashboard.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Boxes,
  Cog,
  Zap,
  Shield,
  Check,
  ArrowRight,
  AlertCircle,
  Sparkles,
  TrendingUp,
  History,
  FolderGit2,
  Rocket,
} from "lucide-react";

import { fetchDashboard } from "../api/dashboard";
import { analyzeGithub, generateTests } from "../api/github";
import { getReport } from "../api/report";
import Result from "../components/Result";
import { usePreferences } from "../context/PreferencesContext";
import { useToast } from "../hooks/useToast";
import { gsap, useGSAP } from "../lib/gsap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Grade styles ─────────────────────────────────────────────
const GRADE_STYLES = {
  A: {
    text: "text-[var(--color-success)]",
    bg: "bg-[var(--color-success-soft)]",
    border: "border-[var(--color-success)]/20",
  },
  B: {
    text: "text-[var(--color-info)]",
    bg: "bg-[var(--color-info-soft)]",
    border: "border-[var(--color-info)]/20",
  },
  C: {
    text: "text-[var(--color-warning)]",
    bg: "bg-[var(--color-warning-soft)]",
    border: "border-[var(--color-warning)]/20",
  },
  D: {
    text: "text-[var(--color-caution)]",
    bg: "bg-[var(--color-caution-soft)]",
    border: "border-[var(--color-caution)]/20",
  },
  F: {
    text: "text-[var(--color-danger)]",
    bg: "bg-[var(--color-danger-soft)]",
    border: "border-[var(--color-danger)]/20",
  },
};

const FALLBACK_GRADE_STYLE = {
  text: "text-[var(--text-secondary)]",
  bg: "bg-[var(--bg-primary)]",
  border: "border-[var(--border-light)]",
};

const FEATURES = [
  { label: "Architecture", Icon: Boxes },
  { label: "Bug detection", Icon: Zap },
  { label: "Security", Icon: Shield },
  { label: "Test generation", Icon: Check },
  { label: "Roadmap", Icon: ArrowRight },
];

// ─── Helpers ──────────────────────────────────────────────────
function getRepoOwner(repoUrl) {
  const m = String(repoUrl || "").match(/github\.com\/([^\/]+)/);
  return m ? m[1] : null;
}

function getRepoName(repoUrl) {
  return (
    String(repoUrl || "")
      .replace("https://github.com/", "")
      .replace(/\.git$/, "") || "Unknown repo"
  );
}

function initialsOf(label) {
  if (!label) return "?";
  const parts = label.trim().split(/[\s\/\-_.]+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

function greetingForName(name) {
  if (!name) return "Welcome back";
  const first = name.trim().split(/\s+/)[0];
  return `Welcome back, ${first}`;
}

// ─── Size system ──────────────────────────────────────────────
function sizeFor(compact) {
  return compact
    ? {
        mainPadding: "px-4 py-4 sm:px-4 lg:px-6",
        topPadding: "pt-20",
        headerSpacing: "gap-0.5",
        heading: "text-lg sm:text-xl",
        subHeading: "text-[11px]",
        statsGap: "gap-2",
        statCardPadding: "p-3",
        statValue: "text-xl",
        analyzerPadding: "p-4 sm:p-4",
        analyzerHeaderGap: "mb-3 gap-2",
        analyzerIconSize: "h-8 w-8",
        analyzerTitle: "text-xs sm:text-sm",
        analyzerDesc: "text-[10px] sm:text-[11px]",
        inputHeight: "h-10",
        inputPadding: "pl-8 pr-3",
        buttonPadding: "px-4 py-2 text-[11px]",
        featuresGap: "gap-1.5",
        featuresTag: "px-2 py-1 text-[10px]",
        recentHeaderPadding: "px-4 py-3",
        recentTitle: "text-xs",
        recentSub: "text-[10px]",
        reportRowPadding: "px-2 py-2",
        emptyStatePadding: "py-8 px-4",
        footerMargin: "mt-4",
        footerText: "text-[10px]",
      }
    : {
        mainPadding: "px-4 py-6 sm:px-6 lg:px-8",
        topPadding: "pt-24",
        headerSpacing: "gap-1",
        heading: "text-xl sm:text-2xl",
        subHeading: "text-xs",
        statsGap: "gap-3",
        statCardPadding: "p-5",
        statValue: "text-3xl",
        analyzerPadding: "p-6 sm:p-8",
        analyzerHeaderGap: "mb-6 gap-3",
        analyzerIconSize: "h-11 w-11",
        analyzerTitle: "text-base sm:text-lg",
        analyzerDesc: "text-xs sm:text-sm",
        inputHeight: "h-12",
        inputPadding: "pl-9 pr-4",
        buttonPadding: "px-6 py-3 text-xs",
        featuresGap: "gap-2",
        featuresTag: "px-2.5 py-1.5 text-[10px]",
        recentHeaderPadding: "px-5 py-4",
        recentTitle: "text-sm",
        recentSub: "text-[10px]",
        reportRowPadding: "px-3 py-3",
        emptyStatePadding: "py-14 px-6",
        footerMargin: "mt-8",
        footerText: "text-[10px]",
      };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { error: toastError } = useToast();
  const [data, setData] = useState(null);
  const [statsKey, setStatsKey] = useState(0);
  const [repoUrl, setRepoUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("home");
  const [mounted, setMounted] = useState(false);
  const [currentRepoUrl, setCurrentRepoUrl] = useState("");

  const navigate = useNavigate();

  const mainContainerRef = useRef(null);
  const statsContainerRef = useRef(null);
  const analyzerRef = useRef(null);
  const recentReportsRef = useRef(null);
  const emptyStateRef = useRef(null);

  const { compact } = usePreferences();
  const c = sizeFor(compact);

  const loadDashboard = useCallback(
    () =>
      fetchDashboard()
        .then((res) => {
          setData(res.data);
          setStatsKey((k) => k + 1);
          setTimeout(() => setMounted(true), 50);
        })
        .catch(() => {
          localStorage.removeItem("token");
          navigate("/login");
        }),
    [navigate]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useGSAP(
    () => {
      if (activeView !== "home" || !mounted || !data) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "power2.out", duration: 0.5 },
        });

        if (mainContainerRef.current) {
          gsap.set(mainContainerRef.current, { opacity: 0, y: 15 });
        }
        const statsChildren = statsContainerRef.current?.children;
        if (statsChildren?.length) {
          gsap.set(statsChildren, { opacity: 0, y: 10 });
        }
        if (analyzerRef.current) {
          gsap.set(analyzerRef.current, { opacity: 0, y: 12 });
        }

        gsap.set(".report-row", { opacity: 0, y: 8 });
        gsap.set(".empty-state", { opacity: 0, y: 8 });

        if (mainContainerRef.current) {
          tl.to(mainContainerRef.current, { opacity: 1, y: 0, duration: 0.6 });
        }

        if (statsChildren?.length) {
          tl.to(
            statsChildren,
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.08,
              clearProps: "opacity",
            },
            "-=0.2"
          );
        }

        if (analyzerRef.current) {
          tl.to(
            analyzerRef.current,
            { opacity: 1, y: 0, duration: 0.45 },
            "-=0.15"
          );
        }

        tl.to(
          ".report-row",
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.05,
            clearProps: "opacity",
          },
          "-=0.1"
        );

        tl.to(
          ".empty-state",
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            clearProps: "opacity",
          },
          "-=0.1"
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        if (mainContainerRef.current) {
          gsap.set(mainContainerRef.current, {
            opacity: 1,
            y: 0,
            clearProps: "all",
          });
        }
        const statsChildren = statsContainerRef.current?.children;
        if (statsChildren?.length) {
          gsap.set(statsChildren, { opacity: 1, y: 0, clearProps: "all" });
        }
        if (analyzerRef.current) {
          gsap.set(analyzerRef.current, {
            opacity: 1,
            y: 0,
            clearProps: "all",
          });
        }
        gsap.set(".report-row", { opacity: 1, y: 0, clearProps: "all" });
        gsap.set(".empty-state", { opacity: 1, y: 0, clearProps: "all" });
      });

      return () => mm.revert();
    },
    {
      scope: mainContainerRef,
      dependencies: [mounted, activeView],
    }
  );

  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !reportId) throw new Error("Missing token or report ID");
      const res = await fetch(`${API_URL}/report/${reportId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("PDF download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), {
        href: url,
        download: "AI-Code-Audit.pdf",
      }).click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toastError(err.message || "Download failed");
    }
  };

  const generateReport = async () => {
    if (!repoUrl.startsWith("https://github.com/")) {
      return setError("Enter a valid GitHub URL");
    }
    try {
      setLoading(true);
      setError("");
      const res = await analyzeGithub({ repoUrl });
      setReportId(res.data.reportId);
      const a = res.data.analysis || {};

      setAnalysis({
        summary: a.summary ?? "",
        architecture: a.architecture ?? [],
        bugs: a.bugs ?? [],
        securityIssues: a.securityIssues ?? [],
        futureRoadmap: a.futureRoadmap ?? [],
        toolsAndPackages: a.toolsAndPackages ?? [],
        scores: a.scores ?? {},
        grade: a.grade ?? "N/A",
        finalVerdict: a.finalVerdict ?? "",
        _sourceCode: a._sourceCode ?? "",
        repoUrl: repoUrl,
        healthScore: a.healthScore,
        securityVulnerabilities: a.securityVulnerabilities,
        dependencyVulnerabilities: a.dependencyVulnerabilities,
        secrets: a.secrets,
        techDebt: a.techDebt,
        architectureGraph: a.architectureGraph,
        tokensUsed: a.tokensUsed,
        tokensRemaining: a.tokensRemaining,
      });

      setCurrentRepoUrl(repoUrl);
      setActiveView("result");
      loadDashboard();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Analysis failed";

      if (errorMsg === "Insufficient tokens") {
        setError(
          `${errorMsg}. <a href="/pricing" class="underline font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">Upgrade your plan</a>`
        );
      } else {
        toastError(errorMsg);
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const openResult = async (report) => {
    try {
      if (report.healthScore || report.securityVulnerabilities?.length) {
        setAnalysis({
          summary: report.summary ?? "",
          architecture: report.architecture ?? [],
          bugs: report.bugs ?? [],
          securityIssues: report.securityIssues ?? [],
          futureRoadmap: report.futureRoadmap ?? [],
          toolsAndPackages: report.toolsAndPackages ?? [],
          scores: report.scores ?? {},
          grade: report.grade ?? "N/A",
          finalVerdict: report.finalVerdict ?? "",
          _sourceCode: report._sourceCode ?? "",
          repoUrl: report.repoUrl || "",
          healthScore: report.healthScore,
          securityVulnerabilities: report.securityVulnerabilities,
          dependencyVulnerabilities: report.dependencyVulnerabilities,
          secrets: report.secrets,
          techDebt: report.techDebt,
          architectureGraph: report.architectureGraph,
          tokensUsed: report.tokensUsed,
          tokensRemaining: report.tokensRemaining,
        });
        setReportId(report._id);
        setCurrentRepoUrl(report.repoUrl || "");
        setActiveView("result");
        return;
      }

      const res = await getReport(report._id);
      const full = res.data.report;
      setAnalysis({
        summary: full.summary ?? "",
        architecture: full.architecture ?? [],
        bugs: full.bugs ?? [],
        securityIssues: full.securityIssues ?? [],
        futureRoadmap: full.futureRoadmap ?? [],
        toolsAndPackages: full.toolsAndPackages ?? [],
        scores: full.scores ?? {},
        grade: full.grade ?? "N/A",
        finalVerdict: full.finalVerdict ?? "",
        _sourceCode: full._sourceCode ?? "",
        repoUrl: full.repoUrl || "",
        healthScore: full.healthScore,
        securityVulnerabilities: full.securityVulnerabilities,
        dependencyVulnerabilities: full.dependencyVulnerabilities,
        secrets: full.secrets,
        techDebt: full.techDebt,
        architectureGraph: full.architectureGraph,
        tokensUsed: full.tokensUsed,
        tokensRemaining: full.tokensRemaining,
      });
      setReportId(full._id);
      setCurrentRepoUrl(full.repoUrl || "");
      setActiveView("result");
    } catch (err) {
      console.error("Failed to load full report:", err);
      toastError("Could not load report details.");
    }
  };

  if (!data) {
    return <DashboardSkeleton compact={compact} />;
  }

  const avgQuality = data.recentReports?.length
    ? Math.round(
        data.recentReports.reduce(
          (s, r) => s + (r.scores?.codeQuality ?? 0),
          0
        ) / data.recentReports.length
      )
    : data.stats?.avgScore ?? 0;

  const stats = [
    {
      label: "Total scans",
      value: data.stats?.totalScans ?? 0,
      sub: "repositories analyzed",
      Icon: Activity,
      accent: "accent",
    },
    {
      label: "Avg code quality",
      value: `${avgQuality}%`,
      sub: "across all reports",
      Icon: TrendingUp,
      accent: "success",
    },
    {
      label: "DevOps score",
      value: `${data.stats?.devopsScore ?? 0}%`,
      sub: "CI/CD & infrastructure",
      Icon: Cog,
      accent: "info",
    },
  ];

  // Extract unique repos for quick-pick chips
  const recentRepos = Array.from(
    new Map(
      (data.recentReports || [])
        .map((r) => [r.repoUrl, r])
    ).values()
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {activeView === "result" && analysis && (
        <div className="animate-[cv-dash-fadeUp_0.3s_ease_both]">
          <Result
            data={analysis}
            onDownload={downloadPDF}
            generateTestsFn={generateTests}
            repoUrl={currentRepoUrl}
            reportId={reportId}
          />
        </div>
      )}

      {activeView === "home" && (
        <main
          ref={mainContainerRef}
          className={`mx-auto w-full max-w-7xl ${c.mainPadding} ${c.topPadding}`}
        >
          {/* Ambient backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at center, var(--accent-soft) 0%, transparent 65%)",
            }}
          />

          <div className="relative space-y-6">
            {/* ═══════════ HEADER ═══════════ */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                {/* Status line */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-success)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                    </span>
                    System online
                  </span>

                  {data?.user &&
                    typeof data.user.tokensRemaining === "number" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-2.5 py-1 font-mono text-[10px] text-[var(--text-secondary)]">
                        <Zap
                          size={11}
                          aria-hidden="true"
                          className="text-[var(--accent)]"
                        />
                        <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                          {data.user.tokensRemaining.toLocaleString()}
                        </span>
                        <span className="text-[var(--text-muted)]">
                          tokens
                        </span>
                      </span>
                    )}
                </div>

                <h1
                  className={`mt-3 font-bold tracking-tight text-[var(--text-primary)] ${c.heading}`}
                >
                  {greetingForName(data?.user?.name)}
                </h1>
                <p className={`mt-1 text-[var(--text-muted)] ${c.subHeading}`}>
                  Analyze a repository or pick up where you left off.
                </p>
              </div>

              {data.recentReports?.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate("/history")}
                  className="group inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3.5 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                >
                  <History size={13} strokeWidth={2.2} aria-hidden="true" />
                  View all reports
                  <ArrowRight
                    size={12}
                    strokeWidth={2.4}
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </button>
              )}
            </header>

            {/* ═══════════ STATS ═══════════ */}
            <div
              ref={statsContainerRef}
              className={`grid grid-cols-1 ${c.statsGap} sm:grid-cols-3`}
            >
              {stats.map((s) => (
                <StatCard
                  key={`${s.label}-${statsKey}`}
                  {...s}
                  compact={compact}
                  statValueClass={c.statValue}
                  statPaddingClass={c.statCardPadding}
                />
              ))}
            </div>

            {/* ═══════════ ANALYZER ═══════════ */}
            <div
              ref={analyzerRef}
              className="relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)] transition-colors duration-200 hover:border-[var(--accent)]/30"
            >
              {/* Top accent gradient */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
              />
              {/* Corner glows */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-28 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-3xl" />

              <div className={`relative ${c.analyzerPadding}`}>
                {/* Header */}
                <div className={`flex items-start ${c.analyzerHeaderGap}`}>
                  <div
                    className={`flex shrink-0 items-center justify-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_8px_20px_-10px_var(--accent-soft-strong)] ${c.analyzerIconSize}`}
                  >
                    <Rocket
                      size={compact ? 15 : 19}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <h2
                      className={`font-semibold text-[var(--text-primary)] ${c.analyzerTitle}`}
                    >
                      Analyze a GitHub repository
                    </h2>
                    <p
                      className={`mt-1 leading-relaxed text-[var(--text-muted)] ${c.analyzerDesc}`}
                    >
                      Paste a public repo URL for architecture, bug,
                      security, and test-generation analysis — in one pass.
                    </p>
                  </div>
                </div>

                {/* Input row */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-0 sm:overflow-hidden sm:rounded-xl sm:border sm:border-[var(--border-light)] sm:bg-[var(--bg-input)] sm:transition-colors sm:focus-within:border-[var(--accent)]/60 sm:focus-within:shadow-[0_0_0_4px_var(--accent-soft)]">
                  <div className="relative min-w-0 flex-1">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--accent)]">
                      $
                    </span>
                    <input
                      aria-label="GitHub repository URL"
                      className={`w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/20 sm:rounded-none sm:border-0 sm:focus:ring-0 ${c.inputHeight} ${c.inputPadding}`}
                      placeholder="https://github.com/username/repository"
                      value={repoUrl}
                      onChange={(e) => {
                        setRepoUrl(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && !loading && generateReport()
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateReport}
                    disabled={loading}
                    aria-label={loading ? "Analyzing repository" : undefined}
                    className={`shrink-0 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] sm:m-1 sm:min-w-[180px] sm:rounded-lg ${c.buttonPadding} ${
                      loading
                        ? "cursor-not-allowed bg-[var(--bg-hover)] text-[var(--text-muted)]"
                        : "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_8px_24px_-8px_var(--accent-soft-strong)] hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-95"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span
                          className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                          style={{
                            borderColor: "var(--accent-contrast)",
                            borderTopColor: "transparent",
                            opacity: 0.85,
                          }}
                        />
                        Analyzing…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Analyze repository
                        <ArrowRight size={14} aria-hidden="true" />
                      </span>
                    )}
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] px-3 py-2.5 text-xs text-[var(--color-danger)] animate-[cv-dash-fadeUp-sm_0.2s_ease_both]"
                  >
                    <AlertCircle
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="shrink-0"
                    />
                    <span dangerouslySetInnerHTML={{ __html: error }} />
                  </div>
                )}

                {/* Recent repos quick-pick */}
                {recentRepos.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      <Sparkles
                        size={10}
                        strokeWidth={2.4}
                        aria-hidden="true"
                        className="text-[var(--accent)]"
                      />
                      Re-scan a recent repo
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentRepos.map((r) => {
                        const owner = getRepoOwner(r.repoUrl);
                        const name = getRepoName(r.repoUrl);
                        return (
                          <button
                            key={r.repoUrl}
                            type="button"
                            onClick={() => {
                              setRepoUrl(r.repoUrl);
                              setError("");
                            }}
                            className="group flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                          >
                            <RepoAvatar
                              owner={owner}
                              fallback={initialsOf(name)}
                              size={18}
                            />
                            <span className="font-mono text-[11px] text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
                              {name.length > 32 ? `${name.slice(0, 32)}…` : name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Features strip */}
                <div
                  className={`${recentRepos.length > 0 ? "mt-5" : "mt-5"} flex flex-wrap items-center gap-1.5 border-t border-[var(--border-dark)] pt-4 ${c.featuresGap}`}
                >
                  <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Includes
                  </span>
                  {FEATURES.map(({ label, Icon }) => (
                    <span
                      key={label}
                      className={`group flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-muted)] transition-colors duration-150 hover:border-[var(--accent)]/30 hover:text-[var(--text-secondary)] ${c.featuresTag}`}
                    >
                      <Icon
                        size={11}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="text-[var(--accent)] transition-transform duration-200 group-hover:scale-110"
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ═══════════ RECENT REPORTS ═══════════ */}
            {data.recentReports?.length > 0 && (
              <div
                ref={recentReportsRef}
                className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[var(--shadow-md)]"
              >
                <div
                  className={`flex items-center justify-between border-b border-[var(--border-dark)] ${c.recentHeaderPadding}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h2
                        className={`font-semibold text-[var(--text-primary)] ${c.recentTitle}`}
                      >
                        Recent reports
                      </h2>
                      <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--accent)]">
                        {data.recentReports.length}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-[var(--text-muted)] ${c.recentSub}`}
                    >
                      Your latest repository analysis results
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/history")}
                    className={`rounded-lg font-medium text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent-soft)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 ${
                      compact
                        ? "px-2 py-1 text-[10px]"
                        : "px-2.5 py-1.5 text-[11px]"
                    }`}
                  >
                    View all →
                  </button>
                </div>

                <div className="space-y-1.5 p-2">
                  {data.recentReports.map((report) => (
                    <div
                      key={`${report._id}-${statsKey}`}
                      className="report-row"
                    >
                      <ReportRow
                        report={report}
                        onView={() => openResult(report)}
                        compact={compact}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════ EMPTY STATE ═══════════ */}
            {!data.recentReports?.length && (
              <div
                ref={emptyStateRef}
                className="empty-state relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] text-center"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50"
                />
                <div className={`relative ${c.emptyStatePadding}`}>
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_12px_28px_-16px_var(--accent-soft-strong)]">
                    <FolderGit2 size={22} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <h3
                    className={`font-semibold text-[var(--text-primary)] ${
                      compact ? "text-sm" : "text-base"
                    }`}
                  >
                    No reports yet
                  </h3>
                  <p
                    className={`mx-auto mt-2 max-w-md leading-relaxed text-[var(--text-muted)] ${
                      compact ? "text-[11px]" : "text-xs"
                    }`}
                  >
                    Enter a public GitHub repository above to generate your
                    first CodeVerity audit. Every report includes a graded
                    summary, security scan, bug detection, and test suggestions.
                  </p>

                  <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      {
                        n: "01",
                        label: "Paste a repo URL",
                        desc: "Any public GitHub repository",
                      },
                      {
                        n: "02",
                        label: "Get your audit",
                        desc: "Architecture, security, bugs, tests",
                      },
                      {
                        n: "03",
                        label: "Act on findings",
                        desc: "Fix inline or open a PR",
                      },
                    ].map((step) => (
                      <div
                        key={step.n}
                        className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4 text-left"
                      >
                        <p className="font-mono text-[10px] font-bold tracking-wider text-[var(--accent)]">
                          {step.n}
                        </p>
                        <p className="mt-2 text-[12px] font-semibold text-[var(--text-primary)]">
                          {step.label}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                          {step.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ FOOTER ═══════════ */}
            <div
              className={`flex items-center justify-center gap-2 py-3 text-[var(--text-muted)] ${c.footerText} ${c.footerMargin}`}
            >
              <span>CodeVerity</span>
              <span>•</span>
              <span>AI Repository Intelligence</span>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

/* =========================================================
   SUB-COMPONENTS
========================================================= */

function StatCard({
  label,
  value,
  sub,
  Icon,
  compact,
  statValueClass,
  statPaddingClass,
  accent = "accent",
}) {
  const animated = useCountUp(value, 800);

  // Subtle numeric fill bar so each stat has a visual anchor.
  const numeric = parseFloat(String(value).replace("%", "")) || 0;
  const hasPct = String(value).includes("%");
  const fillPct = hasPct ? Math.min(Math.max(numeric, 0), 100) : 100;

  const accentTone = {
    accent: {
      ring: "border-[var(--accent)]/20 hover:border-[var(--accent)]/50",
      icon: "bg-[var(--accent-soft)] text-[var(--accent)]",
      bar: "var(--accent)",
    },
    success: {
      ring: "border-[var(--color-success)]/20 hover:border-[var(--color-success)]/50",
      icon: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
      bar: "var(--color-success)",
    },
    info: {
      ring: "border-[var(--color-info)]/20 hover:border-[var(--color-info)]/50",
      icon: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
      bar: "var(--color-info)",
    },
  }[accent] || {
    ring: "border-[var(--accent)]/20 hover:border-[var(--accent)]/50",
    icon: "bg-[var(--accent-soft)] text-[var(--accent)]",
    bar: "var(--accent)",
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${accentTone.ring} ${statPaddingClass}`}
    >
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {label}
          </p>
          <p
            className={`mt-2 font-bold tabular-nums leading-none text-[var(--text-primary)] ${statValueClass}`}
          >
            {animated}
          </p>
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">{sub}</p>
        </div>
        <div
          className={`flex items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${accentTone.icon} ${
            compact ? "h-7 w-7" : "h-9 w-9"
          }`}
        >
          <Icon
            size={compact ? 13 : 16}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Progress fill for percentage stats, subtle bar for others */}
      <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${fillPct}%`,
            background: accentTone.bar,
            boxShadow: `0 0 8px ${accentTone.bar}`,
            opacity: hasPct ? 1 : 0.6,
          }}
        />
      </div>
    </div>
  );
}

function ReportRow({ report, onView, compact }) {
  const grade = report.grade ?? "N/A";
  const gradeColor = GRADE_STYLES[grade[0]] ?? FALLBACK_GRADE_STYLE;

  const avg = report.scores
    ? Math.round(
        (report.scores.codeQuality +
          report.scores.security +
          report.scores.performance +
          report.scores.maintainability) /
          4
      )
    : 0;

  const repoName = getRepoName(report.repoUrl);
  const owner = getRepoOwner(report.repoUrl);
  const date = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

  const rowPadding = compact ? "px-2 py-2" : "px-3 py-3";
  const gradeSize = compact ? "h-8 w-9 text-[11px]" : "h-9 w-11 text-[12px]";
  const repoFontSize = compact ? "text-[11px]" : "text-[13px]";
  const dateFontSize = "text-[10px]";
  const viewButtonPadding = compact
    ? "px-2 py-1 text-[10px]"
    : "px-3 py-1.5 text-[10px]";
  const avatarSize = compact ? 26 : 32;

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border border-transparent transition-all duration-150 hover:border-[var(--border-light)] hover:bg-[var(--bg-primary)] ${rowPadding}`}
    >
      {/* Repo avatar */}
      <div
        className="relative shrink-0"
        style={{ width: avatarSize, height: avatarSize }}
      >
        <RepoAvatar
          owner={owner}
          fallback={initialsOf(repoName)}
          size={avatarSize}
        />
      </div>

      {/* Grade badge */}
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg border font-bold ${gradeColor.text} ${gradeColor.bg} ${gradeColor.border} ${gradeSize}`}
      >
        {grade}
      </span>

      {/* Repo info */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-medium text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)] ${repoFontSize}`}
        >
          {repoName}
        </p>
        <p className={`mt-0.5 text-[var(--text-muted)] ${dateFontSize}`}>
          {date} · average score {avg}%
        </p>
      </div>

      {/* Mini score bars */}
      {report.scores && (
        <div className="hidden h-7 items-end gap-1 md:flex">
          {[
            report.scores.codeQuality,
            report.scores.security,
            report.scores.performance,
            report.scores.maintainability,
          ].map((v, i) => (
            <div
              key={i}
              className="w-1.5 rounded-sm bg-[var(--accent)]/50 transition-all duration-200 group-hover:bg-[var(--accent)]"
              style={{ height: `${Math.max(20, v)}%` }}
            />
          ))}
        </div>
      )}

      {/* Average score badge */}
      <div className="hidden items-center gap-1.5 rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] px-2 py-1 sm:flex">
        <span className="font-mono text-[10px] font-bold tabular-nums text-[var(--text-secondary)]">
          {avg}%
        </span>
      </div>

      {/* Action */}
      <button
        type="button"
        onClick={onView}
        className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 ${viewButtonPadding}`}
      >
        View →
      </button>
    </div>
  );
}

/* GitHub avatar with graceful fallback to initials when the image
   fails to load (private repos, network issues, or non-github urls). */
function RepoAvatar({ owner, fallback, size = 32 }) {
  const [failed, setFailed] = useState(false);

  if (!owner || failed) {
    return (
      <span
        className="flex items-center justify-center rounded-lg border border-[var(--border-light)] bg-[var(--accent-soft)] font-mono font-bold text-[var(--accent)]"
        style={{ width: size, height: size, fontSize: size * 0.36 }}
        aria-hidden="true"
      >
        {fallback}
      </span>
    );
  }

  return (
    <img
      src={`https://github.com/${owner}.png?size=64`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] object-cover"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const raw = String(target).replace("%", "");
    const num = parseFloat(raw) || 0;
    const isPct = String(target).includes("%");
    const start = performance.now();

    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(num * eased);
      setValue(isPct ? `${current}%` : current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

/* Skeleton dashboard  mirrors the real layout's shape so the page
   structure is visible immediately on load. */
function DashboardSkeleton({ compact }) {
  const mainPadding = compact
    ? "px-4 py-4 sm:px-4 lg:px-6"
    : "px-4 py-6 sm:px-6 lg:px-8";
  const topPadding = compact ? "pt-20" : "pt-24";
  const statsGap = compact ? "gap-2" : "gap-3";
  const statPad = compact ? "p-3" : "p-5";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <main className={`mx-auto w-full max-w-7xl ${mainPadding} ${topPadding}`}>
        <div className="animate-pulse space-y-6">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-full bg-[var(--bg-hover)]" />
            <div className="h-6 w-56 rounded bg-[var(--bg-hover)]" />
            <div className="h-2.5 w-80 max-w-full rounded bg-[var(--bg-hover)]" />
          </div>

          <div className={`grid grid-cols-1 ${statsGap} sm:grid-cols-3`}>
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className={`rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] ${statPad}`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="h-2 w-20 rounded bg-[var(--bg-hover)]" />
                    <div className="h-7 w-16 rounded bg-[var(--bg-hover)]" />
                    <div className="h-2 w-24 rounded bg-[var(--bg-hover)]" />
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-[var(--bg-hover)]" />
                </div>
                <div className="mt-3 h-[3px] w-full rounded-full bg-[var(--bg-hover)]" />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-[var(--bg-hover)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-52 max-w-full rounded bg-[var(--bg-hover)]" />
                <div className="h-2.5 w-72 max-w-full rounded bg-[var(--bg-hover)]" />
              </div>
            </div>
            <div className="mt-6 h-12 w-full rounded-xl bg-[var(--bg-hover)]" />
            <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border-dark)] pt-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="h-6 w-24 rounded-lg bg-[var(--bg-hover)]"
                />
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]">
            <div className="border-b border-[var(--border-dark)] px-5 py-4">
              <div className="h-3 w-32 rounded bg-[var(--bg-hover)]" />
              <div className="mt-2 h-2 w-48 rounded bg-[var(--bg-hover)]" />
            </div>
            <div className="space-y-1.5 p-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3">
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-[var(--bg-hover)]" />
                  <div className="h-9 w-11 shrink-0 rounded-lg bg-[var(--bg-hover)]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-44 max-w-full rounded bg-[var(--bg-hover)]" />
                    <div className="h-2 w-28 rounded bg-[var(--bg-hover)]" />
                  </div>
                  <div className="h-6 w-14 rounded-lg bg-[var(--bg-hover)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}