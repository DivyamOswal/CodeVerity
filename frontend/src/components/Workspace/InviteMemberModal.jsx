// src/components/Workspace/InviteMemberModal.jsx
import { useState, useRef, useEffect } from "react";
import {
  UserPlus,
  Mail,
  ArrowRight,
  Check,
  X,
  Crown,
  Users,
  Eye,
  Loader2,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { createInvitation } from "../../api/workspace";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_INFO = {
  admin: {
    Icon: Crown,
    label: "Admin",
    desc: "Full access, including workspace settings",
  },
  member: {
    Icon: Users,
    label: "Member",
    desc: "Can create and manage repository scans",
  },
  viewer: {
    Icon: Eye,
    label: "Viewer",
    desc: "Read-only access to reports",
  },
};

export default function InviteMemberModal({ onClose, onSuccess }) {
  const [input, setInput] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const { success, error } = useToast();

  const textareaRef = useRef(null);

  // Auto-focus the textarea when the modal mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Escape key closes the modal (unless a request is in flight)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [loading, onClose]);

  const parseEmails = (raw) =>
    Array.from(
      new Set(
        raw
          .split(/[\s,;]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
      )
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emails = parseEmails(input);

    if (emails.length === 0) {
      error("Enter at least one email address");
      return;
    }

    const invalidLocal = emails.filter((e) => !EMAIL_RE.test(e));
    if (invalidLocal.length === emails.length) {
      error("No valid email addresses found");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const res = await createInvitation({ emails, role });
      const r = res.data.results || [];
      setResults(r);

      const sent = r.filter((x) => x.status === "sent").length;
      const failed = r.filter((x) => x.status === "failed").length;

      if (sent > 0) onSuccess?.();

      if (failed === 0) {
        success(`${sent} invite${sent > 1 ? "s" : ""} sent`);
        onClose();
      } else if (sent === 0) {
        error(`All ${failed} invite${failed > 1 ? "s" : ""} failed`);
      } else {
        success(`${sent} sent, ${failed} failed`);
      }
    } catch (err) {
      error(err.response?.data?.error || "Failed to send invites");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const emailCount = input.trim() ? parseEmails(input).length : 0;
  const CurrentRoleIcon = ROLE_INFO[role].Icon;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
        className="invite-modal-panel relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-2xl shadow-[var(--accent-soft-strong)]"
      >
        {/* Corner brackets */}
        <span className="pointer-events-none absolute -left-px -top-px z-10 h-4 w-4 rounded-tl-2xl border-l-2 border-t-2 border-[var(--accent)]/50" />
        <span className="pointer-events-none absolute -right-px -top-px z-10 h-4 w-4 rounded-tr-2xl border-r-2 border-t-2 border-[var(--accent)]/50" />

        {/* Ambient accent glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-50 blur-3xl"
        />

        <div className="relative p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent-soft-strong)]">
              <UserPlus size={18} strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3
                id="invite-modal-title"
                className="text-lg font-semibold text-[var(--text-primary)]"
              >
                Invite Members
              </h3>
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                Add one or many emails, separated by commas or new lines.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <Mail
                  size={12}
                  strokeWidth={2.2}
                  aria-hidden="true"
                  className="text-[var(--accent)]"
                />
                Emails
              </label>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
                placeholder={"alice@company.com, bob@company.com\ncharlie@company.com"}
                className="mt-1.5 w-full resize-y rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
                required
              />
              {input.trim() && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
                  {emailCount} email{emailCount === 1 ? "" : "s"} detected
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <CurrentRoleIcon
                  size={12}
                  strokeWidth={2.2}
                  aria-hidden="true"
                  className="text-[var(--accent)]"
                />
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
              >
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                {ROLE_INFO[role].desc}
              </p>
            </div>

            {results && (
              <div className="no-scrollbar max-h-48 overflow-y-auto rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
                  Results
                </p>
                <ul className="space-y-1.5">
                  {results.map((r, i) => (
                    <li
                      key={r.email}
                      className="invite-result-row flex flex-wrap items-center gap-2 rounded-md border border-[var(--border-dark)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          r.status === "sent"
                            ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                            : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                        }`}
                      >
                        {r.status === "sent" ? (
                          <Check size={9} strokeWidth={3} aria-hidden="true" />
                        ) : (
                          <X size={9} strokeWidth={3} aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[var(--text-primary)]">
                        {r.email}
                      </span>
                      {r.error && (
                        <span className="w-full pl-6 text-[10px] text-[var(--color-danger)] sm:w-auto sm:pl-0">
                          {r.error}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_8px_20px_-8px_var(--accent-soft-strong)] transition-all duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={14}
                      strokeWidth={2.4}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                    Sending…
                  </>
                ) : (
                  <>
                    <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
                    Send Invites
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              >
                {results ? "Close" : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}