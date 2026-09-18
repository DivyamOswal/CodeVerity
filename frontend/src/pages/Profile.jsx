// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Activity,
  LayoutGrid,
  Star,
  CheckCircle2,
  Calendar,
  Settings as SettingsIcon,
  ArrowRight,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { useAuth } from "../App";
import axios from "../api/axios";
import { usePreferences } from "../context/PreferencesContext";
import { useToast } from "../hooks/useToast";

/* =========================================================
   CODEVERITY LOGO — uses ShieldCheck from Lucide, matching
   Navbar / Home / AuthLayout.
========================================================= */
function CodeVerityLogo() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] shadow-lg shadow-[var(--accent-soft-strong)]">
      <div className="absolute inset-[1px] rounded-[11px] bg-[var(--bg-primary)]" />
      <ShieldCheck
        size={18}
        strokeWidth={2}
        aria-hidden="true"
        className="relative text-[var(--accent)]"
      />
      <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--bg-secondary)]">
        <span className="text-[6px] font-bold text-[var(--accent)]">
          &lt;/&gt;
        </span>
      </div>
      <span className="absolute -top-0.5 -left-0.5 h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
    </div>
  );
}

/* =========================================================
   SECTION KICKER
========================================================= */
function SectionKicker({ Icon, title, subtitle, compact, right }) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-2 ${
        compact ? "mb-3" : "mb-5"
      }`}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && (
          <span
            className={`mt-0.5 flex shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] ${
              compact ? "h-6 w-6" : "h-7 w-7"
            }`}
          >
            <Icon size={compact ? 12 : 14} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2
            className={`font-semibold leading-tight text-[var(--text-primary)] ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`mt-0.5 text-[var(--text-muted)] ${
                compact ? "text-[10px]" : "text-[11px]"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

/* =========================================================
   PROFILE
========================================================= */
export default function Profile() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { compact } = usePreferences();
  const { error: toastError } = useToast();

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
      .catch((err) => {
        console.error("Failed to load user profile", err);
        toastError("Failed to load user profile.");
        setError("Failed to load your profile.");
      });

    const reportsPromise = axios
      .get("/report")
      .then((res) => {
        setReports(res.data.reports ?? []);
      })
      .catch((err) => {
        console.error("Failed to load report history", err);
        toastError("Failed to load report history.");
        setReports([]);
      });

    Promise.all([mePromise, reportsPromise]).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading && !user) {
    return <ProfileSkeleton compact={compact} />;
  }

  /* ─── ERROR ─── */
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-primary)] px-4 text-[var(--text-primary)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
          <AlertCircle size={24} strokeWidth={2} aria-hidden="true" />
        </div>
        <p className="max-w-sm text-center text-sm text-[var(--color-danger)]">
          {error}
        </p>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.98]"
        >
          <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" />
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

  const compactClasses = compact
    ? {
        topPadding: "pt-20",
        container: "px-3 py-4 sm:px-4",
        headerMargin: "mb-3",
        heading: "text-lg sm:text-xl",
        subHeading: "text-[11px]",
        heroPadding: "p-4 sm:p-4",
        heroGap: "gap-3",
        avatarSize: "h-16 w-16 text-xl",
        nameSize: "text-lg",
        userEmailSize: "text-[11px]",
        pillsGap: "gap-1.5",
        statsGap: "gap-2",
        statCardPadding: "p-3",
        statValueSize: "text-xl",
        statIconSize: "h-6 w-6",
        gradeBreakdownPadding: "p-4",
        gradeLabelSize: "text-[10px]",
        gradeBarHeight: "h-1",
        recentActivityPadding: "p-1.5",
        recentRowPadding: "px-2 py-2",
        recentRepoSize: "text-[11px]",
        recentDateSize: "text-[10px]",
        recentScoreSize: "text-[10px] px-1.5 py-0.5",
        emptyStatePadding: "py-10 px-4",
        emptyStateTitle: "text-sm",
        emptyStateDesc: "text-[11px]",
        footerMargin: "mt-4",
        footerText: "text-[10px]",
        viewAllButton: "text-[10px] px-2 py-1",
        settingsButton: "px-3 py-2 text-[11px]",
      }
    : {
        topPadding: "pt-24",
        container: "px-4 py-6 sm:px-6 lg:px-8",
        headerMargin: "mb-5",
        heading: "text-xl sm:text-2xl",
        subHeading: "text-xs",
        heroPadding: "p-5 sm:p-6",
        heroGap: "gap-5",
        avatarSize: "h-20 w-20 text-2xl",
        nameSize: "text-xl",
        userEmailSize: "text-xs",
        pillsGap: "gap-2",
        statsGap: "gap-3",
        statCardPadding: "p-4",
        statValueSize: "text-2xl",
        statIconSize: "h-8 w-8",
        gradeBreakdownPadding: "p-5",
        gradeLabelSize: "text-[11px]",
        gradeBarHeight: "h-1.5",
        recentActivityPadding: "p-2",
        recentRowPadding: "px-3 py-3",
        recentRepoSize: "text-xs",
        recentDateSize: "text-[10px]",
        recentScoreSize: "text-[10px] px-2 py-1",
        emptyStatePadding: "py-16 px-6",
        emptyStateTitle: "text-base",
        emptyStateDesc: "text-xs",
        footerMargin: "mt-6",
        footerText: "text-[10px]",
        viewAllButton: "text-[11px] px-2.5 py-1.5",
        settingsButton: "px-4 py-2.5 text-xs",
      };

  return (
    <div
      className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${compactClasses.topPadding}`}
    >
      <div className={`mx-auto w-full max-w-7xl ${compactClasses.container}`}>
        <div className={compact ? "space-y-4" : "space-y-5"}>
          {/* PAGE HEADER */}
          <div className={compactClasses.headerMargin}>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-success)]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Account
              </span>
            </div>
            <h1
              className={`mt-1 font-bold tracking-tight text-[var(--text-primary)] ${compactClasses.heading}`}
            >
              Profile
            </h1>
            <p className={`text-[var(--text-muted)] ${compactClasses.subHeading}`}>
              Manage your CodeVerity account and audit history.
            </p>
          </div>

          {/* HERO */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[var(--shadow-md)]">
            <span className="absolute inset-x-0 top-0 h-[2px] bg-[var(--accent)]" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-3xl" />

            <div
              className={`relative flex flex-col ${compactClasses.heroGap} ${compactClasses.heroPadding} sm:flex-row sm:items-center`}
            >
              {/* Avatar */}
              <div className="relative shrink-0 self-start sm:self-auto">
                <div
                  className={`flex items-center justify-center rounded-2xl bg-[var(--accent)] font-bold text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent-soft-strong)] ring-1 ring-[var(--accent-contrast)]/10 ${compactClasses.avatarSize}`}
                >
                  {initials}
                </div>
              </div>

              {/* User Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <h1
                    className={`truncate font-bold text-[var(--text-primary)] ${compactClasses.nameSize}`}
                  >
                    {name}
                  </h1>
                  {user?.role && (
                    <span
                      className={`w-fit rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] font-semibold uppercase tracking-wider text-[var(--text-secondary)] ${
                        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[9px]"
                      }`}
                    >
                      {user.role}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1 truncate text-[var(--text-muted)] ${compactClasses.userEmailSize}`}
                >
                  {user?.email ?? ""}
                </p>
                <div className={`mt-3 flex flex-wrap ${compactClasses.pillsGap}`}>
                  {joinDate && (
                    <Pill
                      Icon={Calendar}
                      text={`Joined ${joinDate}`}
                      compact={compact}
                    />
                  )}
                  <Pill
                    Icon={Activity}
                    text={`${totalScans} scan${totalScans !== 1 ? "s" : ""}`}
                    compact={compact}
                  />
                </div>
              </div>

              {/* Settings button */}
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className={`flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.98] sm:w-auto ${compactClasses.settingsButton}`}
              >
                <SettingsIcon size={13} strokeWidth={2} aria-hidden="true" />
                Settings
              </button>
            </div>
          </div>

          {/* STATS */}
          <div
            className={`grid grid-cols-2 ${compactClasses.statsGap} md:grid-cols-4`}
          >
            <StatCard
              Icon={Activity}
              label="Total Scans"
              value={totalScans}
              compact={compact}
              padding={compactClasses.statCardPadding}
              valueSize={compactClasses.statValueSize}
              iconSize={compactClasses.statIconSize}
            />
            <StatCard
              Icon={LayoutGrid}
              label="Average Score"
              value={`${avgScore}%`}
              compact={compact}
              padding={compactClasses.statCardPadding}
              valueSize={compactClasses.statValueSize}
              iconSize={compactClasses.statIconSize}
            />
            <StatCard
              Icon={Star}
              label="Best Grade"
              value={bestReport?.grade ?? "—"}
              compact={compact}
              padding={compactClasses.statCardPadding}
              valueSize={compactClasses.statValueSize}
              iconSize={compactClasses.statIconSize}
            />
            <StatCard
              Icon={CheckCircle2}
              label="A-Grade Repos"
              value={gradeCounts["A"] ?? 0}
              compact={compact}
              padding={compactClasses.statCardPadding}
              valueSize={compactClasses.statValueSize}
              iconSize={compactClasses.statIconSize}
            />
          </div>

          {/* GRADE BREAKDOWN */}
          {totalScans > 0 && (
            <div
              className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.gradeBreakdownPadding}`}
            >
              <SectionKicker
                Icon={LayoutGrid}
                title="Grade Breakdown"
                subtitle="Distribution of your repository audit grades"
                compact={compact}
                right={
                  <div
                    className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-muted)] ${
                      compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[10px]"
                    }`}
                  >
                    {totalScans} total
                  </div>
                }
              />

              <div className={compact ? "space-y-2" : "space-y-3"}>
                {["A", "B", "C", "D", "F"].map((g) => {
                  const count = gradeCounts[g] ?? 0;
                  const pct = totalScans
                    ? Math.round((count / totalScans) * 100)
                    : 0;
                  const style = gradeStyle(g);

                  return (
                    <div
                      key={g}
                      className={`flex items-center gap-2 sm:gap-3 ${
                        compact ? "gap-2" : ""
                      }`}
                    >
                      <span
                        className={`flex shrink-0 items-center justify-center rounded-lg text-xs font-bold ${style.badge} ${
                          compact ? "h-6 w-6 text-[10px]" : "h-7 w-7"
                        }`}
                      >
                        {g}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`flex justify-between gap-2 ${
                            compact ? "mb-1" : "mb-1.5"
                          }`}
                        >
                          <span
                            className={`text-[var(--text-muted)] ${compactClasses.gradeLabelSize}`}
                          >
                            Grade {g}
                          </span>
                          <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                            {pct}%
                          </span>
                        </div>
                        <div
                          className={`overflow-hidden rounded-full bg-[var(--border-dark)] ${compactClasses.gradeBarHeight}`}
                        >
                          <div
                            className={`h-full rounded-full ${style.bar} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-12 shrink-0 text-right text-[10px] text-[var(--text-muted)] sm:w-14">
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
            <div className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]">
              <div
                className={`border-b border-[var(--border-dark)] ${
                  compact ? "px-4 py-3" : "px-5 py-4"
                }`}
              >
                <SectionKicker
                  Icon={Activity}
                  title="Recent Activity"
                  subtitle="Your latest repository audits"
                  compact={compact}
                  right={
                    <button
                      type="button"
                      onClick={() => navigate("/history")}
                      className={`inline-flex items-center gap-1 rounded-lg font-medium text-[var(--accent)] transition-colors duration-200 hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 ${compactClasses.viewAllButton}`}
                    >
                      View all
                      <ArrowRight size={11} strokeWidth={2.2} aria-hidden="true" />
                    </button>
                  }
                />
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
                  const repoName =
                    r.repoUrl?.replace("https://github.com/", "") ?? "Unknown";
                  const date = r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "";

                  return (
                    <div
                      key={r._id ?? i}
                      className={`group flex items-center gap-2 rounded-xl transition-colors duration-150 hover:bg-[var(--bg-primary)] sm:gap-3 ${compactClasses.recentRowPadding}`}
                    >
                      <span
                        className={`flex shrink-0 items-center justify-center rounded-lg font-bold ${style.badge} ${
                          compact ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]"
                        }`}
                      >
                        {r.grade ?? "N/A"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] ${compactClasses.recentRepoSize}`}
                        >
                          {repoName}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                          Repository audit
                        </p>
                      </div>
                      <span
                        className={`hidden shrink-0 text-[var(--text-muted)] sm:block ${compactClasses.recentDateSize}`}
                      >
                        {date}
                      </span>
                      <span
                        className={`shrink-0 rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] font-medium text-[var(--text-secondary)] ${compactClasses.recentScoreSize}`}
                      >
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
            <div
              className={`relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] text-center ${compactClasses.emptyStatePadding}`}
            >
              <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-3xl" />
              <div className="relative">
                <div
                  className={`mx-auto mb-5 flex items-center justify-center rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--accent)] ${
                    compact ? "h-12 w-12" : "h-14 w-14"
                  }`}
                >
                  <LayoutGrid
                    size={compact ? 20 : 24}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                </div>
                <p
                  className={`font-semibold text-[var(--text-secondary)] ${compactClasses.emptyStateTitle}`}
                >
                  No scans yet
                </p>
                <p
                  className={`mx-auto mt-1.5 max-w-sm leading-5 text-[var(--text-muted)] ${compactClasses.emptyStateDesc}`}
                >
                  Analyze a GitHub repository to start building your CodeVerity
                  profile and see your audit statistics here.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className={`mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] font-semibold text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent-soft-strong)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-95 ${
                    compact ? "px-4 py-2 text-[11px]" : "px-5 py-2.5 text-xs"
                  }`}
                >
                  Start analyzing
                  <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div
            className={`flex items-center justify-center gap-2 py-3 text-[var(--text-muted)] ${compactClasses.footerText} ${compactClasses.footerMargin}`}
          >
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
   PILL
========================================================= */
function Pill({ Icon, text, compact }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-muted)] ${
        compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[10px]"
      }`}
    >
      {Icon && (
        <Icon size={11} strokeWidth={2} aria-hidden="true" className="text-[var(--accent)]" />
      )}
      {text}
    </span>
  );
}

/* =========================================================
   STAT CARD
========================================================= */
function StatCard({ Icon, label, value, compact, padding, valueSize, iconSize }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[var(--accent)]/20 bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-md)] ${padding}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40"
      />
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[var(--accent-soft)] blur-2xl" />
      <div className="relative">
        <div
          className={`mb-2 flex items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] sm:mb-3 ${iconSize}`}
        >
          {Icon && <Icon size={compact ? 14 : 16} strokeWidth={2} aria-hidden="true" />}
        </div>
        <p
          className={`font-bold tabular-nums text-[var(--text-primary)] ${valueSize}`}
        >
          {value}
        </p>
        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{label}</p>
      </div>
    </div>
  );
}

/* =========================================================
   GRADE STYLE
========================================================= */
function gradeStyle(letter) {
  const map = {
    A: {
      badge: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
      bar: "bg-[var(--color-success)]",
    },
    B: {
      badge: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
      bar: "bg-[var(--color-info)]",
    },
    C: {
      badge: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
      bar: "bg-[var(--color-warning)]",
    },
    D: {
      badge: "bg-[var(--color-caution-soft)] text-[var(--color-caution)]",
      bar: "bg-[var(--color-caution)]",
    },
    F: {
      badge: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
      bar: "bg-[var(--color-danger)]",
    },
  };
  return (
    map[letter] ?? {
      badge: "bg-[var(--bg-hover)] text-[var(--text-muted)]",
      bar: "bg-[var(--text-muted)]",
    }
  );
}

/* =========================================================
   SKELETON
========================================================= */
function ProfileSkeleton({ compact }) {
  const container = compact
    ? "px-3 py-4 sm:px-4"
    : "px-4 py-6 sm:px-6 lg:px-8";
  const topPadding = compact ? "pt-20" : "pt-24";
  const statsGap = compact ? "gap-2" : "gap-3";

  return (
    <div
      className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${topPadding}`}
    >
      <div className={`mx-auto w-full max-w-7xl ${container}`}>
        <div className="animate-pulse space-y-5">
          <div className="space-y-2">
            <div className="h-2 w-16 rounded bg-[var(--bg-hover)]" />
            <div className="h-6 w-32 rounded bg-[var(--bg-hover)]" />
            <div className="h-2.5 w-64 max-w-full rounded bg-[var(--bg-hover)]" />
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-[var(--bg-hover)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-[var(--bg-hover)]" />
              <div className="h-2.5 w-56 max-w-full rounded bg-[var(--bg-hover)]" />
              <div className="flex gap-2">
                <div className="h-5 w-24 rounded-md bg-[var(--bg-hover)]" />
                <div className="h-5 w-20 rounded-md bg-[var(--bg-hover)]" />
              </div>
            </div>
            <div className="h-9 w-full shrink-0 rounded-lg bg-[var(--bg-hover)] sm:w-28" />
          </div>

          <div className={`grid grid-cols-2 ${statsGap} md:grid-cols-4`}>
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4"
              >
                <div className="h-8 w-8 rounded-lg bg-[var(--bg-hover)]" />
                <div className="mt-3 h-6 w-12 rounded bg-[var(--bg-hover)]" />
                <div className="mt-1.5 h-2 w-20 rounded bg-[var(--bg-hover)]" />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5">
            <div className="mb-4 h-3 w-32 rounded bg-[var(--bg-hover)]" />
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-7 w-7 shrink-0 rounded-lg bg-[var(--bg-hover)]" />
                  <div className="h-1.5 flex-1 rounded-full bg-[var(--bg-hover)]" />
                  <div className="h-2 w-10 shrink-0 rounded bg-[var(--bg-hover)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}