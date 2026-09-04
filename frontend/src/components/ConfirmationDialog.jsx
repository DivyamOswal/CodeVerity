import { useEffect, useRef } from "react";

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger", // "danger" | "primary"
}) {
  const dialogRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Trap focus inside modal when open
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === "danger";
  const confirmClasses = isDanger
    ? "bg-red-500 hover:bg-red-600 text-white"
    : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-contrast)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose} // click outside to close
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <h2 id="dialog-title" className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${confirmClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}