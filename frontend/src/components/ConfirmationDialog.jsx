// src/components/ConfirmationDialog.jsx
import { useEffect, useRef, useId } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger", // "danger" | "primary"
  loading = false,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const titleId = useId();
  const messageId = useId();

  /* ─── Focus management: save + restore + autofocus ─── */
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement;
      // Focus the cancel button (safer default than the destructive one)
      cancelButtonRef.current?.focus();
    } else if (previouslyFocusedRef.current instanceof HTMLElement) {
      previouslyFocusedRef.current.focus();
      previouslyFocusedRef.current = null;
    }
  }, [isOpen]);

  /* ─── Escape to close (blocked while loading) ─── */
  useEffect(() => {
    const onKey = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, loading]);

  /* ─── Focus trap: cycle Tab within the dialog ─── */
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;

    const onKey = (e) => {
      if (e.key !== "Tab") return;

      const focusable = dialog.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!focusable.length) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = dialog.contains(active);

      if (e.shiftKey) {
        if (active === first || !inside) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !inside) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener("keydown", onKey);
    return () => dialog.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === "danger";

  const confirmClasses = isDanger
    ? "bg-[var(--color-danger)] text-[var(--color-danger-contrast)] hover:brightness-110"
    : "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]";

  const handleBackdropClick = () => {
    if (!loading) onClose();
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-2xl outline-none"
      >
        <div className="flex items-start gap-3">
          {isDanger && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
              <AlertTriangle size={18} strokeWidth={2.2} aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-lg font-semibold text-[var(--text-primary)]"
            >
              {title}
            </h2>
            {message && (
              <p
                id={messageId}
                className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]"
              >
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-50 ${confirmClasses}`}
          >
            {loading && (
              <Loader2
                size={14}
                strokeWidth={2.4}
                aria-hidden="true"
                className="animate-spin"
              />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}