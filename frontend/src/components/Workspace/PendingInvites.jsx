import { useEffect, useState } from "react";
import { getPendingInvites, cancelInvitation } from "../../api/workspace";
import { useToast } from "../../hooks/useToast";

// ── Role → icon/accent mapping, consistent with InviteMemberModal ──
function roleBadge(role) {
  const map = {
    admin: { icon: "◆", cls: "border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]" },
    member: { icon: "◈", cls: "border-[var(--accent-secondary)]/20 bg-[var(--accent-secondary-soft)] text-[var(--accent-secondary)]" },
    viewer: { icon: "◇", cls: "border-[var(--border-light)] bg-[var(--bg-hover)] text-[var(--text-secondary)]" },
  };
  return map[role] ?? map.viewer;
}

// ── Days remaining until expiry, with an "expiring soon" flag ──
function expiryInfo(expiresAt) {
  if (!expiresAt) return { label: "N/A", soon: false, expired: false };
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return { label: "Expired", soon: false, expired: true };
  if (diffDays === 1) return { label: "Expires tomorrow", soon: true, expired: false };
  if (diffDays <= 3) return { label: `Expires in ${diffDays}d`, soon: true, expired: false };
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
  const [cancelingId, setCancelingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
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
    setCancelingId(token);
    try {
      await cancelInvitation(token);
      success("Invitation cancelled");
      fetchInvites();
    } catch (err) {
      error("Failed to cancel invitation");
    } finally {
      setCancelingId(null);
      setConfirmId(null);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const styleBlock = (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      @keyframes invite-row-fade {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes invite-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes invite-confirm-in {
        from { opacity: 0; transform: scale(0.97); }
        to { opacity: 1; transform: scale(1); }
      }
      .pending-invite-row {
        animation: invite-row-fade 0.25s ease-out both;
      }
      .pending-invite-skeleton {
        background: linear-gradient(
          90deg,
          var(--bg-hover) 25%,
          var(--border-light) 50%,
          var(--bg-hover) 75%
        );
        background-size: 200% 100%;
        animation: invite-shimmer 1.6s ease-in-out infinite;
      }
      .pending-invite-confirm {
        animation: invite-confirm-in 0.15s ease-out;
      }
      @media (prefers-reduced-motion: reduce) {
        .pending-invite-row,
        .pending-invite-confirm { animation: none; }
        .pending-invite-skeleton { animation: none; }
      }
    `,
      }}
    />
  );

  if (loading) {
    return (
      <div className="mt-4 space-y-2">
        {styleBlock}
        <h4 className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Pending Invites
        </h4>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] p-3"
          >
            <span className="h-8 w-8 shrink-0 rounded-full pending-invite-skeleton" />
            <div className="flex-1 space-y-1.5">
              <span className="block h-3 w-36 rounded pending-invite-skeleton" />
              <span className="block h-2.5 w-48 rounded pending-invite-skeleton" />
            </div>
            <span className="h-6 w-16 shrink-0 rounded-lg pending-invite-skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="mt-4">
        {styleBlock}
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-8 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
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

  return (
    <div className="mt-4 space-y-2">
      {styleBlock}
      <h4 className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        Pending Invites
        <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--accent)]">
          {invites.length}
        </span>
      </h4>

      {invites.map((inv, i) => {
        const role = roleBadge(inv.role);
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
                      <span>{role.icon}</span>
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
                      />
                      {expiry.label}
                    </span>
                  </div>
                </div>
              </div>

              {!isConfirming ? (
                <button
                  onClick={() => setConfirmId(inv._id)}
                  className="shrink-0 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition-all duration-150 hover:bg-[var(--color-danger)]/20 active:scale-[0.97]"
                >
                  Cancel
                </button>
              ) : (
                <div className="pending-invite-confirm flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => handleCancel(inv._id)}
                    disabled={isCanceling}
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--color-danger)] px-2.5 py-1.5 text-xs font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
                  >
                    {isCanceling ? (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      "Confirm"
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    disabled={isCanceling}
                    className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] disabled:opacity-50"
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