import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { createInvitation } from "../../api/workspace";

export default function InviteMemberModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createInvitation({ email, role });
      success(`Invite sent to ${email}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err.response?.data?.error || "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Invite Member</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Invite"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}