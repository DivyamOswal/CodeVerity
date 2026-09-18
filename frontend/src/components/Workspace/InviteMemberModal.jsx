import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { createInvitation } from "../../api/workspace";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InviteMemberModal({ onClose, onSuccess }) {
  const [input, setInput] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const { success, error } = useToast();

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

  const emailCount = input.trim() ? parseEmails(input).length : 0;

  const roleInfo = {
    admin: { icon: "◆", desc: "Full access, including workspace settings" },
    member: { icon: "◈", desc: "Can create and manage repository scans" },
    viewer: { icon: "◇", desc: "Read-only access to reports" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes invite-modal-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes invite-row-in {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .invite-modal-panel {
          animation: invite-modal-in 0.22s ease-out;
        }
        .invite-result-row {
          animation: invite-row-in 0.18s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .invite-modal-panel,
          .invite-result-row { animation: none; }
        }
      `,
        }}
      />

      <div className="invite-modal-panel relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-2xl shadow-[var(--accent-soft-strong)]">
        {/* Corner brackets, consistent with Result.jsx / Home.jsx accents */}
        <span className="pointer-events-none absolute -top-px -left-px z-10 h-4 w-4 rounded-tl-2xl border-l-2 border-t-2 border-[var(--accent)]/50" />
        <span className="pointer-events-none absolute -top-px -right-px z-10 h-4 w-4 rounded-tr-2xl border-r-2 border-t-2 border-[var(--accent)]/50" />

        {/* Ambient accent glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-50 blur-3xl"
        />

        <div className="relative p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent-soft-strong)]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
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
                <span className="text-[var(--accent)]">✉</span>
                Emails
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
                placeholder={"alice@company.com, bob@company.com\ncharlie@company.com"}
                className="mt-1.5 w-full resize-y rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
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
                <span className="text-[var(--accent)]">{roleInfo[role].icon}</span>
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              >
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                {roleInfo[role].desc}
              </p>
            </div>

            {results && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3">
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
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                          r.status === "sent"
                            ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                            : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                        }`}
                      >
                        {r.status === "sent" ? "✓" : "✕"}
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
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_8px_20px_-8px_var(--accent-soft-strong)] transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--accent-contrast)]/40 border-t-[var(--accent-contrast)]" />
                    Sending…
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">→</span>
                    Send Invites
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.98]"
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