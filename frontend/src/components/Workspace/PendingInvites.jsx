// src/components/Workspace/PendingInvites.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { Crown, Users, Eye, AlertCircle, RotateCw } from "lucide-react";
import { getPendingInvites, cancelInvitation } from "../../api/workspace";
import { useToast } from "../../hooks/useToast";

// ── Role → icon + accent mapping, matching InviteMemberModal ──
const ROLE_BADGES = {
  admin: {
    Icon: Crown,
    cls: "border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]",
  },
  member: {
    Icon: Users,
    cls: "border-[var(--accent-secondary)]/20 bg-[var(--accent-secondary-soft)] text-[var(--accent-secondary)]",
  },
  viewer: {
    Icon: Eye,
    cls: "border-[var(--border-light)] bg-[var(--bg-hover)] text-[var(--text-secondary)]",
  },
};

function roleBadge(role) {
  return ROLE_BADGES[role] ?? ROLE_BADGES.viewer;
}

// ── Days remaining until expiry ──
function expiryInfo(expiresAt) {
  if (!expiresAt) return { label: "N/A", soon: false, expired: false };
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return { label: "Expired", soon: false, expired: true };
  if (diffDays === 1)
    return { label: "Expires tomorrow", soon: true, expired: false };
  if (diffDays <= 3)
    return { label: `Expires in ${diffDays}d`, soon: true, expired: false };
  return {
    label: `Expires ${new Date(expiresAt).toLocaleDateString()}`,
    soon: false,
    expired: false,
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
      <div className="mt-4 space-y-2">
        <h4 className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Pending Invites
        </h4>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] p-3"
          >
            <span className="pending-invite-skeleton h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <span className="pending-invite-skeleton block h-3 w-36 rounded" />
              <span className="pending-invite-skeleton block h-2.5 w-48 rounded" />
            </div>
            <span className="pending-invite-skeleton h-6 w-16 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  /* ─── ERROR ─── */
  if (error) {
    return (
      <div className="mt-4 space-y-2">
        <h4 className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Pending Invites
        </h4>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-4 py-8 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)] ring-1 ring-[var(--color-danger)]/30">
            <AlertCircle size={16} strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Couldn't load pending invites
            </p>
            <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">
              Something went wrong while fetching invitations.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchInvites}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition-all duration-150 hover:bg-[var(--color-danger)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97]"
          >
            <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ─── EMPTY ─── */
  if (invites.length === 0) {
    return (
      <div className="mt-4">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-8 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <Users size={16} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            No pending invitations
          </p>
          <p className="max-w-xs text-xs text-[var(--text-muted)]">
            Invitations you send will appear here until they're accepted or
            expire.
          </p>
        </div>
      </div>
    );
  }

  /* ─── DATA ─── */
  return (
    <div className="mt-4 space-y-2">
      <h4 className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        Pending Invites
        <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--accent)]">
          {invites.length}
        </span>
      </h4>

      {invites.map((inv, i) => {
        const role = roleBadge(inv.role);
        const RoleIcon = role.Icon;
        const expiry = expiryInfo(inv.expiresAt);
        const isConfirming = confirmId === inv._id;
        const isCanceling = cancelingId === inv._id;

        return (
          <div
            key={inv._id}
            className="pending-invite-row overflow-hidden rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] transition-colors duration-150 hover:border-[var(--accent)]/25"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-mono text-[10px] font-bold text-[var(--accent)] ring-1 ring-[var(--accent)]/20">
                  {emailInitials(inv.email)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-[var(--text-primary)]">
                    {inv.email}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-medium ${role.cls}`}
                    >
                      <RoleIcon size={9} strokeWidth={2.2} aria-hidden="true" />
                      {inv.role}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] ${
                        expiry.expired
                          ? "text-[var(--color-danger)]"
                          : expiry.soon
                            ? "text-[var(--color-warning)]"
                            : "text-[var(--text-muted)]"
                      }`}
                    >
                      <span
                        className={`h-1 w-1 rounded-full ${
                          expiry.expired
                            ? "bg-[var(--color-danger)]"
                            : expiry.soon
                              ? "bg-[var(--color-warning)]"
                              : "bg-[var(--text-muted)]"
                        }`}
                        aria-hidden="true"
                      />
                      {expiry.label}
                    </span>
                  </div>
                </div>
              </div>

              {!isConfirming ? (
                <button
                  type="button"
                  onClick={() => setConfirmId(inv._id)}
                  className="shrink-0 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition-all duration-150 hover:bg-[var(--color-danger)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.97]"
                >
                  Cancel
                </button>
              ) : (
                <div className="pending-invite-confirm flex shrink-0 items-center gap-1.5">
                  <button
                    ref={confirmRef}
                    type="button"
                    onClick={() => handleCancel(inv._id)}
                    disabled={isCanceling}
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--color-danger)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-danger-contrast)] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.97] disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100"
                  >
                    {isCanceling ? (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-danger-contrast)]/40 border-t-[var(--color-danger-contrast)]" />
                    ) : (
                      "Confirm"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    disabled={isCanceling}
                    className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
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
  );
}