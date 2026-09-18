// src/components/Settings/Toggle.jsx
export default function Toggle({
  label,
  description,
  value,
  onChange,
  compact = false,
  textClass = "",
  descClass = "",
}) {
  return (
    <div className="flex items-center justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <p className={`font-medium text-[var(--text-primary)] ${textClass}`}>
          {label}
        </p>
        {description && (
          <p className={`mt-0.5 text-[var(--text-muted)] ${descClass}`}>
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] ${
          value
            ? "bg-[var(--accent)]"
            : "bg-[var(--border-medium)] hover:bg-[var(--border-dark)]"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}