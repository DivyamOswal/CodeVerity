// frontend/src/components/Workspace/TransferOwnership.jsx
import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { transferOwnership } from "../../api/workspace";

// ── Avatar initials from name or email ──
function initials(label) {
  if (!label) return "?";
  const parts = label.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
}

export default function TransferOwnership({ members, currentUserId }) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { success, error } = useToast();

  const admins = members.filter(
    (m) => m.role === "admin" && m.userId._id !== currentUserId
  );

  const selectedAdmin = admins.find((a) => a.userId._id === selectedUserId);

  const handleTransfer = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      await transferOwnership(selectedUserId);
      success("Ownership transferred successfully");
      window.location.reload(); // Refresh to update roles
    } catch (err) {
      error(err.response?.data?.error || "Transfer failed");
      setLoading(false);
      setConfirming(false);
    }
  };

  if (admins.length === 0) return null;

  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border border-[var(--color-warning)]/25 bg-[var(--bg-primary)] p-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes transfer-confirm-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .transfer-confirm-panel {
          animation: transfer-confirm-in 0.2s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .transfer-confirm-panel { animation: none; }
        }
      `,
        }}
      />

      <div className="flex items-start gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--color-warning-soft)] text-[10px] text-[var(--color-warning)]">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-[var(--text-primary)]">
            Transfer Ownership
          </h4>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Only admins can become owners. This action cannot be undone.
          </p>
        </div>
      </div>

      {!confirming ? (
        <>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            >
              <option value="">Select admin...</option>
              {admins.map((admin) => (
                <option key={admin.userId._id} value={admin.userId._id}>
                  {admin.userId.name || admin.userId.email}
                </option>
              ))}
            </select>
            <button
              onClick={() => setConfirming(true)}
              disabled={!selectedUserId || loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_6px_16px_-8px_var(--accent-soft-strong)] transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            >
              Transfer
            </button>
          </div>
        </>
      ) : (
        <div className="transfer-confirm-panel mt-3 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-3.5">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-mono text-[10px] font-bold text-[var(--accent)] ring-1 ring-[var(--accent)]/20">
              {initials(
                selectedAdmin?.userId.name || selectedAdmin?.userId.email
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Make{" "}
                <span className="text-[var(--accent)]">
                  {selectedAdmin?.userId.name || selectedAdmin?.userId.email}
                </span>{" "}
                the owner?
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                You'll lose owner privileges and this member will gain full
                control of the workspace. This cannot be undone.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTransfer}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-[var(--color-warning)] px-3.5 py-2 text-xs font-semibold text-[var(--bg-primary)] transition-all duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--bg-primary)]/40 border-t-[var(--bg-primary)]" />
                      Transferring…
                    </>
                  ) : (
                    "Yes, transfer ownership"
                  )}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={loading}
                  className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}