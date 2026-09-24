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
  Command,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { createInvitation } from "../../api/workspace";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_INFO = {
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
  admin: {
    Icon: Crown,
    label: "Admin",
    desc: "Full access, including workspace settings",
  },
};

export default function InviteMemberModal({ onClose, onSuccess }) {
  const [input, setInput] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const { success, error } = useToast();

  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

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

  const parsedEmails = parseEmails(input);
  const emailCount = parsedEmails.length;
  const sentCount = results?.filter((r) => r.status === "sent").length || 0;
  const failedCount = results?.filter((r) => r.status === "failed").length || 0;

  return (
    <div
      onClick={handleBackdropClick}
      className="invite-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Ambient backdrop glow behind the panel */}
      <div aria-hidden="true" className="invite-backdrop-glow" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
        className="invite-modal relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]"
      >
        {/* Top accent line */}
        <div aria-hidden="true" className="invite-top-line" />

        {/* Corner brackets (top) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-px -top-px z-10 h-4 w-4 rounded-tl-2xl border-l-2 border-t-2 border-[var(--accent)]/60"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-px -top-px z-10 h-4 w-4 rounded-tr-2xl border-r-2 border-t-2 border-[var(--accent)]/60"
        />

        {/* Ambient accent glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-50 blur-3xl"
        />

        <div className="relative p-6">
          {/* ─── Header ─────────────────────────────────────────── */}
          <div className="flex items-start gap-3.5">
            <span className="invite-icon-badge">
              <UserPlus size={18} strokeWidth={2} aria-hidden="true" />
              <span aria-hidden="true" className="invite-icon-ring" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3
                  id="invite-modal-title"
                  className="text-lg font-bold tracking-tight text-[var(--text-primary)]"
                >
                  Invite members
                </h3>
                <span className="invite-esc-hint">
                  <Command size={9} strokeWidth={2.5} aria-hidden="true" />
                  esc
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-muted)]">
                Add one or many emails, separated by commas or new lines.
              </p>
            </div>
          </div>

          {/* ─── Form ───────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Email input */}
            <div>
              <label
                htmlFor="invite-emails"
                className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]"
              >
                <Mail
                  size={11}
                  strokeWidth={2.2}
                  aria-hidden="true"
                  className="text-[var(--accent)]"
                />
                Email addresses
              </label>
              <div className="relative mt-2">
                <textarea
                  id="invite-emails"
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={4}
                  placeholder={"alice@company.com, bob@company.com\ncharlie@company.com"}
                  className="invite-textarea"
                  required
                />
                {emailCount > 0 && (
                  <span className="invite-count-badge">
                    <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
                    {emailCount} {emailCount === 1 ? "email" : "emails"}
                  </span>
                )}
              </div>
            </div>

            {/* Role selector — three cards */}
            <div>
              <label className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                <Users
                  size={11}
                  strokeWidth={2.2}
                  aria-hidden="true"
                  className="text-[var(--accent)]"
                />
                Role
              </label>

              <div
                role="group"
                aria-label="Select a role"
                className="mt-2 grid grid-cols-3 gap-2"
              >
                {Object.entries(ROLE_INFO).map(([key, { Icon, label }]) => {
                  const active = role === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRole(key)}
                      aria-pressed={active}
                      className={`invite-role-card ${active ? "is-active" : ""}`}
                    >
                      <Icon
                        size={16}
                        strokeWidth={active ? 2.4 : 2}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
                {ROLE_INFO[role].desc}
              </p>
            </div>

            {/* ─── Results ─────────────────────────────────────── */}
            {results && (
              <div className="invite-results">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Results
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sentCount > 0 && (
                      <span className="invite-result-pill invite-result-pill-ok">
                        <Check size={9} strokeWidth={3} aria-hidden="true" />
                        {sentCount} sent
                      </span>
                    )}
                    {failedCount > 0 && (
                      <span className="invite-result-pill invite-result-pill-fail">
                        <X size={9} strokeWidth={3} aria-hidden="true" />
                        {failedCount} failed
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-1.5">
                  {results.map((r, i) => (
                    <li
                      key={r.email}
                      className="invite-result-row"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <span
                        className={`invite-result-icon ${
                          r.status === "sent" ? "is-ok" : "is-fail"
                        }`}
                      >
                        {r.status === "sent" ? (
                          <Check size={9} strokeWidth={3} aria-hidden="true" />
                        ) : (
                          <X size={9} strokeWidth={3} aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[var(--text-primary)]">
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

            {/* ─── Actions ─────────────────────────────────────── */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="invite-btn-primary group"
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
                    Send invites
                    <ArrowRight
                      size={14}
                      strokeWidth={2.4}
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="invite-btn-secondary"
              >
                {results ? "Close" : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* ─── Backdrop ─────────────────────────────────────── */
        .invite-backdrop {
          background: rgba(0, 0, 0, 0.62);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: invite-backdrop-in 0.2s ease-out;
        }
        @keyframes invite-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .invite-backdrop-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 560px;
          height: 560px;
          border-radius: 9999px;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--accent) 22%, transparent) 0%,
            transparent 60%
          );
          pointer-events: none;
          filter: blur(40px);
          opacity: 0.55;
        }

        /* ─── Modal panel ──────────────────────────────────── */
        .invite-modal {
          box-shadow:
            0 30px 80px -30px rgba(0, 0, 0, 0.7),
            0 0 0 1px color-mix(in srgb, var(--accent) 12%, transparent),
            0 0 60px -20px color-mix(in srgb, var(--accent) 45%, transparent);
          animation: invite-modal-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes invite-modal-in {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .invite-top-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--accent) 50%,
            transparent 100%
          );
          opacity: 0.85;
        }

        /* ─── Header icon ──────────────────────────────────── */
        .invite-icon-badge {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 12px;
          background: var(--accent);
          color: var(--accent-contrast);
          box-shadow:
            0 8px 20px -8px color-mix(in srgb, var(--accent) 60%, transparent),
            0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent);
        }

        .invite-icon-ring {
          position: absolute;
          inset: -4px;
          border-radius: 16px;
          border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
          animation: invite-icon-pulse 2.6s ease-out infinite;
          pointer-events: none;
        }
        @keyframes invite-icon-pulse {
          0%   { transform: scale(0.94); opacity: 0.8; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        .invite-esc-hint {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 6px;
          border-radius: 5px;
          border: 1px solid var(--border-light);
          background: var(--bg-primary);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        /* ─── Textarea ─────────────────────────────────────── */
        .invite-textarea {
          display: block;
          width: 100%;
          resize: vertical;
          min-height: 96px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--border-light);
          background: var(--bg-input, var(--bg-primary));
          color: var(--text-primary);
          font-size: 13px;
          line-height: 1.5;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .invite-textarea::placeholder {
          color: var(--text-muted);
          opacity: 0.7;
        }
        .invite-textarea:hover {
          border-color: color-mix(in srgb, var(--accent) 30%, var(--border-light));
        }
        .invite-textarea:focus {
          border-color: var(--accent);
          box-shadow:
            0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent),
            0 0 24px -8px color-mix(in srgb, var(--accent) 50%, transparent);
        }

        .invite-count-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 14%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 600;
          color: var(--accent);
          letter-spacing: 0.02em;
          pointer-events: none;
        }

        /* ─── Role cards ───────────────────────────────────── */
        .invite-role-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 11px 6px;
          border-radius: 11px;
          border: 1px solid var(--border-light);
          background: var(--bg-primary);
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.01em;
          transition:
            color 0.15s ease,
            border-color 0.15s ease,
            background-color 0.15s ease,
            transform 0.15s ease,
            box-shadow 0.15s ease;
          cursor: pointer;
        }
        .invite-role-card:hover:not(.is-active) {
          color: var(--text-primary);
          border-color: color-mix(in srgb, var(--accent) 40%, var(--border-light));
          transform: translateY(-1px);
        }
        .invite-role-card:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
        }
        .invite-role-card.is-active {
          color: var(--accent);
          border-color: var(--accent);
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          box-shadow:
            0 0 0 1px var(--accent) inset,
            0 8px 20px -12px color-mix(in srgb, var(--accent) 60%, transparent);
        }

        /* ─── Results ──────────────────────────────────────── */
        .invite-results {
          max-height: 200px;
          overflow-y: auto;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--border-light);
          background: var(--bg-primary);
        }
        .invite-results::-webkit-scrollbar { width: 6px; }
        .invite-results::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--accent) 30%, transparent);
          border-radius: 3px;
        }

        .invite-result-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 999px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .invite-result-pill-ok {
          color: var(--color-success);
          background: color-mix(in srgb, var(--color-success) 14%, transparent);
          border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
        }
        .invite-result-pill-fail {
          color: var(--color-danger);
          background: color-mix(in srgb, var(--color-danger) 14%, transparent);
          border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
        }

        .invite-result-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 7px;
          border: 1px solid var(--border-dark, var(--border-light));
          background: var(--bg-card);
          animation: invite-row-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes invite-row-in {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .invite-result-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          border-radius: 999px;
        }
        .invite-result-icon.is-ok {
          color: var(--color-success);
          background: color-mix(in srgb, var(--color-success) 18%, transparent);
        }
        .invite-result-icon.is-fail {
          color: var(--color-danger);
          background: color-mix(in srgb, var(--color-danger) 18%, transparent);
        }

        /* ─── Buttons ──────────────────────────────────────── */
        .invite-btn-primary {
          display: flex;
          flex: 1;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--accent-contrast);
          background: var(--accent);
          box-shadow: 0 10px 24px -10px color-mix(in srgb, var(--accent) 65%, transparent);
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .invite-btn-primary:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 14px 28px -10px color-mix(in srgb, var(--accent) 75%, transparent);
        }
        .invite-btn-primary:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        .invite-btn-primary:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent);
        }
        .invite-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .invite-btn-secondary {
          flex: 1;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .invite-btn-secondary:hover:not(:disabled) {
          color: var(--text-primary);
          background: var(--bg-hover);
          border-color: color-mix(in srgb, var(--text-primary) 20%, var(--border-light));
        }
        .invite-btn-secondary:active:not(:disabled) {
          transform: scale(0.98);
        }
        .invite-btn-secondary:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
        }
        .invite-btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ─── Reduced motion ───────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .invite-backdrop,
          .invite-modal,
          .invite-result-row,
          .invite-icon-ring {
            animation: none;
          }
          .invite-role-card:hover:not(.is-active),
          .invite-btn-primary:hover:not(:disabled) {
            transform: none;
          }
        }
      ` }} />
    </div>
  );
}