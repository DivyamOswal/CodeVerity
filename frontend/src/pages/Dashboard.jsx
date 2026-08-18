import { useEffect, useState, useRef, useCallback } from "react";
import { fetchDashboard } from "../api/dashboard";
import { analyzeGithub, generateTests } from "../api/github";
import { useNavigate } from "react-router-dom";
import Result from "../components/Result";

/* =========================================================
   CODEVERITY DASHBOARD
   Theme:
   Background  #0d1117
   Surface     #161b22
   Border      #30363d
   Primary     Blue / Indigo / Purple
========================================================= */

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [statsKey, setStatsKey] = useState(0);
  const [repoUrl, setRepoUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("home");
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

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

  /* =========================================================
     DOWNLOAD PDF
  ========================================================= */

  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token || !reportId) {
        throw new Error();
      }

      const res = await fetch(
        `http://localhost:5000/api/report/${reportId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      Object.assign(document.createElement("a"), {
        href: url,
        download: "AI-Code-Audit.pdf",
      }).click();

      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed");
    }
  };

  /* =========================================================
     GENERATE REPORT
  ========================================================= */

  const generateReport = async () => {
    if (!repoUrl.startsWith("https://github.com/")) {
      return setError("Enter a valid GitHub URL");
    }

    try {
      setLoading(true);
      setError("");

      const res = await analyzeGithub({
        repoUrl,
      });

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
      });

      setActiveView("result");

      loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Analysis failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     OPEN RESULT
  ========================================================= */

  const openResult = (report) => {
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
    });

    setReportId(report._id);

    setActiveView("result");
  };

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (!data) {
    return <LoadingScreen />;
  }

  /* =========================================================
     STATS
  ========================================================= */

  const avgQuality = data.recentReports?.length
    ? Math.round(
        data.recentReports.reduce(
          (s, r) =>
            s + (r.scores?.codeQuality ?? 0),
          0
        ) / data.recentReports.length
      )
    : data.stats?.avgScore ?? 0;

  const stats = [
    {
      label: "Total scans",
      value: data.stats?.totalScans ?? 0,
      sub: "repositories analyzed",
      icon: "⌁",
      color: "blue",
      delay: "0ms",
    },
    {
      label: "Avg code quality",
      value: `${avgQuality}%`,
      sub: "across all reports",
      icon: "◈",
      color: "purple",
      delay: "70ms",
    },
    {
      label: "DevOps score",
      value: `${data.stats?.devopsScore ?? 0}%`,
      sub: "CI/CD & infrastructure",
      icon: "⚙",
      color: "cyan",
      delay: "140ms",
    },
  ];

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <header className="sticky top-0 z-30 border-b border-[#30363d] bg-[#0d1117]/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[68px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Brand */}

          <div className="flex items-center gap-3">

            <CodeVerityLogo />

            <div className="hidden sm:block">

              <p className="text-[11px] font-bold tracking-[0.2em] text-[#f0f6fc]">
                CODEVERITY
              </p>

              <p className="text-[9px] text-[#484f58]">
                AI Repository Intelligence
              </p>

            </div>

          </div>

          {/* Page title */}

          <div className="absolute left-1/2 -translate-x-1/2">

            <div className="flex items-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-[#58a6ff]" />

              <h1 className="text-sm font-semibold text-[#c9d1d9]">
                {activeView === "result"
                  ? "Analysis Result"
                  : "Dashboard"}
              </h1>

            </div>

          </div>

          {/* Actions */}

          <div className="flex items-center gap-2">

            {activeView === "result" && (
              <button
                onClick={() =>
                  setActiveView("home")
                }
                className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-[10px] font-medium text-[#8b949e] transition hover:border-[#484f58] hover:text-[#f0f6fc]"
              >
                ← Dashboard
              </button>
            )}

            <button
              onClick={() => navigate("/history")}
              className="hidden rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-[10px] font-medium text-[#8b949e] transition hover:border-[#484f58] hover:text-[#f0f6fc] sm:block"
            >
              History
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#30363d] bg-[#161b22] text-xs font-bold text-[#8b949e] transition hover:border-[#58a6ff]/40 hover:text-[#f0f6fc]"
              title="Profile"
            >
              U
            </button>

          </div>

        </div>

      </header>

      {/* =====================================================
          RESULT VIEW
      ===================================================== */}

      {activeView === "result" && analysis && (
        <div className="animate-[fadeUp_0.3s_ease_both]">

          <Result
            data={analysis}
            onDownload={downloadPDF}
            generateTestsFn={generateTests}
          />

        </div>
      )}

      {/* =====================================================
          HOME VIEW
      ===================================================== */}

      {activeView === "home" && (
        <main
          className={`mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${
            mounted
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0"
          } transition-all duration-500 ease-out`}
        >

          <div className="space-y-5">

            {/* =================================================
                WELCOME HEADER
            ================================================= */}

            <div className="flex flex-col gap-1">

              <div className="flex items-center gap-2">

                <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950] animate-pulse" />

                <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#6e7681]">
                  System online
                </span>

              </div>

              <h2 className="mt-1 text-xl font-bold tracking-tight text-[#f0f6fc] sm:text-2xl">
                Repository Dashboard
              </h2>

              <p className="text-xs text-[#6e7681]">
                Analyze your GitHub repositories and get
                AI-powered engineering insights.
              </p>

            </div>

            {/* =================================================
                STATS
            ================================================= */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              {stats.map((s) => (
                <StatCard
                  key={`${s.label}-${statsKey}`}
                  {...s}
                />
              ))}

            </div>

            {/* =================================================
                ANALYZER
            ================================================= */}

            <div className="relative overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22]">

              {/* Glow */}

              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />

              <div className="relative p-5 sm:p-6">

                {/* Header */}

                <div className="mb-5 flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                    ⌁
                  </div>

                  <div>

                    <h2 className="text-sm font-semibold text-[#f0f6fc] sm:text-base">
                      Analyze a GitHub repository
                    </h2>

                    <p className="mt-1 text-[10px] leading-relaxed text-[#6e7681] sm:text-xs">
                      Paste a public repository URL for a
                      complete AI-powered engineering audit.
                    </p>

                  </div>

                </div>

                {/* Input */}

                <div className="flex flex-col gap-2.5 sm:flex-row">

                  <div className="relative min-w-0 flex-1">

                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#484f58]">
                      $
                    </span>

                    <input
                      className="h-12 w-full rounded-xl border border-[#30363d] bg-[#0d1117] pl-8 pr-4 text-xs text-[#f0f6fc] outline-none placeholder:text-[#484f58] transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
                      placeholder="https://github.com/username/repository"
                      value={repoUrl}
                      onChange={(e) => {
                        setRepoUrl(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        !loading &&
                        generateReport()
                      }
                    />

                  </div>

                  <button
                    onClick={generateReport}
                    disabled={loading}
                    className={`h-12 shrink-0 rounded-xl px-6 text-xs font-semibold text-white transition-all duration-200 ${
                      loading
                        ? "cursor-not-allowed bg-[#21262d] text-[#6e7681]"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/10 hover:scale-[1.01] hover:shadow-blue-500/20 active:scale-95"
                    }`}
                  >

                    {loading ? (
                      <span className="flex items-center justify-center gap-2">

                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        Analyzing…

                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Analyze repository
                        <span>→</span>
                      </span>
                    )}

                  </button>

                </div>

                {/* Error */}

                {error && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[10px] text-red-400 animate-[fadeUp_0.2s_ease_both]">

                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500/10">
                      !
                    </span>

                    {error}

                  </div>
                )}

                {/* Features */}

                <div className="mt-4 flex flex-wrap gap-2">

                  {[
                    {
                      label: "Architecture",
                      icon: "◈",
                    },
                    {
                      label: "Bug detection",
                      icon: "⚡",
                    },
                    {
                      label: "Security",
                      icon: "⌾",
                    },
                    {
                      label: "Test generation",
                      icon: "✓",
                    },
                    {
                      label: "Roadmap",
                      icon: "→",
                    },
                  ].map((f) => (
                    <span
                      key={f.label}
                      className="flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#0d1117] px-2.5 py-1.5 text-[9px] text-[#6e7681]"
                    >

                      <span className="text-[#58a6ff]">
                        {f.icon}
                      </span>

                      {f.label}

                    </span>
                  ))}

                </div>

              </div>

            </div>

            {/* =================================================
                RECENT REPORTS
            ================================================= */}

            {data.recentReports?.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22]">

                <div className="flex items-center justify-between border-b border-[#21262d] px-5 py-4">

                  <div>

                    <h2 className="text-sm font-semibold text-[#f0f6fc]">
                      Recent reports
                    </h2>

                    <p className="mt-1 text-[9px] text-[#484f58]">
                      Your latest repository analysis results
                    </p>

                  </div>

                  <div className="flex items-center gap-3">

                    <span
                      key={statsKey}
                      className="hidden items-center gap-1.5 text-[9px] text-[#3fb950] sm:flex"
                    >

                      <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950] animate-pulse" />

                      Live

                    </span>

                    <button
                      onClick={() =>
                        navigate("/history")
                      }
                      className="rounded-lg px-2.5 py-1.5 text-[9px] font-medium text-[#58a6ff] transition hover:bg-blue-500/10"
                    >
                      View all →
                    </button>

                  </div>

                </div>

                <div className="space-y-1.5 p-2">

                  {data.recentReports.map(
                    (report, i) => (
                      <div
                        key={`${report._id}-${statsKey}`}
                        className="animate-[fadeUp_0.35s_ease_both]"
                        style={{
                          animationDelay: `${i * 40}ms`,
                          animationFillMode: "both",
                        }}
                      >

                        <ReportRow
                          report={report}
                          onView={() =>
                            openResult(report)
                          }
                        />

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* =================================================
                EMPTY REPORT STATE
            ================================================= */}

            {!data.recentReports?.length && (
              <div className="rounded-2xl border border-[#30363d] bg-[#161b22] px-6 py-12 text-center">

                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#30363d] bg-[#0d1117] text-lg text-[#484f58]">
                  ◈
                </div>

                <h3 className="text-sm font-semibold text-[#c9d1d9]">
                  No reports yet
                </h3>

                <p className="mx-auto mt-1.5 max-w-sm text-[10px] leading-relaxed text-[#6e7681]">
                  Enter a public GitHub repository above
                  to generate your first CodeVerity audit.
                </p>

              </div>
            )}

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="flex items-center justify-center gap-2 py-3 text-[8px] text-[#30363d]">

              <span>
                CodeVerity
              </span>

              <span>•</span>

              <span>
                AI Repository Intelligence
              </span>

            </div>

          </div>

        </main>
      )}

      {/* =====================================================
          ANIMATIONS
      ===================================================== */}

      <style>{`

        @keyframes fadeUp {
          from {
            transform: translateY(8px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }

      `}</style>

    </div>
  );
}

/* =========================================================
   CODEVERITY LOGO
========================================================= */

function CodeVerityLogo() {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/10">

      <div className="absolute inset-[1px] rounded-[11px] bg-[#0d1117]" />

      <div className="relative text-[9px] font-black tracking-tight text-white">

        <span className="text-blue-400">
          &lt;
        </span>

        CV

        <span className="text-purple-400">
          /&gt;
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  delay,
}) {
  const animated = useCountUp(
    value,
    800
  );

  const colors = {
    blue: {
      border:
        "border-blue-500/20",
      icon:
        "bg-blue-500/10 text-blue-400",
      glow:
        "bg-blue-500/5",
    },

    purple: {
      border:
        "border-purple-500/20",
      icon:
        "bg-purple-500/10 text-purple-400",
      glow:
        "bg-purple-500/5",
    },

    cyan: {
      border:
        "border-cyan-500/20",
      icon:
        "bg-cyan-500/10 text-cyan-400",
      glow:
        "bg-cyan-500/5",
    },
  };

  const c =
    colors[color] ?? colors.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${c.border} bg-[#161b22] p-4 transition-all duration-200 hover:-translate-y-0.5`}
      style={{
        animation:
          "fadeUp 0.45s ease both",
        animationDelay: delay,
      }}
    >

      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl ${c.glow}`}
      />

      <div className="relative flex items-start justify-between">

        <div>

          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6e7681]">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tabular-nums text-[#f0f6fc]">
            {animated}
          </p>

          <p className="mt-1 text-[9px] text-[#484f58]">
            {sub}
          </p>

        </div>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${c.icon}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   REPORT ROW
========================================================= */

function ReportRow({
  report,
  onView,
}) {
  const grade =
    report.grade ?? "N/A";

  const gradeColor =
    {
      A: {
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border:
          "border-emerald-500/20",
      },

      B: {
        text: "text-sky-400",
        bg: "bg-sky-500/10",
        border:
          "border-sky-500/20",
      },

      C: {
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        border:
          "border-amber-500/20",
      },

      D: {
        text: "text-orange-400",
        bg: "bg-orange-500/10",
        border:
          "border-orange-500/20",
      },

      F: {
        text: "text-red-400",
        bg: "bg-red-500/10",
        border:
          "border-red-500/20",
      },
    }[grade[0]] ?? {
      text: "text-[#8b949e]",
      bg: "bg-[#0d1117]",
      border: "border-[#30363d]",
    };

  const avg = report.scores
    ? Math.round(
        (report.scores.codeQuality +
          report.scores.security +
          report.scores.performance +
          report.scores.maintainability) /
          4
      )
    : 0;

  const repoName =
    report.repoUrl?.replace(
      "https://github.com/",
      ""
    ) ?? "Unknown repo";

  const date = report.createdAt
    ? new Date(
        report.createdAt
      ).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      )
    : "";

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-all duration-150 hover:border-[#30363d] hover:bg-[#0d1117]">

      {/* Grade */}

      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${gradeColor.text} ${gradeColor.bg} ${gradeColor.border}`}
      >
        {grade}
      </span>

      {/* Repository */}

      <div className="min-w-0 flex-1">

        <p className="truncate text-[11px] font-medium text-[#c9d1d9] group-hover:text-[#f0f6fc]">
          {repoName}
        </p>

        <p className="mt-0.5 text-[9px] text-[#484f58]">
          {date} · average score {avg}%
        </p>

      </div>

      {/* Score Bars */}

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
              className="w-1.5 rounded-sm bg-blue-500/50 transition-all duration-200 group-hover:bg-blue-400"
              style={{
                height: `${Math.max(
                  20,
                  v
                )}%`,
              }}
            />
          ))}

        </div>
      )}

      {/* Score */}

      <div className="hidden rounded-md border border-[#30363d] bg-[#161b22] px-2 py-1 text-[9px] text-[#8b949e] sm:block">
        {avg}%
      </div>

      {/* View */}

      <button
        onClick={onView}
        className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-[9px] font-medium text-[#8b949e] transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
      >
        View →
      </button>

    </div>
  );
}

/* =========================================================
   COUNT UP HOOK
========================================================= */

function useCountUp(
  target,
  duration = 800
) {
  const [value, setValue] =
    useState(0);

  const rafRef =
    useRef(null);

  useEffect(() => {
    const raw = String(target).replace(
      "%",
      ""
    );

    const num =
      parseFloat(raw) || 0;

    const isPct =
      String(target).includes("%");

    const start =
      performance.now();

    cancelAnimationFrame(
      rafRef.current
    );

    const tick = (now) => {
      const elapsed =
        now - start;

      const progress = Math.min(
        elapsed / duration,
        1
      );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );

      const current =
        Math.round(
          num * eased
        );

      setValue(
        isPct
          ? `${current}%`
          : current
      );

      if (progress < 1) {
        rafRef.current =
          requestAnimationFrame(
            tick
          );
      }
    };

    rafRef.current =
      requestAnimationFrame(
        tick
      );

    return () =>
      cancelAnimationFrame(
        rafRef.current
      );
  }, [target, duration]);

  return value;
}

/* =========================================================
   LOADING SCREEN
========================================================= */

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">

      <div className="flex flex-col items-center gap-4">

        <CodeVerityLogo />

        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#30363d] border-t-[#58a6ff]" />

        <p className="font-mono text-[10px] text-[#484f58]">
          loading dashboard…
        </p>

      </div>

    </div>
  );
}