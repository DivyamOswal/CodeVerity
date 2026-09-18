// src/pages/History.jsx
import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";

import { generateTests } from "../api/github";
import Result from "./Result";
import { usePreferences } from "../context/PreferencesContext";
import { useToast } from "../hooks/useToast";

const API = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 20;

// -----------------------------------------------------------------
// ScanLine – reuses the global .animate-scanline utility from
// index.css.
// -----------------------------------------------------------------
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

// GitHub brand mark — custom SVG because lucide-react no longer
// exports the Github icon.
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

// -----------------------------------------------------------------
// Skeleton report card
// -----------------------------------------------------------------
function SkeletonCard({ compact }) {
  const pad = compact ? "p-3" : "p-4";
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]">
      <div className={`border-b border-[var(--border-dark)] ${pad}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-[var(--bg-hover)]" />
            <div className="space-y-1.5">
              <div className="h-2 w-14 rounded bg-[var(--bg-hover)]" />
              <div className="h-3 w-28 rounded bg-[var(--bg-hover)]" />
            </div>
          </div>
          <div className="h-5 w-8 shrink-0 rounded-md bg-[var(--bg-hover)]" />
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

// -----------------------------------------------------------------
// Main History Component
// -----------------------------------------------------------------
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

  // ---- Full Report View ----
  if (selected) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="sticky top-16 z-40 border-b border-[var(--border-light)] bg-[var(--bg-primary)]/80 backdrop-blur">
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
              <GithubIcon size={14} className="shrink-0 text-[var(--text-muted)]" />
              <span className="truncate font-mono text-[11px] text-[var(--text-muted)]">
                {selected.repoUrl}
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
      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${s.containerPadding} ${s.topPadding}`}
      >
        {/* HEADER */}
        <div className={s.headerMargin}>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1
                className={`font-bold leading-[1.05] tracking-tight text-[var(--text-primary)] ${
                  compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
                }`}
              >
                Review <span className="text-[var(--accent)]">History</span>
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

            <div className="relative flex w-fit items-center gap-3 overflow-hidden rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3.5 py-2.5 shadow-[var(--shadow-md)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50"
              />
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <FileText size={16} strokeWidth={2} aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  Total Reviews
                </p>
                <p className="font-mono text-base font-semibold text-[var(--text-primary)]">
                  {totalReports}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* GRADE SUMMARY */}
        {reports.length > 0 && (
          <div className={`mb-4 grid grid-cols-2 ${s.gradeGap} sm:grid-cols-5`}>
            {["A", "B", "C", "D", "F"].map((g) => {
              const count = reports.filter(
                (r) => (r.grade ?? "N/A")[0] === g
              ).length;
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
                  className={`group rounded-xl border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.98] ${
                    compact ? "p-2" : "p-3"
                  } ${
                    active
                      ? `${style.border} ${style.background} shadow-[var(--shadow-md)]`
                      : "border-[var(--border-light)] bg-[var(--bg-card)] hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[11px] font-bold ${style.badge}`}
                    >
                      {g}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {active ? "Selected" : "Filter"}
                    </span>
                  </div>
                  <p
                    className={`mt-2 font-mono font-semibold text-[var(--text-primary)] ${
                      compact ? "text-base" : "text-lg"
                    }`}
                  >
                    {count}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* TOOLBAR */}
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
                <p className="text-[10px] text-[var(--text-muted)]">
                  Showing{" "}
                  <span className="font-mono font-medium text-[var(--text-secondary)]">
                    {filtered.length}
                  </span>{" "}
                  on this page
                  {totalPages > 1 && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-mono text-[var(--text-muted)]">
                        {totalReports} total
                      </span>
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilterGrade("all");
                  }}
                  className="rounded text-[11px] text-[var(--accent)] transition-colors duration-150 hover:text-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 active:scale-[0.97]"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* LOADING */}
        {(loading || pageLoading) && (
          <div
            className={`grid grid-cols-1 ${s.reportGridGap} md:grid-cols-2 xl:grid-cols-3`}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonCard key={i} compact={compact} />
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !pageLoading && reports.length === 0 && (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]">
                <Inbox
                  size={28}
                  strokeWidth={1.6}
                  aria-hidden="true"
                  className="text-[var(--text-muted)]"
                />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                No reviews yet
              </h2>
              <p className="mt-2 text-[13px] leading-5 text-[var(--text-muted)]">
                Analyze a GitHub repository and your AI-powered code audit will
                appear here.
              </p>
            </div>
          </div>
        )}

        {/* NO FILTER RESULTS */}
        {!loading &&
          !pageLoading &&
          reports.length > 0 &&
          filtered.length === 0 && (
            <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] py-12 text-center">
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
                className="mt-4 rounded-lg bg-[var(--accent-soft)] px-3 py-1.5 text-[11px] font-medium text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent-soft-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 active:scale-[0.97]"
              >
                Clear filters
              </button>
            </div>
          )}

        {/* REPORT GRID */}
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

        {/* PAGINATION */}
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadPage(page - 1)}
                  disabled={!hasPrev}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                  <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => loadPage(page + 1)}
                  disabled={!hasNext}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                  Next
                  <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

        {/* FOOTER */}
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

      {/* View loading overlay */}
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

// -----------------------------------------------------------------
// Report Card
// -----------------------------------------------------------------
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

  const repoName = r.repoUrl?.replace("https://github.com/", "") ?? "Unknown";
  const date = r.createdAt
    ? new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const pad = compact ? "p-3" : "p-4";
  const scoreSize = compact ? "text-xl" : "text-2xl";

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
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
    >
      <div className={`border-b border-[var(--border-dark)] ${pad}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-primary)] text-[var(--text-muted)] transition-colors duration-150 group-hover:text-[var(--accent)]">
              <GithubIcon size={14} className="shrink-0 text-[var(--text-muted)]" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Repository
              </p>
              <h2 className="truncate font-mono text-sm font-semibold text-[var(--text-primary)]">
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

      <div className={pad}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
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
          <div className="relative h-10 w-10">
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
                strokeDasharray={`${avg}, 100`}
                className={styles.text}
              />
            </svg>
          </div>
        </div>

        {showScores && (
          <div
            className={`mt-3.5 space-y-2.5 ${compact ? "mt-2.5 space-y-2" : ""}`}
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

        <div
          className={`mt-4 flex items-center justify-between border-t border-[var(--border-dark)] pt-3 ${
            compact ? "mt-3 pt-2" : ""
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
                View Report
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

// -----------------------------------------------------------------
// ScoreBar
// -----------------------------------------------------------------
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

// -----------------------------------------------------------------
// Grade Styles
// -----------------------------------------------------------------
function gradeStyle(letter) {
  const map = {
    A: {
      badge: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
      text: "text-[var(--color-success)]",
      border: "border-[var(--color-success)]/20",
      background: "bg-[var(--color-success-soft)]",
    },
    B: {
      badge: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
      text: "text-[var(--color-info)]",
      border: "border-[var(--color-info)]/20",
      background: "bg-[var(--color-info-soft)]",
    },
    C: {
      badge: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
      text: "text-[var(--color-warning)]",
      border: "border-[var(--color-warning)]/20",
      background: "bg-[var(--color-warning-soft)]",
    },
    D: {
      badge: "bg-[var(--color-caution-soft)] text-[var(--color-caution)]",
      text: "text-[var(--color-caution)]",
      border: "border-[var(--color-caution)]/20",
      background: "bg-[var(--color-caution-soft)]",
    },
    F: {
      badge: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
      text: "text-[var(--color-danger)]",
      border: "border-[var(--color-danger)]/20",
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