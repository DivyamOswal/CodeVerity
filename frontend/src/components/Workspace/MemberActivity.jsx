import { useEffect, useState } from "react";
import { getMemberActivity } from "../../api/workspace";

export default function MemberActivity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMemberActivity();
        setActivity(res.data.activity || []);
      } catch (err) {
        console.error("Failed to load activity", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading activity...</p>;
  if (activity.length === 0) return <p className="text-sm text-[var(--text-muted)]">No recent activity.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--bg-hover)]">
          <tr>
            <th className="px-4 py-2 text-xs font-medium text-[var(--text-muted)]">Member</th>
            <th className="px-4 py-2 text-xs font-medium text-[var(--text-muted)]">Total Actions</th>
            <th className="px-4 py-2 text-xs font-medium text-[var(--text-muted)]">Last Active</th>
            <th className="px-4 py-2 text-xs font-medium text-[var(--text-muted)]">Recent Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-dark)]">
          {activity.map((a) => (
            <tr key={a.userId} className="hover:bg-[var(--bg-hover)]/30">
              <td className="px-4 py-2 font-medium text-[var(--text-primary)]">{a.name}</td>
              <td className="px-4 py-2 text-[var(--text-secondary)]">{a.totalActions}</td>
              <td className="px-4 py-2 text-[var(--text-secondary)]">
                {a.lastActive ? new Date(a.lastActive).toLocaleDateString() : "N/A"}
              </td>
              <td className="px-4 py-2 max-w-[200px] truncate text-[var(--text-muted)]">
                {a.actions.map(act => act.action).join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}