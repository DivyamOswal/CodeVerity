// src/components/Workspace/TransferOwnership.jsx
import { useState, useId, useRef, useEffect } from "react";
import {
  ArrowLeftRight,
  Loader2,
  ChevronDown,
  Check,
  ShieldAlert,
  UserCog,
} from "lucide-react";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { success, error } = useToast();

  const confirmTitleId = useId();
  const dropdownRef = useRef(null);

  // Close the dropdown on outside click or Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen]);

  const admins = members.filter(
    (m) => m.role === "admin" && m.userId._id !== currentUserId,
  );

  const selectedAdmin = admins.find((a) => a.userId._id === selectedUserId);
  const selectedLabel =
    selectedAdmin?.userId.name || selectedAdmin?.userId.email || "";

  const handleTransfer = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      await transferOwnership(selectedUserId);
      success("Ownership transferred successfully");
      window.location.reload();
    } catch (err) {
      error(err.response?.data?.error || "Transfer failed");
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  if (admins.length === 0) return null;

  return (
    <section className="to-section">
      {/* Hazard stripe on top — signals "sensitive action" */}
      <div aria-hidden="true" className="to-hazard" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="to-icon-badge">
            <ArrowLeftRight size={14} strokeWidth={2.4} aria-hidden="true" />
            <span aria-hidden="true" className="to-icon-pulse" />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-warning)]">
              Transfer ownership
            </h4>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
              Only admins can become owners. This action cannot be undone.
            </p>
          </div>
        </div>

        {!confirming ? (
          /* ─── PICKER STATE ─────────────────────────────────── */
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <div ref={dropdownRef} className="relative flex-1">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                className={`to-dropdown-trigger ${dropdownOpen ? "is-open" : ""}`}
              >
                {selectedAdmin ? (
                  <span className="to-dropdown-value">
                    <span className="to-mini-avatar">
                      {initials(selectedLabel)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-left">
                      {selectedLabel}
                    </span>
                  </span>
                ) : (
                  <span className="to-dropdown-placeholder">
                    Select an admin…
                  </span>
                )}
                <ChevronDown
                  size={14}
                  strokeWidth={2.2}
                  aria-hidden="true"
                  className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div role="listbox" className="to-dropdown-menu">
                  {admins.map((admin) => {
                    const id = admin.userId._id;
                    const label =
                      admin.userId.name || admin.userId.email || "Unknown";
                    const isSelected = id === selectedUserId;

                    return (
                      <button
                        key={id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedUserId(id);
                          setDropdownOpen(false);
                        }}
                        className={`to-dropdown-item ${
                          isSelected ? "is-selected" : ""
                        }`}
                      >
                        <span className="to-mini-avatar">
                          {initials(label)}
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-[13px] font-medium text-[var(--text-primary)]">
                            {admin.userId.name || "—"}
                          </span>
                          {admin.userId.email && (
                            <span className="block truncate font-mono text-[10px] text-[var(--text-muted)]">
                              {admin.userId.email}
                            </span>
                          )}
                        </span>
                        {isSelected && (
                          <Check
                            size={12}
                            strokeWidth={2.6}
                            aria-hidden="true"
                            className="shrink-0 text-[var(--accent)]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!selectedUserId || loading}
              className="to-transfer-btn group"
            >
              <UserCog
                size={14}
                strokeWidth={2.2}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:rotate-6"
              />
              Transfer
            </button>
          </div>
        ) : (
          /* ─── CONFIRM STATE ────────────────────────────────── */
          <div
            role="alertdialog"
            aria-labelledby={confirmTitleId}
            className="to-confirm mt-4"
          >
            <div className="flex items-start gap-3">
              <span className="to-confirm-avatar">
                {initials(selectedLabel)}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  id={confirmTitleId}
                  className="text-[13px] font-semibold text-[var(--text-primary)]"
                >
                  Make{" "}
                  <span className="text-[var(--accent)]">{selectedLabel}</span>{" "}
                  the owner?
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  You'll lose owner privileges and this member will gain full
                  control of the workspace. This cannot be undone.
                </p>

                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTransfer}
                    disabled={loading}
                    className="to-confirm-primary"
                  >
                    {loading ? (
                      <>
                        <Loader2
                          size={12}
                          strokeWidth={2.4}
                          aria-hidden="true"
                          className="animate-spin"
                        />
                        Transferring…
                      </>
                    ) : (
                      <>
                        <ShieldAlert
                          size={12}
                          strokeWidth={2.4}
                          aria-hidden="true"
                        />
                        Yes, transfer ownership
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                    className="to-confirm-cancel"
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
        /* ─── Shell ─────────────────────────────────────────── */
        .to-section {
          position: relative;
          margin-top: 1.25rem;
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid color-mix(in srgb, var(--color-warning) 28%, var(--border-light));
          background:
            radial-gradient(
              ellipse 120% 100% at 0% 0%,
              color-mix(in srgb, var(--color-warning) 8%, transparent) 0%,
              transparent 55%
            ),
            var(--bg-primary);
          box-shadow:
            0 1px 0 0 color-mix(in srgb, var(--color-warning) 15%, transparent) inset,
            0 12px 32px -20px rgba(0, 0, 0, 0.4);
        }

        .to-hazard {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: repeating-linear-gradient(
            135deg,
            var(--color-warning) 0px,
            var(--color-warning) 8px,
            transparent 8px,
            transparent 16px
          );
          opacity: 0.7;
        }

        /* ─── Header icon ───────────────────────────────────── */
        .to-icon-badge {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border-radius: 8px;
          background: color-mix(in srgb, var(--color-warning) 14%, transparent);
          color: var(--color-warning);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-warning) 30%, transparent);
        }

        .to-icon-pulse {
          position: absolute;
          inset: -3px;
          border-radius: 11px;
          border: 1px solid color-mix(in srgb, var(--color-warning) 35%, transparent);
          animation: to-pulse 2.6s ease-out infinite;
          pointer-events: none;
        }
        @keyframes to-pulse {
          0%   { transform: scale(0.92); opacity: 0.85; }
          100% { transform: scale(1.45); opacity: 0; }
        }

        /* ─── Dropdown ──────────────────────────────────────── */
        .to-dropdown-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid var(--border-light);
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 13px;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            background-color 0.15s ease;
          cursor: pointer;
        }
        .to-dropdown-trigger:hover {
          border-color: color-mix(in srgb, var(--accent) 32%, var(--border-light));
        }
        .to-dropdown-trigger:focus-visible {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
        }
        .to-dropdown-trigger.is-open {
          border-color: color-mix(in srgb, var(--accent) 45%, var(--border-light));
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
        }

        .to-dropdown-value,
        .to-dropdown-placeholder {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          flex: 1;
        }
        .to-dropdown-placeholder {
          color: var(--text-muted);
          font-size: 13px;
        }

        .to-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 20;
          max-height: 260px;
          overflow-y: auto;
          padding: 4px;
          border-radius: 11px;
          border: 1px solid var(--border-light);
          background: var(--bg-card);
          box-shadow:
            0 20px 40px -16px rgba(0, 0, 0, 0.55),
            0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent);
          animation: to-menu-in 0.16s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes to-menu-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .to-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          color: var(--text-primary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background-color 0.12s ease;
        }
        .to-dropdown-item:hover {
          background: color-mix(in srgb, var(--accent) 10%, transparent);
        }
        .to-dropdown-item.is-selected {
          background: color-mix(in srgb, var(--accent) 12%, transparent);
        }
        .to-dropdown-item:focus-visible {
          outline: none;
          background: color-mix(in srgb, var(--accent) 14%, transparent);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent) inset;
        }

        /* ─── Mini avatar ───────────────────────────────────── */
        .to-mini-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          flex-shrink: 0;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--accent) 22%, transparent),
            color-mix(in srgb, var(--accent) 6%, transparent)
          );
          color: var(--accent);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.02em;
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent);
        }

        /* ─── Transfer button ───────────────────────────────── */
        .to-transfer-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--accent-contrast);
          background: var(--accent);
          border: none;
          box-shadow: 0 10px 24px -10px color-mix(in srgb, var(--accent) 65%, transparent);
          transition: all 0.15s ease;
          cursor: pointer;
          flex-shrink: 0;
        }
        .to-transfer-btn:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 14px 28px -10px color-mix(in srgb, var(--accent) 75%, transparent);
        }
        .to-transfer-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        .to-transfer-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent);
        }
        .to-transfer-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* ─── Confirm panel ─────────────────────────────────── */
        .to-confirm {
          position: relative;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid color-mix(in srgb, var(--color-warning) 35%, var(--border-light));
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--color-warning) 10%, transparent),
              color-mix(in srgb, var(--color-warning) 3%, transparent)
            ),
            var(--bg-primary);
          box-shadow:
            0 20px 40px -20px color-mix(in srgb, var(--color-warning) 45%, transparent),
            0 1px 0 0 color-mix(in srgb, var(--color-warning) 20%, transparent) inset;
          animation: to-confirm-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes to-confirm-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .to-confirm-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--accent) 25%, transparent),
            color-mix(in srgb, var(--accent) 8%, transparent)
          );
          color: var(--accent);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent),
            0 0 16px -6px color-mix(in srgb, var(--accent) 55%, transparent);
        }

        .to-confirm-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 600;
          color: #1f1300;
          background: var(--color-warning);
          border: none;
          box-shadow: 0 8px 20px -8px color-mix(in srgb, var(--color-warning) 70%, transparent);
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .to-confirm-primary:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 12px 24px -8px color-mix(in srgb, var(--color-warning) 80%, transparent);
        }
        .to-confirm-primary:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-warning) 30%, transparent);
        }
        .to-confirm-primary:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        .to-confirm-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .to-confirm-cancel {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .to-confirm-cancel:hover:not(:disabled) {
          color: var(--text-primary);
          background: var(--bg-hover);
          border-color: color-mix(in srgb, var(--text-primary) 20%, var(--border-light));
        }
        .to-confirm-cancel:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
        }
        .to-confirm-cancel:active:not(:disabled) {
          transform: scale(0.98);
        }
        .to-confirm-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ─── Reduced motion ────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .to-icon-pulse,
          .to-dropdown-menu,
          .to-confirm {
            animation: none;
          }
          .to-transfer-btn:hover:not(:disabled),
          .to-confirm-primary:hover:not(:disabled) {
            transform: none;
          }
        }
      ` }} />
    </section>
  );
}