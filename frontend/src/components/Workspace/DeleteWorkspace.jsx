// src/components/Workspace/DeleteWorkspace.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteWorkspace } from "../../api/workspace";
import { useToast } from "../../hooks/useToast";

export default function DeleteWorkspace() {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const navigate = useNavigate();
  const { success, error } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteWorkspace();
      success("Workspace deleted. It will be permanently removed in 30 days.");
      navigate("/dashboard");
    } catch (err) {
      error(err.response?.data?.error || "Failed to delete workspace");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
    <div className="mt-6 border-t border-[var(--color-danger)]/20 pt-6">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
          <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" />
        </span>
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-danger)]">
          Danger Zone
        </h4>
      </div>

      <p className="mt-2 max-w-md text-xs leading-relaxed text-[var(--text-muted)]">
        Deleting this workspace removes all members and data. It can be
        restored within 30 days before permanent removal.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="group mt-3 flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-4 py-2 text-sm font-medium text-[var(--color-danger)] transition-colors duration-150 hover:bg-[var(--color-danger)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97]"
        >
          <Trash2
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className="transition-transform duration-150 group-hover:scale-110"
          />
          Delete Workspace
        </button>
      ) : (
        <div className="danger-confirm-panel mt-3 max-w-md rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] ring-1 ring-[var(--color-danger)]/30">
              <AlertTriangle size={16} strokeWidth={2.2} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Are you absolutely sure?
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                This will remove all members and data from this workspace.
                You'll have 30 days to restore it before it's gone for good.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-[var(--color-danger)] px-3.5 py-2 text-xs font-semibold text-[var(--color-danger-contrast)] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97] disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={12}
                        strokeWidth={2.4}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                      Deleting…
                    </>
                  ) : (
                    "Yes, delete workspace"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={loading}
                  className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
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