// frontend/src/components/TerminalDemo.jsx
import { useEffect, useRef, useState } from "react";

const LINES = [
  { text: "$ codeverity scan github.com/acme/api", tone: "cmd", delay: 0 },
  { text: "◐ Cloning repository...", tone: "dim", delay: 500 },
  { text: "◓ Parsing 142 files across 6 languages", tone: "dim", delay: 900 },
  { text: "✓ 12,847 tokens analyzed", tone: "ok", delay: 1400 },
  { text: "◒ Running security scan...", tone: "dim", delay: 1800 },
  { text: "⚠  3 critical findings", tone: "warn", delay: 2300 },
  { text: "⚠  7 warnings · 12 suggestions", tone: "warn", delay: 2600 },
  { text: "◑ Generating fix PRs...", tone: "dim", delay: 3000 },
  { text: "✓ Report ready → codeverity.dev/r/4821", tone: "ok", delay: 3500 },
];

const TONE = {
  cmd: "text-[var(--text-primary)]",
  dim: "text-[var(--text-muted)]",
  ok: "text-[var(--color-success)]",
  warn: "text-[#f59e0b]",
};

export default function TerminalDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const timersRef = useRef([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisibleCount(LINES.length);
      return;
    }

    let cancelled = false;

    const clearAll = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };

    const runCycle = () => {
      if (cancelled) return;
      clearAll();
      setVisibleCount(0);

      LINES.forEach((line, i) => {
        const t = setTimeout(() => {
          if (!cancelled) setVisibleCount(i + 1);
        }, line.delay);
        timersRef.current.push(t);
      });

      const restart = setTimeout(() => {
        if (!cancelled) runCycle();
      }, LINES[LINES.length - 1].delay + 5000);
      timersRef.current.push(restart);
    };

    runCycle();

    return () => {
      cancelled = true;
      clearAll();
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[#0b0b12]/95 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md">
      {/* Chrome */}
      <div className="flex items-center gap-2 border-b border-[var(--border-light)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[10px] text-[var(--text-muted)]">
          codeverity — zsh — 80×24
        </span>
      </div>

      {/* Body */}
      <div className="space-y-1 p-4 font-mono text-[11px] leading-relaxed sm:text-xs">
        {LINES.slice(0, visibleCount).map((line, i) => (
          <div
            key={i}
            className={`${TONE[line.tone]} transition-opacity duration-200`}
          >
            {line.text}
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-[7px] animate-pulse bg-[var(--accent)]" />
        </div>
      </div>
    </div>
  );
}