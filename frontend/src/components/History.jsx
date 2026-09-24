// src/pages/History.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search,
  FileText,
  Download,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
  Plus,
  Sparkles,
  TrendingUp,
  Layers,
} from "lucide-react";

import { generateTests } from "../api/github";
import Result from "./Result";
import { usePreferences } from "../context/PreferencesContext";
import { useToast } from "../hooks/useToast";

const API = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 20;

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

// Build a compact page list like 1 … 3 4 [5] 6 7 … 12
function pageList(current, total, max = 7) {
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  const span = Math.floor((max - 3) / 2);
  let start = Math.max(2, current - span);
  let end = Math.min(total - 1, current + span);
  if (current - span < 2) end = Math.min(total - 1, max - 2);
  if (current + span > total - 1) start = Math.max(2, total - max + 3);
  pages.push(1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

// ─── ScanLine ─────────────────────────────────────────────────
function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
      <div
        className="animate-scanline absolute left-0 right-0 h-px bg-[var(--accent-contrast)]"
        style={{ opacity: 0.35 }}
      />
    </div>
  );
}

// ─── GitHub brand mark ────────────────────────────────────────
function GithubIcon({ size = 14, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.61-3.37-1.34-3.37-1.34-.46-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.55 2.34 1.1 2.91.84.09-.66.35-1.1.63-1.36-2.22-.26-4.56-1.13-4.56-5.02 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.04a9.3 9.3 0 0 1 5 0c1.91-1.31 2.75-1.04 2.75-1.04.55 1.42.2 2.46.1 2.72.64.71 1.03 1.62 1.03 2.73 0 3.9-2.34 4.76-4.57 5.01.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

// ─── Repo avatar with initials fallback ───────────────────────
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

// ─── Skeleton card ────────────────────────────────────────────
function SkeletonCard({ compact }) {
  const pad = compact ? "p-3" : "p-4";
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]">
      <div className={`border-b border-[var(--border-dark)] ${pad}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--bg-hover)]" />
            <div className="space-y-1.5">
              <div className="h-2 w-14 rounded bg-[var(--bg-hover)]" />
              <div className="h-3 w-28 rounded bg-[var(--bg-hover)]" />
            </div>
          </div>
          <div className="h-5 w-10 shrink-0 rounded-md bg-[var(--bg-hover)]" />
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-2.5 w-full rounded bg-[var(--bg-hover)]" />
          <div className="h-2.5 w-2/3 rounded bg-[var(--bg-hover)]" />
        </div>
      </div>
      <div className={pad}>
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-2 w-16 rounded bg-[var(--bg-hover)]" />
            <div className="h-6 w-12 rounded bg-[var(--bg-hover)]" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[var(--bg-hover)]" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--border-dark)] pt-3">
          <div className="h-3 w-20 rounded bg-[var(--bg-hover)]" />
          <div className="h-6 w-16 rounded-md bg-[var(--bg-hover)]" />
        </div>
      </div>
    </div>
  );
}

// ─── Sizing ───────────────────────────────────────────────────
function sizeFor(compact) {
  return compact
    ? {
        containerPadding: "py-3",
        topPadding: "pt-20",
        headerMargin: "mb-3",
        toolbarPadding: "p-1.5",
        gradeGap: "gap-1.5",
        reportGridGap: "gap-2",
        footerMargin: "mt-4",
      }
    : {
        containerPadding: "py-5",
        topPadding: "pt-24",
        headerMargin: "mb-5",
        toolbarPadding: "p-2",
        gradeGap: "gap-2",
        reportGridGap: "gap-3",
        footerMargin: "mt-6",
      };
}

// ═══════════════════════════════════════════════════════════════
// MAIN HISTORY
// ═══════════════════════════════════════════════════════════════
export default function History() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterGrade, setFilterGrade] = useState("all");

  const { compact, showScores } = usePreferences();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const s = sizeFor(compact);

  const loadPage = async (nextPage = 1, { initial = false } = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    if (initial) setLoading(true);
    else setPageLoading(true);

    try {
      const res = await axios.get(
        `${API}/report?page=${nextPage}&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(res.data.reports || []);
      setPagination(res.data.pagination || null);
      setPage(nextPage);
    } catch {
      error("Failed to load history");
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1, { initial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewReport = async (report) => {
    if (viewLoading) return;
    setViewLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/report/${report._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelected(res.data.report);
    } catch {
      error("Failed to load report");
    } finally {
      setViewLoading(false);
    }
  };

  const downloadPDF = async (id, e) => {
    e?.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/report/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "CodeVerity-Audit.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success("PDF downloaded successfully");
    } catch {
      error("Download failed");
    }
  };

  const filtered = useMemo(() => {
    let list = [...reports];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.repoUrl?.toLowerCase().includes(q) ||
          r.summary?.toLowerCase().includes(q)
      );
    }
    if (filterGrade !== "all") {
      list = list.filter((r) => (r.grade ?? "N/A")[0] === filterGrade);
    }
    list.sort((a, b) => {
      if (sortBy === "grade")
        return (a.grade ?? "Z").localeCompare(b.grade ?? "Z");
      if (sortBy === "score") {
        const avg = (r) =>
          r.scores
            ? (Number(r.scores.codeQuality || 0) +
                Number(r.scores.security || 0) +
                Number(r.scores.performance || 0) +
                Number(r.scores.maintainability || 0)) /
              4
            : 0;
        return avg(b) - avg(a);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return list;
  }, [reports, search, sortBy, filterGrade]);

  const totalReports = pagination?.total ?? reports.length;
  const totalPages = pagination?.totalPages ?? 1;
  const hasPrev = pagination?.hasPrev ?? page > 1;
  const hasNext = pagination?.hasNext ?? page < totalPages;

  // Distribution used in the grade summary header strip
  const distribution = useMemo(() => {
    const totals = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const r of reports) {
      const letter = (r.grade ?? "N/A")[0];
      if (totals[letter] !== undefined) totals[letter] += 1;
    }
    return totals;
  }, [reports]);

  const distributionTotal = Object.values(distribution).reduce(
    (a, b) => a + b,
    0
  );

  // ---- Full Report View ----
  if (selected) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="sticky top-16 z-40 border-b border-[var(--border-light)] bg-[var(--bg-primary)]/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="group flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 sm:px-3"
            >
              <ArrowLeft
                size={14}
                strokeWidth={2}
                aria-hidden="true"
                className="transition-transform duration-150 group-hover:-translate-x-1"
              />
              <span className="hidden sm:inline">Back to History</span>
            </button>
            <div className="h-5 w-px bg-[var(--border-light)]" />
            <div className="flex min-w-0 items-center gap-2">
              <RepoAvatar
                owner={getRepoOwner(selected.repoUrl)}
                fallback={initialsOf(getRepoName(selected.repoUrl))}
                size={20}
              />
              <span className="truncate font-mono text-[11px] text-[var(--text-muted)]">
                {getRepoName(selected.repoUrl)}
              </span>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Result
            data={selected}
            onDownload={(e) => downloadPDF(selected._id, e)}
            generateTestsFn={generateTests}
          />
        </div>
      </div>
    );
  }

  // ---- Main History View ----
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 h-[380px] w-[720px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--accent-soft) 0%, transparent 65%)",
        }}
      />

      <div
        className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${s.containerPadding} ${s.topPadding}`}
      >
        {/* ═══════════ HEADER ═══════════ */}
        <div className={s.headerMargin}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  <Layers
                    size={10}
                    strokeWidth={2.2}
                    aria-hidden="true"
                    className="text-[var(--accent)]"
                  />
                  Audit log
                </span>
                {totalReports > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success)]/25 bg-[var(--color-success-soft)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-success)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                    {totalReports} review{totalReports === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <h1
                className={`mt-3 font-bold leading-[1.05] tracking-tight text-[var(--text-primary)] ${
                  compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
                }`}
              >
                Review{" "}
                <span className="text-[var(--accent)]">History</span>
              </h1>
              <p
                className={`mt-2 max-w-xl leading-5 text-[var(--text-secondary)] ${
                  compact ? "text-xs" : "text-[13px]"
                }`}
              >
                Browse, compare and revisit your previous GitHub repository
                audits.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className={`group inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-[var(--accent)] px-4 py-2.5 text-[12px] font-semibold text-[var(--accent-contrast)] shadow-[0_8px_24px_-8px_var(--accent-soft-strong)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-[0_12px_28px_-10px_var(--accent-soft-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97]`}
            >
              <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
              New scan
              <ArrowRight
                size={13}
                strokeWidth={2.4}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </div>

        {/* ═══════════ GRADE SUMMARY ═══════════ */}
        {reports.length > 0 && (
          <div
            className={`mb-4 overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] ${
              compact ? "p-3" : "p-4"
            }`}
          >
            {/* Distribution bar */}
            {distributionTotal > 0 && (
              <div className="mb-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Grade distribution
                  </p>
                  <p className="font-mono text-[10px] text-[var(--text-muted)]">
                    {totalReports} total
                  </p>
                </div>
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
                  {["A", "B", "C", "D", "F"].map((g) => {
                    const count = distribution[g] || 0;
                    if (count === 0) return null;
                    const pct = (count / distributionTotal) * 100;
                    const style = gradeStyle(g);
                    return (
                      <div
                        key={g}
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: gradeHex(g),
                        }}
                        title={`${count} grade ${g}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter chips */}
            <div className={`grid grid-cols-2 ${s.gradeGap} sm:grid-cols-5`}>
              {["A", "B", "C", "D", "F"].map((g) => {
                const count = distribution[g] || 0;
                const style = gradeStyle(g);
                const label =
                  g === "A"
                    ? "Excellent"
                    : g === "B"
                      ? "Good"
                      : g === "C"
                        ? "Average"
                        : g === "D"
                          ? "Needs work"
                          : "Critical";
                const active = filterGrade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFilterGrade(active ? "all" : g)}
                    aria-pressed={active}
                    disabled={count === 0 && !active}
                    className={`group relative overflow-hidden rounded-xl border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.98] disabled:opacity-50 ${
                      compact ? "p-2.5" : "p-3"
                    } ${
                      active
                        ? `${style.border} ${style.background} shadow-[var(--shadow-md)]`
                        : "border-[var(--border-light)] bg-[var(--bg-primary)] hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-current opacity-60"
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[11px] font-bold ${style.badge}`}
                      >
                        {g}
                      </span>
                      {active && (
                        <span
                          className={`font-mono text-[9px] font-bold uppercase tracking-wider ${style.text}`}
                        >
                          Filter
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-2 font-mono font-bold tabular-nums text-[var(--text-primary)] ${
                        compact ? "text-lg" : "text-xl"
                      }`}
                    >
                      {count}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════ TOOLBAR ═══════════ */}
        {reports.length > 0 && (
          <div
            className={`relative mb-4 overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] ${s.toolbarPadding}`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40"
            />
            <div className="flex flex-col gap-2 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  aria-label="Search reports"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search repositories or summaries..."
                  className="h-10 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] pl-10 pr-4 text-[13px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:w-[340px]">
                <div className="relative flex-1">
                  <Filter
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />
                  <select
                    aria-label="Filter by grade"
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="h-10 w-full appearance-none rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] pl-9 pr-8 text-[13px] text-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  >
                    <option value="all">All grades</option>
                    {["A", "B", "C", "D", "F"].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  aria-label="Sort reports"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-3 text-[13px] text-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                >
                  <option value="date">Newest</option>
                  <option value="score">Highest Score</option>
                  <option value="grade">Grade</option>
                </select>
              </div>
            </div>
            {(search || filterGrade !== "all") && (
              <div className="mt-2 flex items-center justify-between border-t border-[var(--border-dark)] pt-2">
                <p className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--accent)]">
                    {filtered.length} match{filtered.length === 1 ? "" : "es"}
                  </span>
                  {totalPages > 1 && (
                    <span className="font-mono text-[var(--text-muted)]">
                      · {totalReports} total
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilterGrade("all");
                  }}
                  className="rounded text-[11px] font-medium text-[var(--accent)] transition-colors duration-150 hover:text-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 active:scale-[0.97]"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ LOADING ═══════════ */}
        {(loading || pageLoading) && (
          <div
            className={`grid grid-cols-1 ${s.reportGridGap} md:grid-cols-2 xl:grid-cols-3`}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonCard key={i} compact={compact} />
            ))}
          </div>
        )}

        {/* ═══════════ EMPTY STATE ═══════════ */}
        {!loading && !pageLoading && reports.length === 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50"
            />
            <div className="relative px-6 py-14 sm:px-10 sm:py-16">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_12px_28px_-16px_var(--accent-soft-strong)]">
                  <Inbox size={26} strokeWidth={1.7} aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  No reviews yet
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-5 text-[var(--text-muted)]">
                  Run your first repository scan and this page becomes your
                  audit log — every report, every grade, searchable forever.
                </p>
              </div>

              <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    n: "01",
                    title: "Paste a repo URL",
                    desc: "Any public GitHub repository",
                  },
                  {
                    n: "02",
                    title: "Get your audit",
                    desc: "Architecture, security, bugs, tests",
                  },
                  {
                    n: "03",
                    title: "Find it here",
                    desc: "Compare, filter, and re-export",
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
                      {step.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="group inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-[12.5px] font-semibold text-[var(--accent-contrast)] shadow-[0_8px_24px_-8px_var(--accent-soft-strong)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.97]"
                >
                  <Sparkles size={13} strokeWidth={2.4} aria-hidden="true" />
                  Run your first scan
                  <ArrowRight
                    size={13}
                    strokeWidth={2.4}
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ NO MATCHES ═══════════ */}
        {!loading &&
          !pageLoading &&
          reports.length > 0 &&
          filtered.length === 0 && (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-primary)] text-[var(--text-muted)]">
                <Search size={22} strokeWidth={2} aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                No matching reports
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                Try changing your search or filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterGrade("all");
                }}
                className="mt-4 rounded-lg bg-[var(--accent-soft)] px-3.5 py-1.5 text-[11px] font-semibold text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent-soft-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 active:scale-[0.97]"
              >
                Clear filters
              </button>
            </div>
          )}

        {/* ═══════════ REPORT GRID ═══════════ */}
        {!loading && !pageLoading && filtered.length > 0 && (
          <div
            className={`grid grid-cols-1 ${s.reportGridGap} md:grid-cols-2 xl:grid-cols-3`}
          >
            {filtered.map((r) => (
              <ReportCard
                key={r._id}
                report={r}
                onView={() => viewReport(r)}
                onDownload={(e) => downloadPDF(r._id, e)}
                compact={compact}
                showScores={showScores}
              />
            ))}
          </div>
        )}

        {/* ═══════════ PAGINATION ═══════════ */}
        {!loading &&
          !pageLoading &&
          reports.length > 0 &&
          totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-dark)] pt-4 sm:flex-row">
              <p className="text-[11px] text-[var(--text-muted)]">
                Page{" "}
                <span className="font-mono font-medium text-[var(--text-secondary)]">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-mono font-medium text-[var(--text-secondary)]">
                  {totalPages}
                </span>{" "}
                · {totalReports} total
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => loadPage(page - 1)}
                  disabled={!hasPrev}
                  aria-label="Previous page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--border-light)] disabled:hover:text-[var(--text-secondary)]"
                >
                  <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
                </button>

                {pageList(page, totalPages).map((p, i) => {
                  if (p === "…") {
                    return (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-1 font-mono text-[11px] text-[var(--text-muted)]"
                      >
                        …
                      </span>
                    );
                  }
                  const active = p === page;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => loadPage(p)}
                      disabled={active}
                      aria-current={active ? "page" : undefined}
                      className={`min-w-[32px] rounded-lg px-2.5 py-1.5 font-mono text-[12px] font-medium tabular-nums transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 ${
                        active
                          ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_6px_16px_-8px_var(--accent-soft-strong)]"
                          : "border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => loadPage(page + 1)}
                  disabled={!hasNext}
                  aria-label="Next page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--border-light)] disabled:hover:text-[var(--text-secondary)]"
                >
                  <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

        {/* ═══════════ FOOTER ═══════════ */}
        {!loading && reports.length > 0 && (
          <div
            className={`flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)] ${s.footerMargin}`}
          >
            <span>CodeVerity</span>
            <span>•</span>
            <span>AI Repository Intelligence</span>
          </div>
        )}
      </div>

      {/* ═══════════ VIEW LOADING OVERLAY ═══════════ */}
      {viewLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-6 py-5 shadow-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
            <p className="text-xs text-[var(--text-muted)]">Loading report…</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REPORT CARD
// ═══════════════════════════════════════════════════════════════
function ReportCard({ report: r, onView, onDownload, compact, showScores }) {
  const grade = r.grade ?? "N/A";
  const styles = gradeStyle(grade[0]);

  const avg = r.scores
    ? Math.round(
        (Number(r.scores.codeQuality || 0) +
          Number(r.scores.security || 0) +
          Number(r.scores.performance || 0) +
          Number(r.scores.maintainability || 0)) /
          4
      )
    : 0;

  const repoName = getRepoName(r.repoUrl);
  const owner = getRepoOwner(r.repoUrl);
  const date = r.createdAt
    ? new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const pad = compact ? "p-3" : "p-4";
  const scoreSize = compact ? "text-xl" : "text-2xl";
  const avatarSize = compact ? 32 : 36;

  return (
    <div
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView();
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
    >
      {/* Header */}
      <div className={`relative border-b border-[var(--border-dark)] ${pad}`}>
        {/* Top accent gradient appears on hover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <RepoAvatar
              owner={owner}
              fallback={initialsOf(repoName)}
              size={avatarSize}
            />
            <div className="min-w-0">
              <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Repository
              </p>
              <h2
                className="truncate font-mono text-sm font-semibold text-[var(--text-primary)]"
                title={repoName}
              >
                {repoName}
              </h2>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${styles.badge} ${styles.border}`}
            >
              {grade}
            </span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              {date}
            </span>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-[var(--text-secondary)]">
          {r.summary || "No summary available"}
        </p>
      </div>

      {/* Body */}
      <div className={`flex flex-1 flex-col ${pad}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Overall Score
            </p>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className={`font-mono font-bold ${scoreSize} ${styles.text}`}>
                {avg}
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                / 100
              </span>
            </div>
          </div>
          <div className="relative h-11 w-11">
            <svg viewBox="0 0 36 36" className="-rotate-90">
              <path
                d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-[var(--border-light)]"
              />
              <path
                d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${avg}, 100`}
                className={`${styles.text} transition-all duration-700`}
                style={{
                  filter: "drop-shadow(0 0 4px currentColor)",
                  opacity: 0.9,
                }}
              />
            </svg>
          </div>
        </div>

        {showScores && (
          <div
            className={`mt-4 space-y-2.5 ${compact ? "mt-3 space-y-2" : ""}`}
          >
            {[
              ["Code Quality", r.scores?.codeQuality],
              ["Security", r.scores?.security],
              ["Performance", r.scores?.performance],
              ["Maintainability", r.scores?.maintainability],
            ].map(([label, val]) => (
              <ScoreBar
                key={label}
                label={label}
                value={val}
                compact={compact}
              />
            ))}
          </div>
        )}

        {r.toolsAndPackages?.length > 0 && (
          <div
            className={`mt-4 border-t border-[var(--border-dark)] pt-3 ${
              compact ? "mt-3 pt-2" : ""
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Technologies
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {r.toolsAndPackages.length} detected
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {r.toolsAndPackages.slice(0, 4).map((t, i) => (
                <span
                  key={i}
                  className="rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                >
                  {t}
                </span>
              ))}
              {r.toolsAndPackages.length > 4 && (
                <span className="rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                  +{r.toolsAndPackages.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className={`mt-auto flex items-center justify-between border-t border-[var(--border-dark)] pt-3 ${
            compact ? "mt-3 pt-2" : "mt-4"
          }`}
        >
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            Analysis complete
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={onDownload}
              aria-label="Download PDF"
              className={`inline-flex items-center gap-1 rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] text-[11px] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 active:scale-[0.96] ${
                compact ? "px-2 py-1" : "px-2.5 py-1.5"
              }`}
            >
              <Download size={12} strokeWidth={2} aria-hidden="true" />
              PDF
            </button>
            <button
              type="button"
              onClick={onView}
              className={`group/btn relative overflow-hidden rounded-md bg-[var(--accent)] text-[11px] font-semibold text-[var(--accent-contrast)] transition-all duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.96] ${
                compact ? "px-2 py-1" : "px-2.5 py-1.5"
              }`}
            >
              <ScanLine />
              <span className="relative z-10 flex items-center gap-1 whitespace-nowrap">
                View
                <ArrowRight
                  size={12}
                  strokeWidth={2.2}
                  aria-hidden="true"
                  className="transition-transform duration-150 group-hover/btn:translate-x-0.5"
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────
function ScoreBar({ label, value, compact }) {
  const val = typeof value === "number" ? Math.min(Math.max(value, 0), 100) : 0;
  const color =
    val >= 75
      ? "bg-[var(--color-success)]"
      : val >= 50
        ? "bg-[var(--color-warning)]"
        : "bg-[var(--color-danger)]";

  const barHeight = compact ? "h-0.5" : "h-1";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
        <span className="font-mono text-[10px] font-medium text-[var(--text-secondary)]">
          {typeof value === "number" ? `${val}%` : "N/A"}
        </span>
      </div>
      <div
        className={`overflow-hidden rounded-full bg-[var(--border-dark)] ${barHeight}`}
      >
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}

// ─── Grade styles ─────────────────────────────────────────────
function gradeStyle(letter) {
  const map = {
    A: {
      badge: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
      text: "text-[var(--color-success)]",
      border: "border-[var(--color-success)]/30",
      background: "bg-[var(--color-success-soft)]",
    },
    B: {
      badge: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
      text: "text-[var(--color-info)]",
      border: "border-[var(--color-info)]/30",
      background: "bg-[var(--color-info-soft)]",
    },
    C: {
      badge: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
      text: "text-[var(--color-warning)]",
      border: "border-[var(--color-warning)]/30",
      background: "bg-[var(--color-warning-soft)]",
    },
    D: {
      badge: "bg-[var(--color-caution-soft)] text-[var(--color-caution)]",
      text: "text-[var(--color-caution)]",
      border: "border-[var(--color-caution)]/30",
      background: "bg-[var(--color-caution-soft)]",
    },
    F: {
      badge: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
      text: "text-[var(--color-danger)]",
      border: "border-[var(--color-danger)]/30",
      background: "bg-[var(--color-danger-soft)]",
    },
  };
  return (
    map[letter] ?? {
      badge: "bg-[var(--bg-hover)] text-[var(--text-muted)]",
      text: "text-[var(--text-muted)]",
      border: "border-[var(--border-light)]",
      background: "bg-[var(--bg-hover)]",
    }
  );
}

// Distribution bar needs raw hex so it can interpolate widths
function gradeHex(letter) {
  return (
    {
      A: "var(--color-success)",
      B: "var(--color-info)",
      C: "var(--color-warning)",
      D: "var(--color-caution)",
      F: "var(--color-danger)",
    }[letter] || "var(--text-muted)"
  );
}