// src/components/Workspace/MemberActivity.jsx
import { useEffect, useState } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RotateCw,
  Activity,
  Users,
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

// ── Classify an action string into a semantic bucket ──
// Keeps the palette tied to what actually happened, not just the
// action label. Falls back to neutral when nothing matches.
function actionTone(action) {
  const a = String(action || "").toLowerCase();
  if (/(delete|remove|revoke|fail|error)/.test(a)) return "danger";
  if (/(scan|analyze|analyse)/.test(a)) return "accent";
  if (/(report|pdf|export|download)/.test(a)) return "info";
  if (/(invite|member|role|join|accept)/.test(a)) return "success";
  if (/(login|auth|sign)/.test(a)) return "neutral";
  return "neutral";
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
      <div className="ma-shell">
        <div className="ma-header">
          <div className="flex items-center gap-2.5">
            <span className="ma-header-icon">
              <Activity size={13} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <span className="activity-skeleton block h-3 w-24 rounded" />
              <span className="activity-skeleton block h-2 w-16 rounded" />
            </div>
          </div>
        </div>
        <div className="divide-y divide-[var(--border-dark)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <span className="activity-skeleton h-9 w-9 shrink-0 rounded-full" />
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
      <div className="ma-error">
        <span className="ma-error-icon">
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
        <button type="button" onClick={() => fetchActivity(page)} className="ma-retry">
          <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  /* ─── EMPTY ─── */
  if (activity.length === 0) {
    return (
      <div className="ma-empty">
        <span className="ma-empty-icon">
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

  /* ─── DERIVED ─── */
  // Max totalActions across the current page — used for the relative
  // share bar in the "Total Actions" column.
  const maxActions = activity.reduce(
    (m, a) => Math.max(m, a.totalActions || 0),
    0,
  );

  // Anyone active within the last 24 hours → drives the header pill.
  const activeNow = activity.filter(
    (a) =>
      a.lastActive &&
      Date.now() - new Date(a.lastActive).getTime() < 24 * 60 * 60 * 1000,
  ).length;

  /* ─── DATA ─── */
  return (
    <div>
      <div className="ma-shell">
        {/* Header */}
        <div className="ma-header">
          <div className="flex items-center gap-2.5">
            <span className="ma-header-icon">
              <Activity size={13} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                Member activity
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                {activity.length} member{activity.length === 1 ? "" : "s"} on this page
              </p>
            </div>
          </div>

          {activeNow > 0 && (
            <span className="ma-live-pill">
              <span className="ma-live-dot" aria-hidden="true" />
              {activeNow} active now
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="ma-thead">
                {["Member", "Total Actions", "Last Active", "Recent Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]"
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
                const sharePct =
                  maxActions > 0
                    ? Math.max((a.totalActions / maxActions) * 100, 4)
                    : 0;

                return (
                  <tr
                    key={a.userId}
                    className="ma-row"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    {/* Member */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="ma-avatar">
                          {initials(a.name)}
                          {activeRecently && (
                            <span className="ma-avatar-dot" aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--text-primary)]">
                            {a.name}
                          </p>
                          {activeRecently && (
                            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-success)]">
                              online
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Total Actions — number + relative share bar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                          {a.totalActions}
                        </span>
                        <span className="ma-share-track" aria-hidden="true">
                          <span
                            className="ma-share-fill"
                            style={{ width: `${sharePct}%` }}
                          />
                        </span>
                      </div>
                    </td>

                    {/* Last Active */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-2 text-[var(--text-secondary)]"
                        title={a.lastActive ? new Date(a.lastActive).toLocaleString() : undefined}
                      >
                        <span
                          className={`ma-status-dot ${
                            activeRecently ? "is-active" : ""
                          }`}
                          aria-hidden="true"
                        />
                        <span className="text-[13px]">{timeAgo(a.lastActive)}</span>
                      </span>
                    </td>

                    {/* Recent Actions */}
                    <td className="px-4 py-3">
                      <div className="flex max-w-[280px] flex-wrap items-center gap-1.5">
                        {shown.length ? (
                          shown.map((action, j) => (
                            <span
                              key={j}
                              className={`ma-action-chip tone-${actionTone(action)}`}
                            >
                              {action}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                        {overflow > 0 && (
                          <span className="ma-action-chip tone-neutral">
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
        <div className="ma-pager">
          <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Users size={11} strokeWidth={2} aria-hidden="true" />
            Page {pagination.page} of {pagination.totalPages} ·{" "}
            <span className="font-mono text-[var(--text-secondary)]">
              {pagination.total}
            </span>{" "}
            member{pagination.total === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fetchActivity(page - 1)}
              disabled={!pagination.hasPrev || loading}
              className="ma-pager-btn"
            >
              <ChevronLeft size={13} strokeWidth={2} aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => fetchActivity(page + 1)}
              disabled={!pagination.hasNext || loading}
              className="ma-pager-btn"
            >
              Next
              <ChevronRight size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        /* ─── Shell ─────────────────────────────────────────── */
        .ma-shell {
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid var(--border-light);
          background: var(--bg-card);
          box-shadow:
            0 1px 0 0 color-mix(in srgb, var(--accent) 6%, transparent) inset,
            0 12px 32px -20px rgba(0, 0, 0, 0.5);
        }

        /* ─── Header ────────────────────────────────────────── */
        .ma-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--accent) 5%, transparent),
              transparent
            ),
            var(--bg-hover);
          border-bottom: 1px solid var(--border-dark);
        }

        .ma-header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border-radius: 8px;
          background: color-mix(in srgb, var(--accent) 14%, transparent);
          color: var(--accent);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 25%, transparent) inset;
        }

        .ma-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-success) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
          color: var(--color-success);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .ma-live-dot {
          position: relative;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: var(--color-success);
        }
        .ma-live-dot::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 999px;
          background: var(--color-success);
          opacity: 0.5;
          animation: ma-live-pulse 1.8s ease-out infinite;
        }
        @keyframes ma-live-pulse {
          0%   { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        /* ─── Table head ────────────────────────────────────── */
        .ma-thead {
          background: color-mix(in srgb, var(--bg-hover) 60%, transparent);
          border-bottom: 1px solid var(--border-dark);
        }

        /* ─── Rows ──────────────────────────────────────────── */
        .ma-row {
          position: relative;
          transition: background-color 0.15s ease;
          animation: ma-row-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes ma-row-in {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ma-row:hover {
          background: color-mix(in srgb, var(--accent) 4%, transparent);
        }
        .ma-row:hover td:first-child {
          box-shadow: inset 2px 0 0 0 var(--accent);
        }
        .ma-row td:first-child {
          transition: box-shadow 0.2s ease;
        }

        /* ─── Avatar ────────────────────────────────────────── */
        .ma-avatar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 999px;
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--accent) 22%, transparent),
              color-mix(in srgb, var(--accent) 8%, transparent)
            );
          color: var(--accent);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent),
            0 0 12px -4px color-mix(in srgb, var(--accent) 50%, transparent);
        }

        .ma-avatar-dot {
          position: absolute;
          right: -1px;
          bottom: -1px;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--color-success);
          border: 2px solid var(--bg-card);
        }

        /* ─── Share bar (Total Actions) ─────────────────────── */
        .ma-share-track {
          position: relative;
          width: 60px;
          height: 3px;
          border-radius: 999px;
          background: var(--border-light);
          overflow: hidden;
        }
        .ma-share-fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            var(--accent),
            color-mix(in srgb, var(--accent) 60%, transparent)
          );
          box-shadow: 0 0 8px -2px color-mix(in srgb, var(--accent) 80%, transparent);
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ─── Status dot (Last Active) ──────────────────────── */
        .ma-status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          flex-shrink: 0;
          border-radius: 999px;
          background: var(--text-muted);
          opacity: 0.5;
        }
        .ma-status-dot.is-active {
          background: var(--color-success);
          opacity: 1;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-success) 22%, transparent);
        }

        /* ─── Action chips ──────────────────────────────────── */
        .ma-action-chip {
          display: inline-flex;
          align-items: center;
          padding: 2px 7px;
          border-radius: 5px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.01em;
          white-space: nowrap;
          border: 1px solid transparent;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .ma-action-chip.tone-accent {
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border-color: color-mix(in srgb, var(--accent) 28%, transparent);
        }
        .ma-action-chip.tone-info {
          color: #60a5fa;
          background: rgba(96, 165, 250, 0.1);
          border-color: rgba(96, 165, 250, 0.28);
        }
        .ma-action-chip.tone-success {
          color: var(--color-success);
          background: color-mix(in srgb, var(--color-success) 10%, transparent);
          border-color: color-mix(in srgb, var(--color-success) 28%, transparent);
        }
        .ma-action-chip.tone-danger {
          color: var(--color-danger);
          background: color-mix(in srgb, var(--color-danger) 10%, transparent);
          border-color: color-mix(in srgb, var(--color-danger) 28%, transparent);
        }
        .ma-action-chip.tone-neutral {
          color: var(--text-secondary);
          background: var(--bg-primary);
          border-color: var(--border-light);
        }

        /* ─── Error / Empty ─────────────────────────────────── */
        .ma-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 40px 16px;
          text-align: center;
          border-radius: 14px;
          border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
          background: color-mix(in srgb, var(--color-danger) 5%, transparent);
        }
        .ma-error-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-danger) 12%, transparent);
          color: var(--color-danger);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-danger) 30%, transparent);
        }
        .ma-retry {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-danger);
          background: var(--bg-card);
          border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .ma-retry:hover {
          background: color-mix(in srgb, var(--color-danger) 10%, transparent);
        }
        .ma-retry:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger) 25%, transparent);
        }
        .ma-retry:active {
          transform: scale(0.97);
        }

        .ma-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 40px 16px;
          text-align: center;
          border-radius: 14px;
          border: 1px dashed var(--border-light);
          background: var(--bg-primary);
        }
        .ma-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          color: var(--accent);
        }

        /* ─── Pagination ────────────────────────────────────── */
        .ma-pager {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-dark);
        }
        @media (min-width: 640px) {
          .ma-pager {
            flex-direction: row;
          }
        }

        .ma-pager-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .ma-pager-btn:hover:not(:disabled) {
          color: var(--accent);
          border-color: color-mix(in srgb, var(--accent) 40%, var(--border-light));
        }
        .ma-pager-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
        }
        .ma-pager-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .ma-pager-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ─── Reduced motion ────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .ma-row,
          .ma-live-dot::after {
            animation: none;
          }
          .ma-share-fill {
            transition: none;
          }
        }
      ` }} />
    </div>
  );
}