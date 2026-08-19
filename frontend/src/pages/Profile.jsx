// frontend/src/pages/Profile.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import axios from "../api/axios";
import { usePreferences } from "../context/PreferencesContext";

/* =========================================================
   CODEVERITY LOGO – shield design (matches other pages)
========================================================= */

function CodeVerityLogo() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 shadow-lg shadow-green-500/20">
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
        className="relative text-green-400"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md bg-[#161b22] border border-[#30363d]">
        <span className="text-[6px] font-bold text-green-400">&lt;/&gt;</span>
      </div>
      <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
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
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4 text-text-[var(--text-primary)] pt-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
          <span className="text-xl">!</span>
        </div>
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={load}
          className="rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2 text-xs font-medium text-[#8b949e] transition hover:border-[#484f58] hover:text-text-[var(--text-primary)]"
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

  // Compact overrides
  const compactClasses = compact
    ? {
        container: "pt-14 px-3 py-4 sm:px-4",
        headerMargin: "mb-3",
        heading: "text-xl",
        subHeading: "text-[10px]",
        heroPadding: "p-4 sm:p-4",
        heroGap: "gap-3",
        avatarSize: "h-16 w-16 text-xl",
        avatarOnline: "h-4 w-4",
        nameSize: "text-lg",
        roleSize: "text-[7px]",
        userEmailSize: "text-[10px]",
        pillsGap: "gap-1.5",
        pillPadding: "px-2 py-1 text-[8px]",
        statsGap: "gap-2",
        statCardPadding: "p-3",
        statValueSize: "text-lg",
        statIconSize: "h-6 w-6 text-xs",
        gradeBreakdownPadding: "p-4",
        gradeBreakdownMargin: "mb-3",
        gradeLabelSize: "text-[9px]",
        gradeBarHeight: "h-1",
        recentActivityPadding: "p-1.5",
        recentRowPadding: "px-2 py-2",
        recentRepoSize: "text-[10px]",
        recentDateSize: "text-[8px]",
        recentScoreSize: "text-[8px] px-1.5 py-0.5",
        emptyStatePadding: "py-10 px-4",
        emptyStateTitle: "text-sm",
        emptyStateDesc: "text-[10px]",
        footerMargin: "mt-4",
        footerText: "text-[7px]",
        viewAllButton: "text-[9px] px-2 py-1",
        settingsButton: "px-3 py-2 text-[10px]",
      }
    : {
        container: "pt-16 px-4 py-6 sm:px-6 lg:px-8",
        headerMargin: "mb-5",
        heading: "text-2xl",
        subHeading: "text-xs",
        heroPadding: "p-5 sm:p-6",
        heroGap: "gap-5",
        avatarSize: "h-20 w-20 text-2xl",
        avatarOnline: "h-5 w-5",
        nameSize: "text-xl",
        roleSize: "text-[8px]",
        userEmailSize: "text-xs",
        pillsGap: "gap-2",
        pillPadding: "px-2.5 py-1.5 text-[9px]",
        statsGap: "gap-3",
        statCardPadding: "p-4",
        statValueSize: "text-xl",
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
    <div className={`min-h-screen bg-[var(--bg-primary)] text-text-[var(--text-primary)] ${compactClasses.container}`}>
      <div className={`mx-auto w-full max-w-7xl space-y-5 ${compact ? "space-y-4" : "space-y-5"}`}>
        {/* PAGE HEADER */}
        <div className={compactClasses.headerMargin}>
          <h1 className={`font-bold tracking-tight text-text-[var(--text-primary)] ${compactClasses.heading}`}>
            Profile
          </h1>
          <p className={`text-[#6e7681] ${compactClasses.subHeading}`}>Manage your CodeVerity account and audit history.</p>
        </div>

        {/* HERO */}
        <div className="relative overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className={`relative flex flex-col ${compactClasses.heroGap} ${compactClasses.heroPadding} sm:flex-row sm:items-center`}>
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 font-bold shadow-lg shadow-green-500/20 text-white ${compactClasses.avatarSize}`}>
                {initials}
              </div>
              <div className={`absolute -bottom-1.5 -right-1.5 flex items-center justify-center rounded-full border-2 border-[#161b22] bg-[#3fb950] ${compactClasses.avatarOnline}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
            </div>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <h1 className={`truncate font-bold text-text-[var(--text-primary)] ${compactClasses.nameSize}`}>{name}</h1>
                {user?.role && (
                  <span className={`w-fit rounded-md border border-[#30363d] bg-[var(--bg-primary)] font-semibold uppercase tracking-wider text-[#8b949e] ${compact ? "px-1.5 py-0.5 text-[7px]" : "px-2 py-1 text-[8px]"}`}>
                    {user.role}
                  </span>
                )}
              </div>
              <p className={`mt-1 truncate text-[#6e7681] ${compactClasses.userEmailSize}`}>{user?.email ?? ""}</p>
              <div className={`mt-3 flex flex-wrap ${compactClasses.pillsGap}`}>
                {joinDate && <Pill icon="◷" text={`Joined ${joinDate}`} compact={compact} />}
                <Pill icon="⌁" text={`${totalScans} scan${totalScans !== 1 ? "s" : ""}`} compact={compact} />
              </div>
            </div>

            {/* Settings button */}
            <button
              onClick={() => navigate("/settings")}
              className={`flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#30363d] bg-[var(--bg-primary)] font-medium text-[#8b949e] transition hover:border-green-500/40 hover:bg-[#161b22] hover:text-text-[var(--text-primary)] ${compactClasses.settingsButton}`}
            >
              <span className="text-sm">⚙</span>
              Settings
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className={`grid grid-cols-2 ${compactClasses.statsGap} md:grid-cols-4`}>
          <StatCard
            icon="⌁"
            label="Total Scans"
            value={totalScans}
            color="green"
            compact={compact}
            padding={compactClasses.statCardPadding}
            valueSize={compactClasses.statValueSize}
            iconSize={compactClasses.statIconSize}
          />
          <StatCard
            icon="◈"
            label="Average Score"
            value={`${avgScore}%`}
            color="emerald"
            compact={compact}
            padding={compactClasses.statCardPadding}
            valueSize={compactClasses.statValueSize}
            iconSize={compactClasses.statIconSize}
          />
          <StatCard
            icon="★"
            label="Best Grade"
            value={bestReport?.grade ?? "—"}
            color="teal"
            compact={compact}
            padding={compactClasses.statCardPadding}
            valueSize={compactClasses.statValueSize}
            iconSize={compactClasses.statIconSize}
          />
          <StatCard
            icon="✓"
            label="A-Grade Repos"
            value={gradeCounts["A"] ?? 0}
            color="green"
            compact={compact}
            padding={compactClasses.statCardPadding}
            valueSize={compactClasses.statValueSize}
            iconSize={compactClasses.statIconSize}
          />
        </div>

        {/* GRADE BREAKDOWN */}
        {totalScans > 0 && (
          <div className={`rounded-2xl border border-[#30363d] bg-[#161b22] ${compactClasses.gradeBreakdownPadding}`}>
            <div className={`flex items-center justify-between ${compactClasses.gradeBreakdownMargin}`}>
              <div>
                <h2 className={`font-semibold text-text-[var(--text-primary)] ${compact ? "text-xs" : "text-sm"}`}>Grade Breakdown</h2>
                <p className={`mt-1 text-[#484f58] ${compact ? "text-[8px]" : "text-[10px]"}`}>
                  Distribution of your repository audit grades
                </p>
              </div>
              <div className={`rounded-lg border border-[#30363d] bg-[var(--bg-primary)] text-[#6e7681] ${compact ? "px-2 py-1 text-[8px]" : "px-2.5 py-1.5 text-[9px]"}`}>
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
                        <span className={`text-[#6e7681] ${compactClasses.gradeLabelSize}`}>Grade {g}</span>
                        <span className={`text-[#484f58] ${compact ? "text-[8px]" : "text-[9px]"}`}>{pct}%</span>
                      </div>
                      <div className={`overflow-hidden rounded-full bg-[#21262d] ${compactClasses.gradeBarHeight}`}>
                        <div
                          className={`h-full rounded-full ${style.bar} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className={`w-14 text-right text-[#484f58] ${compact ? "text-[8px]" : "text-[9px]"}`}>
                      {count} repo{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RECENT ACTIVITY */}
        {reports.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22]">
            <div className={`flex items-center justify-between border-b border-[#21262d] ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
              <div>
                <h2 className={`font-semibold text-text-[var(--text-primary)] ${compact ? "text-xs" : "text-sm"}`}>Recent Activity</h2>
                <p className={`mt-1 text-[#484f58] ${compact ? "text-[8px]" : "text-[10px]"}`}>Your latest repository audits</p>
              </div>
              <button
                onClick={() => navigate("/history")}
                className={`rounded-lg font-medium text-[#3fb950] transition hover:bg-green-500/10 ${compactClasses.viewAllButton}`}
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
                      <p className={`truncate font-medium text-[#c9d1d9] group-hover:text-text-[var(--text-primary)] ${compactClasses.recentRepoSize}`}>
                        {repoName}
                      </p>
                      <p className={`mt-0.5 text-[#484f58] ${compact ? "text-[7px]" : "text-[8px]"}`}>Repository audit</p>
                    </div>
                    <span className={`hidden text-[#484f58] sm:block ${compactClasses.recentDateSize}`}>{date}</span>
                    <span className={`rounded-md border border-[#30363d] bg-[var(--bg-primary)] font-medium text-[#8b949e] ${compactClasses.recentScoreSize}`}>
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
          <div className={`relative overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22] text-center ${compactClasses.emptyStatePadding}`}>
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl" />
            <div className="relative">
              <div className={`mx-auto mb-5 flex items-center justify-center rounded-xl border border-[#30363d] bg-[var(--bg-primary)] ${compact ? "h-12 w-12" : "h-14 w-14"}`}>
                <span className={`${compact ? "text-lg" : "text-xl"}`}>◈</span>
              </div>
              <p className={`font-semibold text-[#c9d1d9] ${compactClasses.emptyStateTitle}`}>No scans yet</p>
              <p className={`mx-auto mt-1.5 max-w-sm leading-5 text-[#6e7681] ${compactClasses.emptyStateDesc}`}>
                Analyze a GitHub repository to start building your CodeVerity profile and see your audit
                statistics here.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className={`mt-5 rounded-lg bg-gradient-to-r from-[#238636] to-[#2ea043] font-semibold text-white shadow-lg shadow-green-500/20 transition hover:scale-[1.02] hover:shadow-green-500/30 active:scale-95 ${compact ? "px-4 py-2 text-[10px]" : "px-5 py-2.5 text-xs"}`}
              >
                Start analyzing →
              </button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className={`flex items-center justify-center gap-2 py-3 text-[#30363d] ${compactClasses.footerText} ${compactClasses.footerMargin}`}>
          <span>CodeVerity</span>
          <span>•</span>
          <span>AI Repository Intelligence</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PILL – green accent, now accepts compact
========================================================= */

function Pill({ icon, text, compact }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[var(--bg-primary)] text-[#6e7681] ${compact ? "px-2 py-1 text-[8px]" : "px-2.5 py-1.5 text-[9px]"}`}>
      <span className="text-[#3fb950]">{icon}</span>
      {text}
    </span>
  );
}

/* =========================================================
   STAT CARD – green/emerald/teal options, now accepts compact
========================================================= */

function StatCard({ icon, label, value, color, compact, padding, valueSize, iconSize }) {
  const colors = {
    green: {
      border: "border-green-500/20",
      icon: "bg-green-500/10 text-[#3fb950]",
      glow: "bg-green-500/5",
    },
    emerald: {
      border: "border-emerald-500/20",
      icon: "bg-emerald-500/10 text-[#10b981]",
      glow: "bg-emerald-500/5",
    },
    teal: {
      border: "border-teal-500/20",
      icon: "bg-teal-500/10 text-[#2dd4bf]",
      glow: "bg-teal-500/5",
    },
  };

  const style = colors[color] ?? colors.green;

  return (
    <div className={`relative overflow-hidden rounded-xl border ${style.border} bg-[#161b22] ${padding}`}>
      <div className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl ${style.glow}`} />
      <div className="relative">
        <div className={`mb-3 flex items-center justify-center rounded-lg text-sm ${style.icon} ${iconSize}`}>
          {icon}
        </div>
        <p className={`font-bold text-text-[var(--text-primary)] ${valueSize}`}>{value}</p>
        <p className={`mt-0.5 text-[#484f58] ${compact ? "text-[8px]" : "text-[9px]"}`}>{label}</p>
      </div>
    </div>
  );
}

/* =========================================================
   GRADE STYLE – unchanged
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
   LOADING SCREEN – updated logo and spinner
========================================================= */

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] pt-16">
      <div className="flex flex-col items-center gap-4">
        <CodeVerityLogo />
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#30363d] border-t-[#3fb950]" />
        <p className="text-[10px] text-[#484f58]">Loading CodeVerity profile…</p>
      </div>
    </div>
  );
}