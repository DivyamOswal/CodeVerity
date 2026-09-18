// src/components/ScoreBar.jsx
export default function ScoreBar({ label, score, compact = false }) {
  const val =
    typeof score === "number" ? Math.min(Math.max(score, 0), 100) : 0;

  const color =
    val >= 75
      ? "bg-[var(--color-success)]"
      : val >= 50
        ? "bg-[var(--color-warning)]"
        : "bg-[var(--color-danger)]";

  const barHeight = compact ? "h-0.5" : "h-1";

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span className="font-medium">{label}</span>
        <span className="font-mono tabular-nums">{val}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={val}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`overflow-hidden rounded-full bg-[var(--border-dark)] ${barHeight}`}
      >
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}