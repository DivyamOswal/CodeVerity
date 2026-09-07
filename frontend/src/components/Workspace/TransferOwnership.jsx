// frontend/src/components/Workspace/TransferOwnership.jsx
import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { transferOwnership } from "../../api/workspace";

export default function TransferOwnership({ members, currentUserId }) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const admins = members.filter(
    (m) => m.role === "admin" && m.userId._id !== currentUserId
  );

  const handleTransfer = async () => {
    if (!selectedUserId) return;
    if (!window.confirm("Transfer ownership to this admin?")) return;
    setLoading(true);
    try {
      await transferOwnership(selectedUserId);
      success("Ownership transferred successfully");
      window.location.reload(); // Refresh to update roles
    } catch (err) {
      error(err.response?.data?.error || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  if (admins.length === 0) return null;

  return (
    <div className="mt-4 p-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)]">
      <h4 className="text-sm font-medium text-[var(--text-primary)]">Transfer Ownership</h4>
      <div className="mt-2 flex flex-col sm:flex-row gap-2">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        >
          <option value="">Select admin...</option>
          {admins.map((admin) => (
            <option key={admin.userId._id} value={admin.userId._id}>
              {admin.userId.name || admin.userId.email}
            </option>
          ))}
        </select>
        <button
          onClick={handleTransfer}
          disabled={!selectedUserId || loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "Transferring..." : "Transfer"}
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">Only admins can become owners.</p>
    </div>
  );
}