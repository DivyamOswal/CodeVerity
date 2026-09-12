import { useEffect, useState } from "react";
import { getPendingInvites, cancelInvitation } from "../../api/workspace";
import { useToast } from "../../hooks/useToast";

export default function PendingInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const fetchInvites = async () => {
    try {
      const res = await getPendingInvites();
      setInvites(res.data.invitations || []);
    } catch (err) {
      error("Failed to load pending invites");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (token) => {
    if (!window.confirm("Cancel this invitation?")) return;
    try {
      await cancelInvitation(token);
      success("Invitation cancelled");
      fetchInvites();
    } catch (err) {
      error("Failed to cancel invitation");
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  if (loading)
    return (
      <p className="text-sm text-[var(--text-muted)]">Loading invites...</p>
    );
  if (invites.length === 0)
    return (
      <p className="text-sm text-[var(--text-muted)]">
        No pending invitations.
      </p>
    );

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium text-[var(--text-primary)]">
        Pending Invites
      </h4>
      {invites.map((inv) => (
        <div
          key={inv._id}
          className="flex items-center justify-between rounded-lg border border-[var(--border-light)] p-3"
        >
          <div>
            <p className="text-sm text-[var(--text-primary)]">{inv.email}</p>
            <p className="text-xs text-[var(--text-muted)]">
              Role: {inv.role} • Expires:{" "}
              {new Date(inv.expiresAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => handleCancel(inv._id)}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 hover:bg-red-500/20"
          >
            Cancel
          </button>
        </div>
      ))}
    </div>
  );
}
