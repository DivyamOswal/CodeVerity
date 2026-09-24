// src/components/Workspace/DeleteWorkspace.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
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
    <section className="dw-section">
      {/* Diagonal hazard stripe */}
      <div aria-hidden="true" className="dw-hazard" />

      <div className="relative p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="dw-icon-badge">
            <AlertTriangle size={14} strokeWidth={2.4} aria-hidden="true" />
            <span aria-hidden="true" className="dw-icon-pulse" />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-danger)]">
              Danger Zone
            </h4>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
              irreversible · 30-day grace period
            </p>
          </div>
        </div>

        {/* Body */}
        <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Deleting this workspace removes all members, scans, and reports. You
          have 30 days to restore it before permanent removal.
        </p>

        {/* Trigger */}
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="dw-trigger group mt-5">
            <Trash2
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6"
            />
            Delete workspace
          </button>
        ) : (
          <div className="dw-confirm mt-5">
            <div className="flex items-start gap-3">
              <div className="dw-confirm-icon">
                <ShieldAlert size={16} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Confirm permanent deletion
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  This action cannot be undone after the 30-day grace period.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="dw-confirm-primary"
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
                      <>
                        <Trash2 size={12} strokeWidth={2.4} aria-hidden="true" />
                        Yes, delete this workspace
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                    className="dw-confirm-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .dw-section {
          position: relative;
          margin-top: 2rem;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid color-mix(in srgb, var(--color-danger) 25%, transparent);
          background:
            radial-gradient(
              ellipse 120% 100% at 0% 0%,
              color-mix(in srgb, var(--color-danger) 8%, transparent) 0%,
              transparent 55%
            ),
            var(--bg-card);
          box-shadow:
            0 1px 0 0 color-mix(in srgb, var(--color-danger) 15%, transparent) inset,
            0 -1px 0 0 rgba(0, 0, 0, 0.2) inset;
        }

        .dw-hazard {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: repeating-linear-gradient(
            135deg,
            var(--color-danger) 0px,
            var(--color-danger) 8px,
            transparent 8px,
            transparent 16px
          );
          opacity: 0.6;
        }

        .dw-icon-badge {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border-radius: 8px;
          background: var(--color-danger-soft);
          color: var(--color-danger);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-danger) 30%, transparent);
        }

        .dw-icon-pulse {
          position: absolute;
          inset: -3px;
          border-radius: 11px;
          border: 1px solid color-mix(in srgb, var(--color-danger) 40%, transparent);
          animation: dw-pulse 2.4s ease-out infinite;
          pointer-events: none;
        }

        @keyframes dw-pulse {
          0%   { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .dw-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1rem;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-danger);
          border: 1px solid color-mix(in srgb, var(--color-danger) 35%, transparent);
          background: color-mix(in srgb, var(--color-danger) 8%, transparent);
          transition: all 0.2s ease;
        }

        .dw-trigger:hover {
          background: color-mix(in srgb, var(--color-danger) 16%, transparent);
          border-color: color-mix(in srgb, var(--color-danger) 55%, transparent);
          box-shadow: 0 8px 24px -8px color-mix(in srgb, var(--color-danger) 40%, transparent);
          transform: translateY(-1px);
        }

        .dw-trigger:active {
          transform: translateY(0) scale(0.98);
        }

        .dw-trigger:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger) 25%, transparent);
        }

        .dw-confirm {
          position: relative;
          padding: 1.15rem 1.25rem;
          border-radius: 14px;
          border: 1px solid color-mix(in srgb, var(--color-danger) 35%, transparent);
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--color-danger) 10%, transparent),
              color-mix(in srgb, var(--color-danger) 4%, transparent)
            ),
            var(--bg-primary);
          box-shadow:
            0 20px 40px -20px color-mix(in srgb, var(--color-danger) 45%, transparent),
            0 1px 0 0 color-mix(in srgb, var(--color-danger) 20%, transparent) inset;
          animation: dw-confirm-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes dw-confirm-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .dw-confirm-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border-radius: 10px;
          background: color-mix(in srgb, var(--color-danger) 14%, transparent);
          color: var(--color-danger);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-danger) 35%, transparent);
        }

        .dw-confirm-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.9rem;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 600;
          background: var(--color-danger);
          color: #ffffff;
          box-shadow: 0 8px 20px -8px color-mix(in srgb, var(--color-danger) 60%, transparent);
          transition: all 0.15s ease;
        }

        .dw-confirm-primary:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 12px 24px -8px color-mix(in srgb, var(--color-danger) 70%, transparent);
        }

        .dw-confirm-primary:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .dw-confirm-primary:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger) 30%, transparent);
        }

        .dw-confirm-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .dw-confirm-cancel {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.9rem;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          transition: all 0.15s ease;
        }

        .dw-confirm-cancel:hover:not(:disabled) {
          color: var(--text-primary);
          background: var(--bg-hover);
          border-color: color-mix(in srgb, var(--text-primary) 20%, transparent);
        }

        .dw-confirm-cancel:active:not(:disabled) {
          transform: scale(0.98);
        }

        .dw-confirm-cancel:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
        }

        .dw-confirm-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (prefers-reduced-motion: reduce) {
          .dw-icon-pulse { animation: none; }
          .dw-confirm { animation: none; }
          .dw-trigger:hover { transform: none; }
          .dw-confirm-primary:hover:not(:disabled) { transform: none; }
        }
      `}} />
    </section>
  );
}