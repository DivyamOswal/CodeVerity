// frontend/src/components/Workspace/MemberActivity.jsx
import { useEffect, useState } from "react";
import { getMemberActivity } from "../../api/workspace";

// ── Avatar initials + deterministic accent-tinted color ──
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

// ── Relative "time ago" for last active, falls back to date ──
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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchActivity = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getMemberActivity(p, 10);
      setActivity(res.data.activity || []);
      setPagination(res.data.pagination || null);
      setPage(p);
    } catch (err) {
      console.error("Failed to load activity", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity(1);
  }, []);

  const styleBlock = (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      @keyframes activity-fade-in {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes activity-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .activity-row {
        animation: activity-fade-in 0.25s ease-out both;
      }
      .activity-skeleton {
        background: linear-gradient(
          90deg,
          var(--bg-hover) 25%,
          var(--border-light) 50%,
          var(--bg-hover) 75%
        );
        background-size: 200% 100%;
        animation: activity-shimmer 1.6s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .activity-row { animation: none; }
        .activity-skeleton { animation: none; }
      }
    `,
      }}
    />
  );

  if (loading) {
    return (
      <div>
        {styleBlock}
        <div className="overflow-hidden rounded-xl border border-[var(--border-light)]">
          <div className="flex items-center gap-2 bg-[var(--bg-hover)] px-4 py-2.5">
            <span className="h-3 w-20 rounded activity-skeleton" />
            <span className="ml-auto h-3 w-16 rounded activity-skeleton" />
          </div>
          <div className="divide-y divide-[var(--border-dark)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="h-8 w-8 shrink-0 rounded-full activity-skeleton" />
                <div className="flex-1 space-y-1.5">
                  <span className="block h-3 w-28 rounded activity-skeleton" />
                  <span className="block h-2.5 w-40 rounded activity-skeleton" />
                </div>
                <span className="h-3 w-14 shrink-0 rounded activity-skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <div>
        {styleBlock}
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </span>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            No recent activity
          </p>
          <p className="max-w-xs text-xs text-[var(--text-muted)]">
            Member actions will show up here once your team starts working in
            this workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {styleBlock}
      <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--bg-hover)]">
              <tr>
                <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Member
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Total Actions
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Last Active
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Recent Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-dark)]">
              {activity.map((a, i) => {
                const uniqueActions = Array.from(
                  new Set(a.actions.map((act) => act.action)),
                );
                const shown = uniqueActions.slice(0, 3);
                const overflow = uniqueActions.length - shown.length;

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
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            a.lastActive &&
                            Date.now() - new Date(a.lastActive).getTime() <
                              24 * 60 * 60 * 1000
                              ? "bg-[var(--color-success)]"
                              : "bg-[var(--text-muted)]"
                          }`}
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
              onClick={() => fetchActivity(page - 1)}
              disabled={!pagination.hasPrev || loading}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/30 hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
            >
              ← Previous
            </button>
            <button
              onClick={() => fetchActivity(page + 1)}
              disabled={!pagination.hasNext || loading}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/30 hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
