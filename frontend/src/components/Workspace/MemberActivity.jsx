// frontend/src/components/Workspace/MemberActivity.jsx
import { useEffect, useState } from "react";
import { getMemberActivity } from "../../api/workspace";

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

  if (loading) {
    return (
      <p className="text-sm text-[var(--text-muted)]">Loading activity...</p>
    );
  }

  if (activity.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">No recent activity.</p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--bg-hover)]">
            <tr>
              <th className="whitespace-nowrap px-4 py-2 text-xs font-medium text-[var(--text-muted)]">
                Member
              </th>
              <th className="whitespace-nowrap px-4 py-2 text-xs font-medium text-[var(--text-muted)]">
                Total Actions
              </th>
              <th className="whitespace-nowrap px-4 py-2 text-xs font-medium text-[var(--text-muted)]">
                Last Active
              </th>
              <th className="whitespace-nowrap px-4 py-2 text-xs font-medium text-[var(--text-muted)]">
                Recent Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-dark)]">
            {activity.map((a) => (
              <tr key={a.userId} className="hover:bg-[var(--bg-hover)]/30">
                <td className="px-4 py-2 font-medium text-[var(--text-primary)]">
                  {a.name}
                </td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">
                  {a.totalActions}
                </td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">
                  {a.lastActive
                    ? new Date(a.lastActive).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="max-w-[200px] truncate px-4 py-2 text-[var(--text-muted)]">
                  {a.actions.map((act) => act.action).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-dark)] pt-4 sm:flex-row">
          <p className="text-xs text-[var(--text-muted)]">
            Page {pagination.page} of {pagination.totalPages} •{" "}
            {pagination.total} members
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchActivity(page - 1)}
              disabled={!pagination.hasPrev || loading}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={() => fetchActivity(page + 1)}
              disabled={!pagination.hasNext || loading}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}