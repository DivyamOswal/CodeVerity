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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Invite Members
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Add one or many emails, separated by commas or new lines.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">
              Emails
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              placeholder={"alice@company.com, bob@company.com\ncharlie@company.com"}
              className="mt-1 w-full resize-y rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            />
            {input.trim() && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {parseEmails(input).length} email
                {parseEmails(input).length === 1 ? "" : "s"} detected
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">
              Role
            </label>
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

          {results && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Results
              </p>
              <ul className="space-y-1">
                {results.map((r) => (
                  <li
                    key={r.email}
                    className="flex flex-wrap items-baseline gap-2 text-xs"
                  >
                    <span>{r.status === "sent" ? "✅" : "❌"}</span>
                    <span className="font-mono text-[var(--text-primary)]">
                      {r.email}
                    </span>
                    {r.error && (
                      <span className="text-red-400">{r.error}</span>
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
              className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Invites"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              {results ? "Close" : "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}