// src/components/PageLoader.jsx
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

const STATUS_MESSAGES = [
  "initializing engine",
  "verifying credentials",
  "loading workspace",
  "establishing secure channel",
  "almost there",
];

const STATUS_INTERVAL_MS = 1100;

export default function PageLoader() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, STATUS_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-[var(--bg-primary)]"
    >
      {/* Dot-grid background  matches Home hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient glow that breathes */}
      <div
        aria-hidden="true"
        className="loader-glow pointer-events-none absolute h-[320px] w-[320px] rounded-full bg-[var(--accent-soft)] blur-3xl"
      />

      {/* Scanline sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span className="loader-scanline absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent)]/60 to-transparent" />
      </div>

      <div className="loader-content relative z-10 flex flex-col items-center gap-8">
        {/* Concentric orbit + center logo */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Outer orbit  slow rotation, single bright dot */}
          <div
            aria-hidden="true"
            className="loader-orbit-outer absolute inset-0 rounded-full border border-[var(--border-light)]"
          >
            <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
          </div>

          {/* Middle dashed orbit  counter-rotation */}
          <div
            aria-hidden="true"
            className="loader-orbit-mid absolute inset-3 rounded-full border border-dashed border-[var(--accent)]/30"
          >
            <span className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]/70" />
          </div>

          {/* Inner pulse ring */}
          <div
            aria-hidden="true"
            className="loader-ring-pulse absolute inset-6 rounded-full border border-[var(--accent)]/50"
          />

          {/* Center logo  matches CodeVerityLogo mark */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)] shadow-[0_0_24px_var(--accent-soft-strong)]">
            <div className="absolute inset-[1px] rounded-[7px] bg-[var(--bg-primary)]" />
            <ShieldCheck
              size={18}
              strokeWidth={2}
              aria-hidden="true"
              className="relative text-[var(--accent)]"
            />
          </div>
        </div>

        {/* Status block */}
        <div className="flex flex-col items-center gap-3">
          {/* Terminal-style status line */}
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span className="text-[var(--accent)]">$</span>
            <span
              key={statusIndex}
              className="loader-status-text inline-block"
            >
              {STATUS_MESSAGES[statusIndex]}
            </span>
            <span
              aria-hidden="true"
              className="loader-cursor inline-block h-3 w-[2px] bg-[var(--accent)]"
            />
          </div>

          {/* Sweeping progress bar */}
          <div
            aria-hidden="true"
            className="relative h-[2px] w-48 overflow-hidden rounded-full bg-[var(--border-light)]"
          >
            <span className="loader-progress absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .loader-glow {
          animation: loader-glow-pulse 3.2s ease-in-out infinite;
        }
        @keyframes loader-glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50%      { opacity: 0.7; transform: scale(1.05); }
        }

        .loader-scanline {
          animation: loader-scan-move 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes loader-scan-move {
          0%   { transform: translateY(0);      opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(70vh);   opacity: 0; }
        }

        .loader-orbit-outer {
          animation: loader-spin 6s linear infinite;
        }
        @keyframes loader-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .loader-orbit-mid {
          animation: loader-spin-reverse 4s linear infinite;
        }
        @keyframes loader-spin-reverse {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }

        .loader-ring-pulse {
          animation: loader-ring-pulse-anim 2s ease-in-out infinite;
        }
        @keyframes loader-ring-pulse-anim {
          0%, 100% { opacity: 0.3; transform: scale(0.92); }
          50%      { opacity: 0.7; transform: scale(1); }
        }

        .loader-status-text {
          animation: loader-status-in 0.4s cubic-bezier(0.2, 0.9, 0.3, 1);
        }
        @keyframes loader-status-in {
          from { opacity: 0; transform: translateY(4px); filter: blur(2px); }
          to   { opacity: 1; transform: translateY(0);   filter: blur(0); }
        }

        .loader-cursor {
          animation: loader-cursor-blink 1s steps(1) infinite;
        }
        @keyframes loader-cursor-blink {
          0%, 50%   { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .loader-progress {
          animation: loader-progress-sweep 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes loader-progress-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .loader-glow,
          .loader-scanline,
          .loader-orbit-outer,
          .loader-orbit-mid,
          .loader-ring-pulse,
          .loader-progress,
          .loader-cursor {
            animation: none;
          }
          .loader-orbit-outer,
          .loader-orbit-mid {
            opacity: 0.6;
          }
          .loader-progress {
            width: 100%;
            transform: translateX(0);
            opacity: 0.7;
          }
        }
      ` }} />
    </div>
  );
}