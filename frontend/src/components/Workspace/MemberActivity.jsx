// src/components/Workspace/MemberActivity.jsx
import { useEffect, useState } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { getMemberActivity } from "../../api/workspace";

// ── Avatar initials ──
function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Relative "time ago" ──
function timeAgo(dateStr) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function MemberActivity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchActivity = async (p = 1) => {
    setLoading(true);
    setError(false);
    try {
      const res = await getMemberActivity(p, 10);
      setActivity(res.data.activity || []);
      setPagination(res.data.pagination || null);
      setPage(p);
    } catch (err) {
      console.error("Failed to load activity", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity(1);
  }, []);

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border-light)]">
        <div className="flex items-center gap-2 bg-[var(--bg-hover)] px-4 py-2.5">
          <span className="activity-skeleton h-3 w-20 rounded" />
          <span className="activity-skeleton ml-auto h-3 w-16 rounded" />
        </div>
        <div className="divide-y divide-[var(--border-dark)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="activity-skeleton h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <span className="activity-skeleton block h-3 w-28 rounded" />
                <span className="activity-skeleton block h-2.5 w-40 rounded" />
              </div>
              <span className="activity-skeleton h-3 w-14 shrink-0 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ─── ERROR ─── */
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-4 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)] ring-1 ring-[var(--color-danger)]/30">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Couldn't load activity
          </p>
          <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">
            Something went wrong while fetching recent member actions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchActivity(page)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition-all duration-150 hover:bg-[var(--color-danger)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97]"
        >
          <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  /* ─── EMPTY ─── */
  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Clock size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          No recent activity
        </p>
        <p className="max-w-xs text-xs text-[var(--text-muted)]">
          Member actions will show up here once your team starts working in
          this workspace.
        </p>
      </div>
    );
  }

  /* ─── DATA ─── */
  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--bg-hover)]">
              <tr>
                {["Member", "Total Actions", "Last Active", "Recent Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-dark)]">
              {activity.map((a, i) => {
                const uniqueActions = Array.from(
                  new Set(a.actions.map((act) => act.action))
                );
                const shown = uniqueActions.slice(0, 3);
                const overflow = uniqueActions.length - shown.length;
                const activeRecently =
                  a.lastActive &&
                  Date.now() - new Date(a.lastActive).getTime() <
                    24 * 60 * 60 * 1000;

                return (
                  <tr
                    key={a.userId}
                    className="activity-row transition-colors duration-150 hover:bg-[var(--bg-hover)]/40"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-mono text-[10px] font-bold text-[var(--accent)] ring-1 ring-[var(--accent)]/20">
                          {initials(a.name)}
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {a.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                        {a.totalActions}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                      <span
                        className="inline-flex items-center gap-1.5"
                        title={activeRecently ? "Active in last 24 hours" : undefined}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            activeRecently
                              ? "bg-[var(--color-success)]"
                              : "bg-[var(--text-muted)]"
                          }`}
                          aria-hidden="true"
                        />
                        {timeAgo(a.lastActive)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex max-w-[260px] flex-wrap items-center gap-1">
                        {shown.length ? (
                          shown.map((action, j) => (
                            <span
                              key={j}
                              className="whitespace-nowrap rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]"
                            >
                              {action}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">
                            —
                          </span>
                        )}
                        {overflow > 0 && (
                          <span className="whitespace-nowrap rounded-md border border-[var(--border-light)] bg-[var(--bg-hover)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                            +{overflow}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-dark)] pt-4 sm:flex-row">
          <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
            Page {pagination.page} of {pagination.totalPages} •{" "}
            {pagination.total} members
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fetchActivity(page - 1)}
              disabled={!pagination.hasPrev || loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
            >
              <ChevronLeft size={13} strokeWidth={2} aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => fetchActivity(page + 1)}
              disabled={!pagination.hasNext || loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
            >
              Next
              <ChevronRight size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}