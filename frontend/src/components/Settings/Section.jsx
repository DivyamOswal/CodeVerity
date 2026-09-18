// src/components/Settings/Section.jsx
export default function Section({
  title,
  icon: Icon,
  children,
  danger = false,
  compact = false,
  padding = "p-6",
  gap = "space-y-4",
}) {
  return (
    <div
      className={`rounded-2xl border bg-[var(--bg-card)] ${padding} ${gap} ${
        danger
          ? "border-[var(--color-danger)]/20"
          : "border-[var(--border-light)]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span
            className={`flex shrink-0 items-center justify-center rounded-lg ${
              compact ? "h-6 w-6" : "h-7 w-7"
            } ${
              danger
                ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                : "bg-[var(--accent-soft)] text-[var(--accent)]"
            }`}
          >
            <Icon size={compact ? 13 : 15} strokeWidth={1.9} aria-hidden="true" />
          </span>
        )}
        <h2
          className={`font-semibold ${
            danger ? "text-[var(--color-danger)]" : "text-[var(--text-primary)]"
          } ${compact ? "text-sm" : "text-base"}`}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}