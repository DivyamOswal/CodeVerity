// frontend/src/pages/Profile.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import axios from "../api/axios";

/* =========================================================
   CODEVERITY LOGO
========================================================= */

function CodeVerityLogo() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/10">
      <div className="absolute inset-[1px] rounded-[11px] bg-[#0d1117]" />

      <div className="relative text-[9px] font-black tracking-tight text-white">
        <span className="text-blue-400">&lt;</span>
        CV
        <span className="text-purple-400">/&gt;</span>
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE
========================================================= */

export default function Profile() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

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

    /* =====================================================
       JWT FALLBACK
    ===================================================== */

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

    /* =====================================================
       LOAD USER
    ===================================================== */

    const mePromise = axios
      .get("/auth/me")
      .then((res) => {
        const u = res.data.user ?? res.data;
        setUser(u);
      })
      .catch(() => {
        // JWT fallback already loaded
      });

    /* =====================================================
       LOAD REPORTS
    ===================================================== */

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

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading && !user) {
    return <LoadingScreen />;
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4 text-[#f0f6fc]">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
          <span className="text-xl">!</span>
        </div>

        <p className="text-sm text-red-400">
          {error}
        </p>

        <button
          onClick={load}
          className="rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2 text-xs font-medium text-[#8b949e] transition hover:border-[#484f58] hover:text-[#f0f6fc]"
        >
          Retry
        </button>
      </div>
    );
  }

  /* =========================================================
     CALCULATIONS
  ========================================================= */

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

  const name =
    user?.name ||
    user?.email ||
    "User";

  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        }
      )
    : null;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#0d1117] px-4 py-6 text-[#f0f6fc] sm:px-6 lg:px-8">

      <div className="mx-auto w-full max-w-7xl space-y-5">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <CodeVerityLogo />

            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#f0f6fc]">
                CODEVERITY
              </p>

              <p className="text-[9px] text-[#484f58]">
                AI Repository Intelligence
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-lg border border-[#30363d] bg-[#161b22] px-3.5 py-2 text-xs font-medium text-[#8b949e] transition hover:border-[#484f58] hover:text-[#f0f6fc]"
            >
              Dashboard
            </button>

            <button
              onClick={() => navigate("/history")}
              className="rounded-lg border border-[#30363d] bg-[#161b22] px-3.5 py-2 text-xs font-medium text-[#8b949e] transition hover:border-[#484f58] hover:text-[#f0f6fc]"
            >
              History
            </button>

          </div>

        </div>

        {/* =====================================================
            HERO
        ===================================================== */}

        <div className="relative overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22]">

          {/* Background glow */}

          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">

            {/* Avatar */}

            <div className="relative shrink-0">

              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-2xl font-bold shadow-lg shadow-blue-500/10">
                {initials}
              </div>

              <div className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#161b22] bg-[#3fb950]">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>

            </div>

            {/* User Info */}

            <div className="min-w-0 flex-1">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                <h1 className="truncate text-xl font-bold text-[#f0f6fc]">
                  {name}
                </h1>

                {user?.role && (
                  <span className="w-fit rounded-md border border-[#30363d] bg-[#0d1117] px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-[#8b949e]">
                    {user.role}
                  </span>
                )}

              </div>

              <p className="mt-1 truncate text-xs text-[#6e7681]">
                {user?.email ?? ""}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">

                {joinDate && (
                  <Pill
                    icon="◷"
                    text={`Joined ${joinDate}`}
                  />
                )}

                <Pill
                  icon="⌁"
                  text={`${totalScans} scan${
                    totalScans !== 1 ? "s" : ""
                  }`}
                />

              </div>

            </div>

            {/* Settings */}

            <button
              onClick={() => navigate("/settings")}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-2.5 text-xs font-medium text-[#8b949e] transition hover:border-[#58a6ff]/40 hover:bg-[#161b22] hover:text-[#f0f6fc]"
            >
              <span className="text-sm">
                ⚙
              </span>

              Settings
            </button>

          </div>

        </div>

        {/* =====================================================
            STATS
        ===================================================== */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

          <StatCard
            icon="⌁"
            label="Total Scans"
            value={totalScans}
            color="blue"
          />

          <StatCard
            icon="◈"
            label="Average Score"
            value={`${avgScore}%`}
            color="purple"
          />

          <StatCard
            icon="★"
            label="Best Grade"
            value={bestReport?.grade ?? "—"}
            color="cyan"
          />

          <StatCard
            icon="✓"
            label="A-Grade Repos"
            value={gradeCounts["A"] ?? 0}
            color="green"
          />

        </div>

        {/* =====================================================
            GRADE BREAKDOWN
        ===================================================== */}

        {totalScans > 0 && (
          <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-sm font-semibold text-[#f0f6fc]">
                  Grade Breakdown
                </h2>

                <p className="mt-1 text-[10px] text-[#484f58]">
                  Distribution of your repository audit grades
                </p>

              </div>

              <div className="rounded-lg border border-[#30363d] bg-[#0d1117] px-2.5 py-1.5 text-[9px] text-[#6e7681]">
                {totalScans} total
              </div>

            </div>

            <div className="space-y-3">

              {["A", "B", "C", "D", "F"].map((g) => {

                const count =
                  gradeCounts[g] ?? 0;

                const pct = totalScans
                  ? Math.round(
                      (count / totalScans) * 100
                    )
                  : 0;

                const style = gradeStyle(g);

                return (
                  <div
                    key={g}
                    className="flex items-center gap-3"
                  >

                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${style.badge}`}
                    >
                      {g}
                    </span>

                    <div className="flex-1">

                      <div className="mb-1.5 flex justify-between">

                        <span className="text-[10px] text-[#6e7681]">
                          Grade {g}
                        </span>

                        <span className="text-[9px] text-[#484f58]">
                          {pct}%
                        </span>

                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-[#21262d]">

                        <div
                          className={`h-full rounded-full ${style.bar} transition-all duration-700`}
                          style={{
                            width: `${pct}%`,
                          }}
                        />

                      </div>

                    </div>

                    <span className="w-14 text-right text-[9px] text-[#484f58]">
                      {count} repo
                      {count !== 1 ? "s" : ""}
                    </span>

                  </div>
                );
              })}

            </div>

          </div>
        )}

        {/* =====================================================
            RECENT ACTIVITY
        ===================================================== */}

        {reports.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22]">

            <div className="flex items-center justify-between border-b border-[#21262d] px-5 py-4">

              <div>

                <h2 className="text-sm font-semibold text-[#f0f6fc]">
                  Recent Activity
                </h2>

                <p className="mt-1 text-[10px] text-[#484f58]">
                  Your latest repository audits
                </p>

              </div>

              <button
                onClick={() => navigate("/history")}
                className="rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-[#58a6ff] transition hover:bg-[#1f6feb]/10"
              >
                View all →
              </button>

            </div>

            <div className="p-2">

              {reports.slice(0, 5).map((r, i) => {

                const avg = Math.round(
                  ((r.scores?.codeQuality ?? 0) +
                    (r.scores?.security ?? 0) +
                    (r.scores?.performance ?? 0) +
                    (r.scores?.maintainability ?? 0)) /
                    4
                );

                const style = gradeStyle(
                  (r.grade ?? "N/A")[0]
                );

                const repoName =
                  r.repoUrl?.replace(
                    "https://github.com/",
                    ""
                  ) ?? "Unknown";

                const date = r.createdAt
                  ? new Date(
                      r.createdAt
                    ).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      }
                    )
                  : "";

                return (
                  <div
                    key={r._id ?? i}
                    className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-[#0d1117]"
                  >

                    {/* Grade */}

                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${style.badge}`}
                    >
                      {r.grade ?? "N/A"}
                    </span>

                    {/* Repository */}

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-[11px] font-medium text-[#c9d1d9] group-hover:text-[#f0f6fc]">
                        {repoName}
                      </p>

                      <p className="mt-0.5 text-[8px] text-[#484f58]">
                        Repository audit
                      </p>

                    </div>

                    {/* Date */}

                    <span className="hidden text-[9px] text-[#484f58] sm:block">
                      {date}
                    </span>

                    {/* Score */}

                    <span className="rounded-md border border-[#30363d] bg-[#0d1117] px-2 py-1 text-[9px] font-medium text-[#8b949e]">
                      {avg}%
                    </span>

                  </div>
                );
              })}

            </div>

          </div>
        )}

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {totalScans === 0 && !loading && (
          <div className="relative overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22] px-6 py-16 text-center">

            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative">

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-[#30363d] bg-[#0d1117]">

                <span className="text-xl">
                  ◈
                </span>

              </div>

              <p className="text-base font-semibold text-[#c9d1d9]">
                No scans yet
              </p>

              <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[#6e7681]">
                Analyze a GitHub repository to start building
                your CodeVerity profile and see your audit
                statistics here.
              </p>

              <button
                onClick={() => navigate("/dashboard")}
                className="mt-5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/10 transition hover:scale-[1.02] hover:shadow-blue-500/20 active:scale-95"
              >
                Start analyzing →
              </button>

            </div>

          </div>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="flex items-center justify-center gap-2 py-3 text-[9px] text-[#30363d]">

          <span>
            CodeVerity
          </span>

          <span>•</span>

          <span>
            AI Repository Intelligence
          </span>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   PILL
========================================================= */

function Pill({ icon, text }) {
  return (
    <span className="flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[#0d1117] px-2.5 py-1.5 text-[9px] text-[#6e7681]">
      <span className="text-[#58a6ff]">
        {icon}
      </span>

      {text}
    </span>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  color,
}) {
  const colors = {
    blue: {
      border: "border-blue-500/20",
      icon: "bg-blue-500/10 text-blue-400",
      glow: "bg-blue-500/5",
    },

    purple: {
      border: "border-purple-500/20",
      icon: "bg-purple-500/10 text-purple-400",
      glow: "bg-purple-500/5",
    },

    cyan: {
      border: "border-cyan-500/20",
      icon: "bg-cyan-500/10 text-cyan-400",
      glow: "bg-cyan-500/5",
    },

    green: {
      border: "border-emerald-500/20",
      icon: "bg-emerald-500/10 text-emerald-400",
      glow: "bg-emerald-500/5",
    },
  };

  const style =
    colors[color] ?? colors.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${style.border} bg-[#161b22] p-4`}
    >

      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl ${style.glow}`}
      />

      <div className="relative">

        <div
          className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm ${style.icon}`}
        >
          {icon}
        </div>

        <p className="text-xl font-bold text-[#f0f6fc]">
          {value}
        </p>

        <p className="mt-0.5 text-[9px] text-[#484f58]">
          {label}
        </p>

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
      badge:
        "bg-emerald-500/10 text-emerald-400",
      text: "text-emerald-400",
      bar: "bg-emerald-500",
    },

    B: {
      badge:
        "bg-blue-500/10 text-blue-400",
      text: "text-blue-400",
      bar: "bg-blue-500",
    },

    C: {
      badge:
        "bg-yellow-500/10 text-yellow-400",
      text: "text-yellow-400",
      bar: "bg-yellow-500",
    },

    D: {
      badge:
        "bg-orange-500/10 text-orange-400",
      text: "text-orange-400",
      bar: "bg-orange-500",
    },

    F: {
      badge:
        "bg-red-500/10 text-red-400",
      text: "text-red-400",
      bar: "bg-red-500",
    },
  };

  return (
    map[letter] ?? {
      badge:
        "bg-gray-500/10 text-gray-400",
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
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">

      <div className="flex flex-col items-center gap-4">

        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">

          <div className="absolute inset-[1px] rounded-[11px] bg-[#0d1117]" />

          <span className="relative text-[9px] font-black">
            <span className="text-blue-400">
              &lt;
            </span>

            CV

            <span className="text-purple-400">
              /&gt;
            </span>
          </span>

        </div>

        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#30363d] border-t-[#58a6ff]" />

        <p className="text-[10px] text-[#484f58]">
          Loading CodeVerity profile…
        </p>

      </div>

    </div>
  );
}