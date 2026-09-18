// src/components/PageLoader.jsx
import { ShieldCheck } from "lucide-react";

export default function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-[var(--bg-primary)]"
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="loader-glow pointer-events-none absolute h-[280px] w-[280px] rounded-full bg-[var(--accent-soft)] opacity-50 blur-3xl"
      />

      {/* Faint scanning line sweeping through */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span className="loader-scanline absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />
      </div>

      <div className="loader-content relative z-10 flex flex-col items-center gap-5">
        {/* Dual-ring spinner with a static logo mark at the center */}
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div
            aria-hidden="true"
            className="loader-ring-outer absolute inset-0 rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]"
          />
          <div
            aria-hidden="true"
            className="loader-ring-inner absolute inset-2 rounded-full border-2 border-transparent border-b-[var(--accent)]/50"
          />
          <ShieldCheck
            size={16}
            strokeWidth={2}
            aria-hidden="true"
            className="relative text-[var(--accent)]"
          />
        </div>

        {/* Label with bouncing dots */}
        <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
          <span>Loading</span>
          <span className="flex items-center gap-0.5">
            <span
              className="loader-dot h-1 w-1 rounded-full bg-[var(--accent)]"
              style={{ animationDelay: "0s" }}
            />
            <span
              className="loader-dot h-1 w-1 rounded-full bg-[var(--accent)]"
              style={{ animationDelay: "0.15s" }}
            />
            <span
              className="loader-dot h-1 w-1 rounded-full bg-[var(--accent)]"
              style={{ animationDelay: "0.3s" }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}