export default function ScoreBar({ label, score }) {
  const val = typeof score === "number" ? Math.min(Math.max(score, 0), 100) : 0;
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span className="font-medium">{label}</span>
        <span className="font-mono tabular-nums">{val}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-[var(--border-dark)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}
