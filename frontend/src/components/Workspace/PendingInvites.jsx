// src/components/Workspace/PendingInvites.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Crown,
  Users,
  Eye,
  AlertCircle,
  RotateCw,
  Clock,
  Mail,
  X,
  Check,
} from "lucide-react";
import { getPendingInvites, cancelInvitation } from "../../api/workspace";
import { useToast } from "../../hooks/useToast";

// ── Role → icon + tone mapping, aligned with InviteMemberModal ──
const ROLE_INFO = {
  admin: { Icon: Crown, label: "Admin", tone: "accent" },
  member: { Icon: Users, label: "Member", tone: "info" },
  viewer: { Icon: Eye, label: "Viewer", tone: "neutral" },
};

function roleInfo(role) {
  return ROLE_INFO[role] ?? ROLE_INFO.viewer;
}

// ── Days remaining until expiry ──
function expiryInfo(expiresAt) {
  if (!expiresAt) return { label: "N/A", tone: "neutral", expired: false, soon: false };
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0)
    return { label: "Expired", tone: "danger", expired: true, soon: false };
  if (diffDays === 1)
    return { label: "Expires tomorrow", tone: "warning", expired: false, soon: true };
  if (diffDays <= 3)
    return { label: `Expires in ${diffDays}d`, tone: "warning", expired: false, soon: true };
  return {
    label: `Expires ${new Date(expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
    tone: "neutral",
    expired: false,
    soon: false,
  };
}

// ── Avatar initials from email local-part ──
function emailInitials(email) {
  if (!email) return "?";
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

export default function PendingInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const { success, error: toastError } = useToast();

  const confirmRef = useRef(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getPendingInvites();
      setInvites(res.data.invitations || []);
    } catch (err) {
      console.error("Failed to load pending invites", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCancel = async (id) => {
    setCancelingId(id);
    try {
      await cancelInvitation(id);
      success("Invitation cancelled");
      fetchInvites();
    } catch (err) {
      toastError("Failed to cancel invitation");
    } finally {
      setCancelingId(null);
      setConfirmId(null);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  // Move focus to the Confirm button when the inline confirm appears
  useEffect(() => {
    if (confirmId && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [confirmId]);

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <section className="pi-section">
        <div className="pi-header">
          <div className="flex items-center gap-2.5">
            <span className="pi-header-icon">
              <Mail size={13} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div className="space-y-1.5">
              <span className="pi-skeleton block h-3 w-28 rounded" />
              <span className="pi-skeleton block h-2 w-20 rounded" />
            </div>
          </div>
        </div>
        <div className="space-y-2 p-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="pi-row-skeleton">
              <span className="pi-skeleton h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <span className="pi-skeleton block h-3 w-40 rounded" />
                <span className="pi-skeleton block h-2.5 w-24 rounded" />
              </div>
              <span className="pi-skeleton h-7 w-16 shrink-0 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* ─── ERROR ─── */
  if (error) {
    return (
      <section className="pi-section">
        <div className="pi-header">
          <div className="flex items-center gap-2.5">
            <span className="pi-header-icon">
              <Mail size={13} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              Pending invitations
            </p>
          </div>
        </div>
        <div className="pi-error">
          <span className="pi-error-icon">
            <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Couldn't load pending invites
            </p>
            <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">
              Something went wrong while fetching invitations.
            </p>
          </div>
          <button type="button" onClick={fetchInvites} className="pi-retry">
            <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" />
            Retry
          </button>
        </div>
      </section>
    );
  }

  /* ─── EMPTY ─── */
  if (invites.length === 0) {
    return (
      <section className="pi-section">
        <div className="pi-header">
          <div className="flex items-center gap-2.5">
            <span className="pi-header-icon">
              <Mail size={13} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              Pending invitations
            </p>
          </div>
        </div>
        <div className="pi-empty">
          <span className="pi-empty-icon">
            <Users size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            No pending invitations
          </p>
          <p className="max-w-xs text-xs text-[var(--text-muted)]">
            Invitations you send will appear here until they're accepted or
            expire.
          </p>
        </div>
      </section>
    );
  }

  /* ─── DATA ─── */
  return (
    <section className="pi-section">
      {/* Header */}
      <div className="pi-header">
        <div className="flex items-center gap-2.5">
          <span className="pi-header-icon">
            <Mail size={13} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              Pending invitations
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
              Awaiting acceptance
            </p>
          </div>
        </div>
        <span className="pi-count-pill">
          {invites.length} pending
        </span>
      </div>

      {/* List */}
      <div className="space-y-2 p-3">
        {invites.map((inv, i) => {
          const { Icon: RoleIcon, label: roleLabel, tone: roleTone } = roleInfo(inv.role);
          const expiry = expiryInfo(inv.expiresAt);
          const isConfirming = confirmId === inv._id;
          const isCanceling = cancelingId === inv._id;

          return (
            <div
              key={inv._id}
              className={`pi-row ${isConfirming ? "is-confirming" : ""}`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3">
                {/* Left: avatar + email + chips */}
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`pi-avatar tone-${roleTone}`}>
                    {emailInitials(inv.email)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                      {inv.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`pi-chip tone-${roleTone}`}>
                        <RoleIcon size={9} strokeWidth={2.4} aria-hidden="true" />
                        {roleLabel}
                      </span>
                      <span className={`pi-chip tone-${expiry.tone}`}>
                        <Clock size={9} strokeWidth={2.4} aria-hidden="true" />
                        {expiry.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: actions */}
                {!isConfirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirmId(inv._id)}
                    className="pi-cancel-btn"
                    aria-label={`Cancel invitation for ${inv.email}`}
                  >
                    <X size={12} strokeWidth={2.4} aria-hidden="true" />
                    Cancel
                  </button>
                ) : (
                  <div className="pi-confirm-group">
                    <button
                      ref={confirmRef}
                      type="button"
                      onClick={() => handleCancel(inv._id)}
                      disabled={isCanceling}
                      className="pi-confirm-btn"
                    >
                      {isCanceling ? (
                        <span className="pi-spinner" aria-hidden="true" />
                      ) : (
                        <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {isCanceling ? "Canceling…" : "Confirm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      disabled={isCanceling}
                      className="pi-keep-btn"
                    >
                      Keep
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* ─── Shell ─────────────────────────────────────────── */
        .pi-section {
          margin-top: 20px;
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid var(--border-light);
          background: var(--bg-card);
          box-shadow:
            0 1px 0 0 color-mix(in srgb, var(--accent) 6%, transparent) inset,
            0 12px 32px -20px rgba(0, 0, 0, 0.4);
        }

        /* ─── Header ────────────────────────────────────────── */
        .pi-header {
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

        .pi-header-icon {
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

        .pi-count-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
          color: var(--accent);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ─── Rows ──────────────────────────────────────────── */
        .pi-row {
          position: relative;
          border-radius: 11px;
          border: 1px solid var(--border-light);
          background: var(--bg-primary);
          transition:
            border-color 0.2s ease,
            background-color 0.2s ease,
            transform 0.2s ease;
          animation: pi-row-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes pi-row-in {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pi-row:hover {
          border-color: color-mix(in srgb, var(--accent) 28%, var(--border-light));
          background: color-mix(in srgb, var(--accent) 3%, var(--bg-primary));
        }
        .pi-row.is-confirming {
          border-color: color-mix(in srgb, var(--color-danger) 35%, var(--border-light));
          background:
            linear-gradient(
              90deg,
              color-mix(in srgb, var(--color-danger) 5%, transparent),
              color-mix(in srgb, var(--color-danger) 2%, transparent)
            ),
            var(--bg-primary);
        }

        /* ─── Avatar ────────────────────────────────────────── */
        .pi-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 999px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
          box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 25%, transparent) inset;
        }
        .pi-avatar.tone-accent {
          color: var(--accent);
          background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--accent) 22%, transparent),
            color-mix(in srgb, var(--accent) 6%, transparent)
          );
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent),
            0 0 12px -4px color-mix(in srgb, var(--accent) 45%, transparent);
        }
        .pi-avatar.tone-info {
          color: var(--accent-secondary, #60a5fa);
          background: linear-gradient(
            135deg,
            rgba(96, 165, 250, 0.22),
            rgba(96, 165, 250, 0.06)
          );
          box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.28);
        }
        .pi-avatar.tone-neutral {
          color: var(--text-secondary);
          background: var(--bg-hover);
          box-shadow: 0 0 0 1px var(--border-light);
        }

        /* ─── Chips ─────────────────────────────────────────── */
        .pi-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border-radius: 5px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.02em;
          white-space: nowrap;
          border: 1px solid transparent;
        }
        .pi-chip.tone-accent {
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border-color: color-mix(in srgb, var(--accent) 28%, transparent);
        }
        .pi-chip.tone-info {
          color: var(--accent-secondary, #60a5fa);
          background: rgba(96, 165, 250, 0.1);
          border-color: rgba(96, 165, 250, 0.28);
        }
        .pi-chip.tone-warning {
          color: var(--color-warning, #f59e0b);
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.28);
        }
        .pi-chip.tone-danger {
          color: var(--color-danger);
          background: color-mix(in srgb, var(--color-danger) 10%, transparent);
          border-color: color-mix(in srgb, var(--color-danger) 28%, transparent);
        }
        .pi-chip.tone-neutral {
          color: var(--text-muted);
          background: var(--bg-hover);
          border-color: var(--border-light);
        }

        /* ─── Cancel button ─────────────────────────────────── */
        .pi-cancel-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 11px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid var(--border-light);
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .pi-cancel-btn:hover {
          color: var(--color-danger);
          border-color: color-mix(in srgb, var(--color-danger) 40%, var(--border-light));
          background: color-mix(in srgb, var(--color-danger) 8%, transparent);
        }
        .pi-cancel-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger) 22%, transparent);
        }
        .pi-cancel-btn:active {
          transform: scale(0.97);
        }

        /* ─── Confirm group ─────────────────────────────────── */
        .pi-confirm-group {
          display: flex;
          align-items: center;
          gap: 6px;
          animation: pi-confirm-in 0.2s ease-out;
        }
        @keyframes pi-confirm-in {
          from { opacity: 0; transform: translateX(4px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .pi-confirm-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 11px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          background: var(--color-danger);
          border: none;
          box-shadow: 0 6px 16px -8px color-mix(in srgb, var(--color-danger) 70%, transparent);
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .pi-confirm-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 10px 20px -8px color-mix(in srgb, var(--color-danger) 80%, transparent);
        }
        .pi-confirm-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger) 30%, transparent);
        }
        .pi-confirm-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.97);
        }
        .pi-confirm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pi-spinner {
          display: inline-block;
          width: 11px;
          height: 11px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          animation: pi-spin 0.7s linear infinite;
        }
        @keyframes pi-spin {
          to { transform: rotate(360deg); }
        }

        .pi-keep-btn {
          padding: 6px 11px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .pi-keep-btn:hover:not(:disabled) {
          color: var(--text-primary);
          background: var(--bg-hover);
          border-color: color-mix(in srgb, var(--text-primary) 20%, var(--border-light));
        }
        .pi-keep-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
        }
        .pi-keep-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .pi-keep-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ─── Error / Empty ─────────────────────────────────── */
        .pi-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px 16px;
          text-align: center;
        }
        .pi-error-icon {
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
        .pi-retry {
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
        .pi-retry:hover {
          background: color-mix(in srgb, var(--color-danger) 10%, transparent);
        }
        .pi-retry:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger) 25%, transparent);
        }
        .pi-retry:active {
          transform: scale(0.97);
        }

        .pi-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 36px 16px;
          text-align: center;
        }
        .pi-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          color: var(--accent);
        }

        /* ─── Skeletons ─────────────────────────────────────── */
        .pi-skeleton {
          background: linear-gradient(
            90deg,
            var(--bg-hover) 25%,
            color-mix(in srgb, var(--bg-hover) 60%, var(--accent)) 50%,
            var(--bg-hover) 75%
          );
          background-size: 200% 100%;
          animation: pi-shimmer 1.4s ease-in-out infinite;
        }
        @keyframes pi-shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }

        .pi-row-skeleton {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 11px;
          border: 1px solid var(--border-light);
          background: var(--bg-primary);
        }

        /* ─── Reduced motion ────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .pi-row,
          .pi-confirm-group,
          .pi-spinner,
          .pi-skeleton {
            animation: none;
          }
          .pi-confirm-btn:hover:not(:disabled),
          .pi-cancel-btn:hover {
            transform: none;
          }
        }
      ` }} />
    </section>
  );
}