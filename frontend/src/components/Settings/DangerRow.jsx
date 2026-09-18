// src/components/Settings/DangerRow.jsx
export default function DangerRow({
  title,
  description,
  label,
  onClick,
  bold = false,
  padding = "p-4",
  titleClass = "",
  descClass = "",
  buttonClass = "",
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-[var(--color-danger)]/10 bg-[var(--color-danger-soft)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${padding}`}
    >
      <div className="min-w-0">
        <p
          className={`text-[var(--color-danger)] ${
            bold ? "font-semibold" : "font-medium"
          } ${titleClass}`}
        >
          {title}
        </p>
        <p className={`mt-0.5 text-[var(--text-muted)] ${descClass}`}>
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`shrink-0 self-start rounded-lg border border-transparent bg-[var(--color-danger-soft)] font-medium text-[var(--color-danger)] transition-all duration-150 hover:border-[var(--color-danger)]/40 hover:bg-[var(--color-danger)]/25 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] sm:self-auto ${buttonClass}`}
      >
        {label}
      </button>
    </div>
  );
}