export default function ScoreBar({ label, score }) {
  const val = typeof score === "number" ? Math.min(Math.max(score, 0), 100) : 0;

  // Severity coloring mirrors the thresholds used across the rest
  // of the app (History.jsx, Result.jsx) so a low score reads as
  // "bad" via color, not just a shorter bar.
  const color =
    val >= 75
      ? "bg-[var(--color-success)]"
      : val >= 50
      ? "bg-[var(--color-warning)]"
      : "bg-[var(--color-danger)]";

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span className="font-medium">{label}</span>
        <span className="font-mono tabular-nums">{val}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-[var(--border-dark)]">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}
