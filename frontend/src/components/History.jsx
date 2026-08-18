import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { generateTests } from "../api/github";
import Result from "./Result";

const API = "http://localhost:5000";

export default function History() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterGrade, setFilterGrade] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API}/api/report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setReports(res.data.reports || []);
      })
      .catch(() => {
        alert("Failed to load history");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const downloadPDF = async (id, e) => {
    e?.stopPropagation();

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/api/report/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "CodeVerity-Audit.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      alert("Download failed");
    }
  };

  /* =========================================================
     FILTER + SORT
  ========================================================= */

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
      list = list.filter(
        (r) => (r.grade ?? "N/A")[0] === filterGrade
      );
    }

    list.sort((a, b) => {
      if (sortBy === "grade") {
        return (a.grade ?? "Z").localeCompare(
          b.grade ?? "Z"
        );
      }

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

      return (
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );
    });

    return list;
  }, [
    reports,
    search,
    sortBy,
    filterGrade,
  ]);

  /* =========================================================
     FULL REPORT VIEW
  ========================================================= */

  if (selected) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white">

        <div className="sticky top-0 z-50 border-b border-[#30363d] bg-[#24282f] px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-4">

            <button
              onClick={() => setSelected(null)}
              className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#8b949e] transition hover:bg-[#30363d] hover:text-[#f0f6fc]"
            >
              <span className="transition-transform group-hover:-translate-x-1">
                ←
              </span>

              Back to History
            </button>

            <div className="h-5 w-px bg-[#30363d]" />

            <div className="flex min-w-0 items-center gap-2">

              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 text-[#484f58]"
              >
                <path d="M14.5 17.5 21 12l-6.5-5.5" />
                <path d="M9.5 6.5 3 12l6.5 5.5" />
              </svg>

              <span className="truncate text-xs text-[#484f58]">
                {selected.repoUrl}
              </span>
            </div>
          </div>
        </div>

        <Result
          data={selected}
          onDownload={(e) =>
            downloadPDF(selected._id, e)
          }
          generateTestsFn={generateTests}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] px-4 py-7 text-white sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-7">

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#f0f6fc] sm:text-4xl">
                Review History
              </h1>

              <p className="mt-1.5 max-w-xl text-sm leading-5 text-[#8b949e]">
                Browse, compare and revisit your previous GitHub repository
                audits.
              </p>

            </div>

            {/* Report Count */}

            <div className="flex w-fit items-center gap-3 rounded-xl border border-[#30363d] bg-[#161b22] px-3.5 py-2.5">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f6feb]/10 text-[#58a6ff]">

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" />
                  <path d="M8 13h8" />
                  <path d="M8 17h5" />
                </svg>

              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wide text-[#484f58]">
                  Total Reviews
                </p>

                <p className="text-base font-semibold text-[#f0f6fc]">
                  {reports.length}
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* =====================================================
            GRADE SUMMARY
        ===================================================== */}

        {reports.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">

            {["A", "B", "C", "D", "F"].map((g) => {

              const count = reports.filter(
                (r) => (r.grade ?? "N/A")[0] === g
              ).length;

              const style = gradeStyle(g);

              return (
                <button
                  key={g}
                  onClick={() =>
                    setFilterGrade(
                      filterGrade === g
                        ? "all"
                        : g
                    )
                  }
                  className={`group rounded-xl border p-3 text-left transition-all duration-200 ${
                    filterGrade === g
                      ? `${style.border} ${style.background}`
                      : "border-[#30363d] bg-[#161b22] hover:border-[#484f58]"
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${style.badge}`}
                    >
                      {g}
                    </span>

                    <span className="text-[10px] text-[#484f58]">
                      {filterGrade === g
                        ? "Selected"
                        : "Filter"}
                    </span>

                  </div>

                  <p className="mt-2 text-lg font-semibold text-[#f0f6fc]">
                    {count}
                  </p>

                  <p className="text-[10px] text-[#484f58]">
                    {g === "A"
                      ? "Excellent"
                      : g === "B"
                      ? "Good"
                      : g === "C"
                      ? "Average"
                      : g === "D"
                      ? "Needs work"
                      : "Critical"}
                  </p>

                </button>
              );
            })}

          </div>
        )}

        {/* =====================================================
            TOOLBAR
        ===================================================== */}

        {reports.length > 0 && (
          <div className="mb-5 rounded-xl border border-[#30363d] bg-[#161b22] p-2.5">

            <div className="flex flex-col gap-2.5 lg:flex-row">

              {/* Search */}

              <div className="relative flex-1">

                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#484f58]"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search repositories or summaries..."
                  className="h-10 w-full rounded-lg border border-[#30363d] bg-[#0d1117] pl-10 pr-4 text-xs text-[#f0f6fc] outline-none transition placeholder:text-[#484f58] focus:border-[#1f6feb]/60 focus:ring-2 focus:ring-[#1f6feb]/10"
                />

              </div>

              {/* Filters */}

              <div className="flex gap-2">

                <select
                  value={filterGrade}
                  onChange={(e) =>
                    setFilterGrade(e.target.value)
                  }
                  className="h-10 rounded-lg border border-[#30363d] bg-[#0d1117] px-3 text-xs text-[#8b949e] outline-none transition focus:border-[#1f6feb]/60"
                >
                  <option value="all">
                    All grades
                  </option>

                  {["A", "B", "C", "D", "F"].map(
                    (g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                  className="h-10 rounded-lg border border-[#30363d] bg-[#0d1117] px-3 text-xs text-[#8b949e] outline-none transition focus:border-[#1f6feb]/60"
                >
                  <option value="date">
                    Newest
                  </option>

                  <option value="score">
                    Highest Score
                  </option>

                  <option value="grade">
                    Grade
                  </option>
                </select>

              </div>

            </div>

            {(search || filterGrade !== "all") && (
              <div className="mt-2.5 flex items-center justify-between border-t border-[#21262d] pt-2.5">

                <p className="text-[10px] text-[#484f58]">
                  Showing{" "}
                  <span className="font-medium text-[#8b949e]">
                    {filtered.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-[#8b949e]">
                    {reports.length}
                  </span>{" "}
                  reports
                </p>

                <button
                  onClick={() => {
                    setSearch("");
                    setFilterGrade("all");
                  }}
                  className="text-[10px] text-[#58a6ff] transition hover:text-[#79c0ff]"
                >
                  Clear filters
                </button>

              </div>
            )}

          </div>
        )}

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <div className="flex min-h-[360px] flex-col items-center justify-center">

            <div className="relative">

              <div className="h-10 w-10 rounded-full border-2 border-[#30363d]" />

              <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-[#3b82f6]" />

            </div>

            <p className="mt-4 text-sm font-medium text-[#8b949e]">
              Loading your reviews
            </p>

            <p className="mt-1 text-[10px] text-[#484f58]">
              Fetching your CodeVerity audit history...
            </p>

          </div>
        )}

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {!loading && reports.length === 0 && (
          <div className="flex min-h-[420px] items-center justify-center">

            <div className="max-w-md text-center">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#30363d] bg-[#161b22]">

                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-[#484f58]"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" />
                  <path d="M8 13h8" />
                  <path d="M8 17h5" />
                </svg>

              </div>

              <h2 className="text-lg font-semibold text-[#f0f6fc]">
                No reviews yet
              </h2>

              <p className="mt-2 text-sm leading-5 text-[#484f58]">
                Analyze a GitHub repository and your AI-powered code audit
                will appear here.
              </p>

            </div>

          </div>
        )}

        {/* =====================================================
            NO FILTER RESULTS
        ===================================================== */}

        {!loading &&
          reports.length > 0 &&
          filtered.length === 0 && (
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] py-16 text-center">

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0d1117] text-[#484f58]">

                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>

              </div>

              <p className="text-sm font-medium text-[#f0f6fc]">
                No matching reports
              </p>

              <p className="mt-1 text-xs text-[#484f58]">
                Try changing your search or filters.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setFilterGrade("all");
                }}
                className="mt-4 rounded-lg bg-[#1f6feb]/10 px-3 py-1.5 text-[10px] font-medium text-[#58a6ff] transition hover:bg-[#1f6feb]/20"
              >
                Clear filters
              </button>

            </div>
          )}

        {/* =====================================================
            REPORT GRID
        ===================================================== */}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

            {filtered.map((r) => (
              <ReportCard
                key={r._id}
                report={r}
                onView={() =>
                  setSelected({
                    ...r,
                    _sourceCode:
                      r._sourceCode ?? "",
                  })
                }
                onDownload={(e) =>
                  downloadPDF(r._id, e)
                }
              />
            ))}

          </div>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

        {!loading && reports.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-[#30363d]">
            <span>CodeVerity</span>
            <span>•</span>
            <span>AI Repository Intelligence</span>
          </div>
        )}

      </div>
    </div>
  );
}

/* =========================================================
   REPORT CARD
========================================================= */

function ReportCard({
  report: r,
  onView,
  onDownload,
}) {
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

  const repoName =
    r.repoUrl?.replace(
      "https://github.com/",
      ""
    ) ?? "Unknown";

  const date = r.createdAt
    ? new Date(r.createdAt).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      )
    : "";

  return (
    <div
      onClick={onView}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#484f58] hover:shadow-xl hover:shadow-black/20"
    >

      {/* =====================================================
          CARD HEADER
      ===================================================== */}

      <div className="border-b border-[#21262d] p-4">

        <div className="flex items-start justify-between gap-3">

          {/* Repository */}

          <div className="flex min-w-0 items-center gap-2.5">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0d1117] text-[#484f58] transition group-hover:text-[#58a6ff]">

              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.97 3.22 9.19 7.68 10.68.56.1.77-.24.77-.54v-1.89c-3.12.68-3.78-1.33-3.78-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.62 1.22 3.26.93.1-.73.39-1.22.71-1.5-2.49-.28-5.11-1.25-5.11-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.7 10.7 0 0 1 5.64 0c2.15-1.45 3.1-1.15 3.1-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.13 5.55.4.35.76 1.05.76 2.12v3.15c0 .3.2.65.78.54a11.27 11.27 0 0 0 7.67-10.68C23.25 5.48 18.27.5 12 .5Z" />
              </svg>

            </div>

            <div className="min-w-0">

              <p className="mb-0.5 text-[9px] uppercase tracking-wider text-[#484f58]">
                Repository
              </p>

              <h2 className="truncate text-[13px] font-semibold text-[#f0f6fc]">
                {repoName}
              </h2>

            </div>

          </div>

          {/* Grade + Date */}

          <div className="flex shrink-0 flex-col items-end gap-1">

            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-bold ${styles.badge} ${styles.border}`}
            >
              {grade}
            </span>

            <span className="text-[9px] text-[#484f58]">
              {date}
            </span>

          </div>

        </div>

        {/* Summary */}

        <p className="mt-3 line-clamp-2 text-[11px] leading-4.5 text-[#8b949e]">
          {r.summary || "No summary available"}
        </p>

      </div>

      {/* =====================================================
          SCORE SECTION
      ===================================================== */}

      <div className="p-4">

        {/* Score */}

        <div className="flex items-center justify-between">

          <div>

            <p className="text-[9px] uppercase tracking-wider text-[#484f58]">
              Overall Score
            </p>

            <div className="mt-0.5 flex items-baseline gap-1">

              <span
                className={`text-2xl font-bold ${styles.text}`}
              >
                {avg}
              </span>

              <span className="text-[10px] text-[#484f58]">
                / 100
              </span>

            </div>

          </div>

          {/* Compact Score Circle */}

          <div className="relative h-10 w-10">

            <svg
              viewBox="0 0 36 36"
              className="-rotate-90"
            >

              <path
                d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-[#30363d]"
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

        {/* Score Bars */}

        <div className="mt-3.5 space-y-2.5">

          {[
            [
              "Code Quality",
              r.scores?.codeQuality,
            ],
            [
              "Security",
              r.scores?.security,
            ],
            [
              "Performance",
              r.scores?.performance,
            ],
            [
              "Maintainability",
              r.scores?.maintainability,
            ],
          ].map(([label, val]) => (
            <ScoreBar
              key={label}
              label={label}
              value={val}
            />
          ))}

        </div>

        {/* =================================================
            TECHNOLOGIES
        ================================================= */}

        {r.toolsAndPackages?.length > 0 && (
          <div className="mt-4 border-t border-[#21262d] pt-3">

            <div className="mb-2 flex items-center justify-between">

              <span className="text-[9px] uppercase tracking-wider text-[#484f58]">
                Technologies
              </span>

              <span className="text-[9px] text-[#484f58]">
                {r.toolsAndPackages.length} detected
              </span>

            </div>

            <div className="flex flex-wrap gap-1.5">

              {r.toolsAndPackages
                .slice(0, 4)
                .map((t, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-[#30363d] bg-[#0d1117] px-1.5 py-0.5 text-[9px] text-[#8b949e] transition hover:border-[#1f6feb]/40 hover:text-[#58a6ff]"
                  >
                    {t}
                  </span>
                ))}

              {r.toolsAndPackages.length > 4 && (
                <span className="rounded-md border border-[#30363d] bg-[#0d1117] px-1.5 py-0.5 text-[9px] text-[#484f58]">
                  +{r.toolsAndPackages.length - 4}
                </span>
              )}

            </div>

          </div>
        )}

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="mt-4 flex items-center justify-between border-t border-[#21262d] pt-3">

          <span className="flex items-center gap-1.5 text-[9px] text-[#484f58]">

            <span className="h-1.5 w-1.5 rounded-full bg-[#00d084]" />

            Analysis complete

          </span>

          <div className="flex gap-1.5">

            <button
              onClick={onDownload}
              className="rounded-md border border-[#30363d] bg-[#0d1117] px-2.5 py-1.5 text-[9px] font-medium text-[#8b949e] transition hover:border-[#484f58] hover:text-[#f0f6fc]"
            >
              ↓ PDF
            </button>

            <button
              onClick={onView}
              className="rounded-md bg-[#1f6feb]/15 px-2.5 py-1.5 text-[9px] font-semibold text-[#58a6ff] transition hover:bg-[#1f6feb]/25"
            >
              View Report →
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   SCORE BAR
========================================================= */

function ScoreBar({ label, value }) {
  const val =
    typeof value === "number"
      ? Math.min(Math.max(value, 0), 100)
      : 0;

  const color =
    val >= 75
      ? "from-emerald-400 to-green-500"
      : val >= 50
      ? "from-yellow-400 to-orange-400"
      : "from-red-400 to-rose-500";

  return (
    <div>

      <div className="mb-1 flex items-center justify-between">

        <span className="text-[9px] text-[#484f58]">
          {label}
        </span>

        <span className="text-[9px] font-medium text-[#8b949e]">
          {typeof value === "number"
            ? `${val}%`
            : "N/A"}
        </span>

      </div>

      <div className="h-1 overflow-hidden rounded-full bg-[#21262d]">

        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{
            width: `${val}%`,
          }}
        />

      </div>

    </div>
  );
}

/* =========================================================
   GRADE STYLES
========================================================= */

function gradeStyle(letter) {
  const map = {
    A: {
      badge:
        "bg-emerald-500/10 text-emerald-400",
      text: "text-emerald-400",
      border:
        "border-emerald-500/20",
      background:
        "bg-emerald-500/5",
    },

    B: {
      badge:
        "bg-blue-500/10 text-blue-400",
      text: "text-blue-400",
      border:
        "border-blue-500/20",
      background:
        "bg-blue-500/5",
    },

    C: {
      badge:
        "bg-yellow-500/10 text-yellow-400",
      text: "text-yellow-400",
      border:
        "border-yellow-500/20",
      background:
        "bg-yellow-500/5",
    },

    D: {
      badge:
        "bg-orange-500/10 text-orange-400",
      text: "text-orange-400",
      border:
        "border-orange-500/20",
      background:
        "bg-orange-500/5",
    },

    F: {
      badge:
        "bg-red-500/10 text-red-400",
      text: "text-red-400",
      border:
        "border-red-500/20",
      background:
        "bg-red-500/5",
    },
  };

  return (
    map[letter] ?? {
      badge:
        "bg-gray-500/10 text-gray-400",
      text: "text-gray-400",
      border:
        "border-gray-500/20",
      background:
        "bg-gray-500/5",
    }
  );
}