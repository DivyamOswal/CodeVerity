// frontend/src/components/PageLoader.jsx
export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
        <p className="font-mono text-xs text-[var(--text-muted)]">Loading…</p>
      </div>
    </div>
  );
}