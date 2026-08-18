import { useEffect, useState, useRef, useCallback } from "react";
import { fetchDashboard } from "../api/dashboard";
import { analyzeGithub, generateTests } from "../api/github";
import { useNavigate } from "react-router-dom";
import Result from "../components/Result";

/*
  THEME
  Single accent: indigo-500 (#6366f1). No gradients anywhere — flat
  surfaces on a graphite base, distinguished by border + elevation,
  not color. Grade badges keep their own color coding because that
  encodes real severity data, not brand decoration.
*/

/*  DASHBOARD  */
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
    [navigate],
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* DOWNLOAD PDF */
  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !reportId) throw new Error();
      const res = await fetch(`http://localhost:5000/api/report/${reportId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), { href: url, download: "AI-Code-Audit.pdf" }).click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed");
    }
  };

  /* GENERATE REPORT */
  const generateReport = async () => {
    if (!repoUrl.startsWith("https://github.com/")) return setError("Enter a valid GitHub URL");
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
      });
      setActiveView("result");
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

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

  /* LOADING SCREEN */
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-500 text-sm font-mono">loading dashboard…</p>
        </div>
      </div>
    );
  }

  const avgQuality = data.recentReports?.length
    ? Math.round(
        data.recentReports.reduce((s, r) => s + (r.scores?.codeQuality ?? 0), 0) /
          data.recentReports.length,
      )
    : data.stats?.avgScore ?? 0;

  const stats = [
    { label: "Total scans", value: data.stats?.totalScans ?? 0, sub: "repos analyzed", delay: "0ms" },
    { label: "Avg code quality", value: `${avgQuality}%`, sub: "across all reports", delay: "70ms" },
    { label: "DevOps score", value: `${data.stats?.devopsScore ?? 0}%`, sub: "CI/CD & infra", delay: "140ms" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* ── TOP BAR ─────────────────────────────── */}
      <div className="bg-neutral-950/90 backdrop-blur border-b border-white/10 px-5 sm:px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        {activeView === "result" && (
          <button
            onClick={() => setActiveView("home")}
            className="ml-auto sm:ml-0 text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
          >
            ← Back
          </button>
        )}
      </div>

      {/* ── RESULT VIEW ─────────────────────────── */}
      {activeView === "result" && analysis && (
        <div className="animate-[fadeUp_0.3s_ease_both]">
          <Result data={analysis} onDownload={downloadPDF} generateTestsFn={generateTests} />
        </div>
      )}

      {/* ── HOME VIEW ───────────────────────────── */}
      {activeView === "home" && (
        <div
          className={`p-5 sm:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto transition-all duration-500 ease-out
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          {/* ── STATS ────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {stats.map((s) => (
              <StatCard key={`${s.label}-${statsKey}`} {...s} />
            ))}
          </div>

          {/* ── ANALYZER ─────────────────────────── */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Analyze a GitHub repository</h2>
            <p className="text-neutral-500 text-sm mt-1 mb-4">
              Paste a public repo URL for an AI-powered audit and generated test coverage.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white
                  placeholder-neutral-600 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500
                  focus:border-indigo-500 transition-colors"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && !loading && generateReport()}
              />
              <button
                onClick={generateReport}
                disabled={loading}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0
                  ${
                    loading
                      ? "bg-white/10 text-neutral-500 cursor-not-allowed"
                      : "bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-600"
                  }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Analyzing…
                  </span>
                ) : (
                  "Generate report"
                )}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 animate-[fadeUp_0.2s_ease_both]">
                {error}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {["Architecture", "Bugs", "Security", "Tests", "Roadmap"].map((f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-neutral-400"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* ── RECENT REPORTS ───────────────────── */}
          {data.recentReports?.length > 0 && (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Recent reports</h2>
                <span
                  key={statsKey}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 animate-[fadeUp_0.25s_ease_both]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="space-y-2">
                {data.recentReports.map((report, i) => (
                  <div
                    key={`${report._id}-${statsKey}`}
                    className="animate-[fadeUp_0.35s_ease_both]"
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
                  >
                    <ReportRow report={report} onView={() => openResult(report)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { transform: translateY(6px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
}

/*  STAT CARD  */
function StatCard({ label, value, sub, delay }) {
  const animated = useCountUp(value, 800);

  return (
    <div
      className="bg-white/[0.03] border border-white/10 rounded-2xl p-5
        transition-colors duration-200 hover:border-white/20
        animate-[fadeUp_0.45s_ease_both]"
      style={{ animationDelay: delay, animationFillMode: "both" }}
    >
      <p className="text-neutral-500 text-xs uppercase tracking-wide font-mono">{label}</p>
      <p className="text-3xl font-bold tabular-nums mt-2 text-indigo-400">{animated}</p>
      <p className="text-neutral-600 text-xs mt-1">{sub}</p>
    </div>
  );
}

/*  REPORT ROW  */
function ReportRow({ report, onView }) {
  const grade = report.grade ?? "N/A";
  const gradeColor =
    {
      A: "text-emerald-400 bg-emerald-500/10",
      B: "text-sky-400 bg-sky-500/10",
      C: "text-amber-400 bg-amber-500/10",
      D: "text-orange-400 bg-orange-500/10",
      F: "text-red-400 bg-red-500/10",
    }[grade[0]] ?? "text-neutral-400 bg-white/5";

  const avg = report.scores
    ? Math.round(
        (report.scores.codeQuality +
          report.scores.security +
          report.scores.performance +
          report.scores.maintainability) /
          4,
      )
    : 0;

  const repoName = report.repoUrl?.replace("https://github.com/", "") ?? "Unknown repo";
  const date = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <div
      className="flex items-center justify-between gap-4 p-4 rounded-xl
      bg-black/20 hover:bg-black/30 border border-white/5 hover:border-white/10
      transition-colors duration-150 group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`text-sm font-bold px-2 py-0.5 rounded-lg shrink-0 ${gradeColor}`}>{grade}</span>
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{repoName}</p>
          <p className="text-xs text-neutral-500">
            {date} · avg score {avg}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {report.scores && (
          <div className="hidden md:flex gap-1 items-end h-6">
            {[
              report.scores.codeQuality,
              report.scores.security,
              report.scores.performance,
              report.scores.maintainability,
            ].map((v, i) => (
              <div
                key={i}
                className="w-1.5 bg-indigo-500 rounded-sm opacity-60 group-hover:opacity-100 transition-opacity duration-200"
                style={{ height: `${Math.max(20, v)}%` }}
              />
            ))}
          </div>
        )}
        <button
          onClick={onView}
          className="px-3 py-1.5 text-xs rounded-lg bg-indigo-500/15 text-indigo-300
            hover:bg-indigo-500/30 transition-colors duration-150"
        >
          View →
        </button>
      </div>
    </div>
  );
}

/*  COUNT UP HOOK  */
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
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}