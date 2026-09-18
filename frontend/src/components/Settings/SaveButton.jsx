// src/components/Settings/SaveButton.jsx
import { Loader2 } from "lucide-react";

export default function SaveButton({
  onClick,
  loading = false,
  label = "Save Changes",
  disabled = false,
  buttonClass = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center rounded-xl bg-[var(--accent)] font-semibold text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent-soft-strong)] transition-all duration-150 hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 ${buttonClass}`}
    >
      {loading ? (
        <>
          <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" />
          Saving…
        </>
      ) : (
        label
      )}
    </button>
  );
}