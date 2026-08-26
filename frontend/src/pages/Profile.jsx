// frontend/src/pages/Profile.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import axios from "../api/axios";
import { usePreferences } from "../context/PreferencesContext";

/* =========================================================
   CODEVERITY LOGO – flat indigo accent (matches other pages)
========================================================= */

function CodeVerityLogo() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] shadow-lg shadow-[var(--accent-soft-strong)]">
      <div className="absolute inset-[1px] rounded-[11px] bg-[var(--bg-primary)]" />
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative text-[var(--accent)]"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md bg-[var(--bg-secondary)] border border-[var(--border-light)]">
        <span className="text-[6px] font-bold text-[var(--accent)]">&lt;/&gt;</span>
      </div>
      <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
    </div>
  );
}

/* =========================================================
   PROFILE
========================================================= */

export default function Profile() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const { compact } = usePreferences();

  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        name: payload.name ?? "",
        email: payload.email ?? "",
        role: payload.role ?? "user",
      });
    } catch {
      /* ignore */
    }

    const mePromise = axios
      .get("/auth/me")
      .then((res) => {
        const u = res.data.user ?? res.data;
        setUser(u);
      })
      .catch(() => {});

    const reportsPromise = axios
      .get("/report")
      .then((res) => {
        setReports(res.data.reports ?? []);
      })
      .catch(() => {
        setReports([]);
      });

    Promise.all([mePromise, reportsPromise]).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, [token]);

  if (loading && !user) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4 text-[var(--text-primary)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
          <span className="text-xl">!</span>
        </div>
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={load}
          className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-medium)] hover:text-[var(--text-primary)]"
        >
          Retry
        </button>
      </div>
    );
  }

  const totalScans = reports.length;

  const avgScore = totalScans
    ? Math.round(
        reports.reduce(
          (s, r) =>
            s +
            ((r.scores?.codeQuality ?? 0) +
              (r.scores?.security ?? 0) +
              (r.scores?.performance ?? 0) +
              (r.scores?.maintainability ?? 0)) /
              4,
          0
        ) / totalScans
      )
    : 0;

  const bestReport = [...reports].sort((a, b) => {
    const avg = (r) =>
      ((r.scores?.codeQuality ?? 0) +
        (r.scores?.security ?? 0) +
        (r.scores?.performance ?? 0) +
        (r.scores?.maintainability ?? 0)) /
      4;
    return avg(b) - avg(a);
  })[0];

  const gradeCounts = reports.reduce((acc, r) => {
    const g = (r.grade ?? "N/A")[0];
    acc[g] = (acc[g] ?? 0) + 1;
    return acc;
  }, {});

  const name = user?.name || user?.email || "User";
  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  // ============================================================
  // COMPACT CLASSES – now includes top padding for navbar
  // ============================================================
  const compactClasses = compact
    ? {
        // Top padding to account for sticky navbar (h-14)
        topPadding: "pt-14",
        container: "px-3 py-4 sm:px-4",
        headerMargin: "mb-3",
        heading: "text-lg sm:text-xl",
        subHeading: "text-[10px]",
        heroPadding: "p-4 sm:p-4",
        heroGap: "gap-3",
        avatarSize: "h-16 w-16 text-xl",
        avatarOnline: "h-4 w-4",
        nameSize: "text-lg",
        roleSize: "text-[9px]",
        userEmailSize: "text-[10px]",
        pillsGap: "gap-1.5",
        pillPadding: "px-2 py-1 text-[9px]",
        statsGap: "gap-2",
        statCardPadding: "p-3",
        statValueSize: "text-xl",
        statIconSize: "h-6 w-6 text-xs",
        gradeBreakdownPadding: "p-4",
        gradeBreakdownMargin: "mb-3",
        gradeLabelSize: "text-[9px]",
        gradeBarHeight: "h-1",
        recentActivityPadding: "p-1.5",
        recentRowPadding: "px-2 py-2",
        recentRepoSize: "text-[10px]",
        recentDateSize: "text-[9px]",
        recentScoreSize: "text-[9px] px-1.5 py-0.5",
        emptyStatePadding: "py-10 px-4",
        emptyStateTitle: "text-sm",
        emptyStateDesc: "text-[10px]",
        footerMargin: "mt-4",
        footerText: "text-[9px]",
        viewAllButton: "text-[9px] px-2 py-1",
        settingsButton: "px-3 py-2 text-[10px]",
      }
    : {
        // Top padding to account for sticky navbar (h-16)
        topPadding: "pt-16",
        container: "px-4 py-6 sm:px-6 lg:px-8",
        headerMargin: "mb-5",
        heading: "text-xl sm:text-2xl",
        subHeading: "text-xs",
        heroPadding: "p-5 sm:p-6",
        heroGap: "gap-5",
        avatarSize: "h-20 w-20 text-2xl",
        avatarOnline: "h-5 w-5",
        nameSize: "text-xl",
        roleSize: "text-[9px]",
        userEmailSize: "text-xs",
        pillsGap: "gap-2",
        pillPadding: "px-2.5 py-1.5 text-[9px]",
        statsGap: "gap-3",
        statCardPadding: "p-4",
        statValueSize: "text-2xl",
        statIconSize: "h-8 w-8 text-sm",
        gradeBreakdownPadding: "p-5",
        gradeBreakdownMargin: "mb-5",
        gradeLabelSize: "text-[10px]",
        gradeBarHeight: "h-1.5",
        recentActivityPadding: "p-2",
        recentRowPadding: "px-3 py-3",
        recentRepoSize: "text-[11px]",
        recentDateSize: "text-[9px]",
        recentScoreSize: "text-[9px] px-2 py-1",
        emptyStatePadding: "py-16 px-6",
        emptyStateTitle: "text-base",
        emptyStateDesc: "text-xs",
        footerMargin: "mt-6",
        footerText: "text-[9px]",
        viewAllButton: "text-[10px] px-2.5 py-1.5",
        settingsButton: "px-4 py-2.5 text-xs",
      };

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${compactClasses.topPadding}`}>
      <div className={`mx-auto w-full max-w-7xl ${compactClasses.container}`}>
        <div className={`space-y-5 ${compact ? "space-y-4" : "space-y-5"}`}>
          {/* PAGE HEADER – matches Dashboard header style */}
          <div className={compactClasses.headerMargin}>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Account
              </span>
            </div>
            <h1 className={`mt-1 font-bold tracking-tight text-[var(--text-primary)] ${compactClasses.heading}`}>
              Profile
            </h1>
            <p className={`text-[var(--text-muted)] ${compactClasses.subHeading}`}>
              Manage your CodeVerity account and audit history.
            </p>
          </div>

          {/* HERO – User Profile Card */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-3xl" />

            <div className={`relative flex flex-col ${compactClasses.heroGap} ${compactClasses.heroPadding} sm:flex-row sm:items-center`}>
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={`flex items-center justify-center rounded-2xl bg-[var(--accent)] font-bold shadow-lg shadow-[var(--accent-soft-strong)] text-[var(--accent-contrast,#ffffff)] ${compactClasses.avatarSize}`}>
                  {initials}
                </div>
                <div className={`absolute -bottom-1.5 -right-1.5 flex items-center justify-center rounded-full border-2 border-[var(--bg-card)] bg-emerald-400 ${compactClasses.avatarOnline}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <h1 className={`truncate font-bold text-[var(--text-primary)] ${compactClasses.nameSize}`}>{name}</h1>
                  {user?.role && (
                    <span className={`w-fit rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] font-semibold uppercase tracking-wider text-[var(--text-secondary)] ${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[9px]"}`}>
                      {user.role}
                    </span>
                  )}
                </div>
                <p className={`mt-1 truncate text-[var(--text-muted)] ${compactClasses.userEmailSize}`}>{user?.email ?? ""}</p>
                <div className={`mt-3 flex flex-wrap ${compactClasses.pillsGap}`}>
                  {joinDate && <Pill icon="◷" text={`Joined ${joinDate}`} compact={compact} />}
                  <Pill icon="⌁" text={`${totalScans} scan${totalScans !== 1 ? "s" : ""}`} compact={compact} />
                </div>
              </div>

              {/* Settings button */}
              <button
                onClick={() => navigate("/settings")}
                className={`flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] ${compactClasses.settingsButton}`}
              >
                <span className="text-sm">⚙</span>
                Settings
              </button>
            </div>
          </div>

          {/* STATS – 4-column grid matching Dashboard style */}
          <div className={`grid grid-cols-2 ${compactClasses.statsGap} md:grid-cols-4`}>
            <StatCard
              icon="⌁"
              label="Total Scans"
              value={totalScans}
              compact={compact}
              padding={compactClasses.statCardPadding}
              valueSize={compactClasses.statValueSize}
              iconSize={compactClasses.statIconSize}
            />
            <StatCard
              icon="◈"
              label="Average Score"
              value={`${avgScore}%`}
              compact={compact}
              padding={compactClasses.statCardPadding}
              valueSize={compactClasses.statValueSize}
              iconSize={compactClasses.statIconSize}
            />
            <StatCard
              icon="★"
              label="Best Grade"
              value={bestReport?.grade ?? "—"}
              compact={compact}
              padding={compactClasses.statCardPadding}
              valueSize={compactClasses.statValueSize}
              iconSize={compactClasses.statIconSize}
            />
            <StatCard
              icon="✓"
              label="A-Grade Repos"
              value={gradeCounts["A"] ?? 0}
              compact={compact}
              padding={compactClasses.statCardPadding}
              valueSize={compactClasses.statValueSize}
              iconSize={compactClasses.statIconSize}
            />
          </div>

          {/* GRADE BREAKDOWN – matches Dashboard recent reports styling */}
          {totalScans > 0 && (
            <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.gradeBreakdownPadding}`}>
              <div className={`flex items-center justify-between ${compactClasses.gradeBreakdownMargin}`}>
                <div>
                  <h2 className={`font-semibold text-[var(--text-primary)] ${compact ? "text-xs" : "text-sm"}`}>
                    Grade Breakdown
                  </h2>
                  <p className={`mt-1 text-[var(--text-muted)] ${compact ? "text-[9px]" : "text-[10px]"}`}>
                    Distribution of your repository audit grades
                  </p>
                </div>
                <div className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-muted)] ${compact ? "px-2 py-1 text-[9px]" : "px-2.5 py-1.5 text-[9px]"}`}>
                  {totalScans} total
                </div>
              </div>

              <div className={`space-y-3 ${compact ? "space-y-2" : ""}`}>
                {["A", "B", "C", "D", "F"].map((g) => {
                  const count = gradeCounts[g] ?? 0;
                  const pct = totalScans ? Math.round((count / totalScans) * 100) : 0;
                  const style = gradeStyle(g);

                  return (
                    <div key={g} className={`flex items-center gap-3 ${compact ? "gap-2" : ""}`}>
                      <span
                        className={`flex shrink-0 items-center justify-center rounded-lg text-xs font-bold ${style.badge} ${compact ? "h-6 w-6 text-[10px]" : "h-7 w-7"}`}
                      >
                        {g}
                      </span>
                      <div className="flex-1">
                        <div className={`flex justify-between ${compact ? "mb-1" : "mb-1.5"}`}>
                          <span className={`text-[var(--text-muted)] ${compactClasses.gradeLabelSize}`}>Grade {g}</span>
                          <span className={`text-[var(--text-muted)] text-[9px]`}>{pct}%</span>
                        </div>
                        <div className={`overflow-hidden rounded-full bg-[var(--border-dark)] ${compactClasses.gradeBarHeight}`}>
                          <div
                            className={`h-full rounded-full ${style.bar} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className={`w-14 text-right text-[var(--text-muted)] text-[9px]`}>
                        {count} repo{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RECENT ACTIVITY – matches Dashboard recent reports */}
          {reports.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]">
              <div className={`flex items-center justify-between border-b border-[var(--border-dark)] ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
                <div>
                  <h2 className={`font-semibold text-[var(--text-primary)] ${compact ? "text-xs" : "text-sm"}`}>
                    Recent Activity
                  </h2>
                  <p className={`mt-1 text-[var(--text-muted)] ${compact ? "text-[9px]" : "text-[10px]"}`}>
                    Your latest repository audits
                  </p>
                </div>
                <button
                  onClick={() => navigate("/history")}
                  className={`rounded-lg font-medium text-[var(--accent)] transition hover:bg-[var(--accent-soft)] ${compactClasses.viewAllButton}`}
                >
                  View all →
                </button>
              </div>

              <div className={compactClasses.recentActivityPadding}>
                {reports.slice(0, 5).map((r, i) => {
                  const avg = Math.round(
                    ((r.scores?.codeQuality ?? 0) +
                      (r.scores?.security ?? 0) +
                      (r.scores?.performance ?? 0) +
                      (r.scores?.maintainability ?? 0)) /
                      4
                  );
                  const style = gradeStyle((r.grade ?? "N/A")[0]);
                  const repoName = r.repoUrl?.replace("https://github.com/", "") ?? "Unknown";
                  const date = r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "";

                  return (
                    <div
                      key={r._id ?? i}
                      className={`group flex items-center gap-3 rounded-xl transition hover:bg-[var(--bg-primary)] ${compactClasses.recentRowPadding}`}
                    >
                      <span
                        className={`flex shrink-0 items-center justify-center rounded-lg font-bold ${style.badge} ${compact ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]"}`}
                      >
                        {r.grade ?? "N/A"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] ${compactClasses.recentRepoSize}`}>
                          {repoName}
                        </p>
                        <p className={`mt-0.5 text-[var(--text-muted)] text-[9px]`}>Repository audit</p>
                      </div>
                      <span className={`hidden text-[var(--text-muted)] sm:block ${compactClasses.recentDateSize}`}>{date}</span>
                      <span className={`rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] font-medium text-[var(--text-secondary)] ${compactClasses.recentScoreSize}`}>
                        {avg}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {totalScans === 0 && !loading && (
            <div className={`relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] text-center ${compactClasses.emptyStatePadding}`}>
              <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-3xl" />
              <div className="relative">
                <div className={`mx-auto mb-5 flex items-center justify-center rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] ${compact ? "h-12 w-12" : "h-14 w-14"}`}>
                  <span className={`${compact ? "text-lg" : "text-xl"}`}>◈</span>
                </div>
                <p className={`font-semibold text-[var(--text-secondary)] ${compactClasses.emptyStateTitle}`}>No scans yet</p>
                <p className={`mx-auto mt-1.5 max-w-sm leading-5 text-[var(--text-muted)] ${compactClasses.emptyStateDesc}`}>
                  Analyze a GitHub repository to start building your CodeVerity profile and see your audit
                  statistics here.
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className={`mt-5 rounded-lg bg-[var(--accent)] font-semibold text-[var(--accent-contrast,#ffffff)] shadow-lg shadow-[var(--accent-soft-strong)] transition hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-95 ${compact ? "px-4 py-2 text-[10px]" : "px-5 py-2.5 text-xs"}`}
                >
                  Start analyzing →
                </button>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className={`flex items-center justify-center gap-2 py-3 text-[var(--text-muted)] ${compactClasses.footerText} ${compactClasses.footerMargin}`}>
            <span>CodeVerity</span>
            <span>•</span>
            <span>AI Repository Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PILL – flat indigo accent
========================================================= */

function Pill({ icon, text, compact }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-muted)] ${compact ? "px-2 py-1 text-[9px]" : "px-2.5 py-1.5 text-[9px]"}`}>
      <span className="text-[var(--accent)]">{icon}</span>
      {text}
    </span>
  );
}

/* =========================================================
   STAT CARD – matches Dashboard StatCard style
========================================================= */

function StatCard({ icon, label, value, compact, padding, valueSize, iconSize }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-[var(--accent)]/20 bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 ${padding}`}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[var(--accent-soft)] blur-2xl" />
      <div className="relative">
        <div className={`mb-3 flex items-center justify-center rounded-lg text-sm bg-[var(--accent-soft)] text-[var(--accent)] ${iconSize}`}>
          {icon}
        </div>
        <p className={`font-bold tabular-nums text-[var(--text-primary)] ${valueSize}`}>{value}</p>
        <p className={`mt-0.5 text-[var(--text-muted)] ${compact ? "text-[9px]" : "text-[9px]"}`}>{label}</p>
      </div>
    </div>
  );
}

/* =========================================================
   GRADE STYLE – semantic status colors (unchanged)
========================================================= */

function gradeStyle(letter) {
  const map = {
    A: {
      badge: "bg-emerald-500/10 text-emerald-400",
      text: "text-emerald-400",
      bar: "bg-emerald-500",
    },
    B: {
      badge: "bg-blue-500/10 text-blue-400",
      text: "text-blue-400",
      bar: "bg-blue-500",
    },
    C: {
      badge: "bg-yellow-500/10 text-yellow-400",
      text: "text-yellow-400",
      bar: "bg-yellow-500",
    },
    D: {
      badge: "bg-orange-500/10 text-orange-400",
      text: "text-orange-400",
      bar: "bg-orange-500",
    },
    F: {
      badge: "bg-red-500/10 text-red-400",
      text: "text-red-400",
      bar: "bg-red-500",
    },
  };
  return (
    map[letter] ?? {
      badge: "bg-gray-500/10 text-gray-400",
      text: "text-gray-400",
      bar: "bg-gray-500",
    }
  );
}

/* =========================================================
   LOADING SCREEN
========================================================= */

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-4">
        <CodeVerityLogo />
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
        <p className="font-mono text-[10px] text-[var(--text-muted)]">Loading CodeVerity profile…</p>
      </div>
    </div>
  );
}