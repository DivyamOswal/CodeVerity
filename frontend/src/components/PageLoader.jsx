// frontend/src/components/PageLoader.jsx
export default function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-[var(--bg-primary)]"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes loader-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes loader-spin-reverse {
          to { transform: rotate(-360deg); }
        }
        @keyframes loader-pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes loader-dot-bounce {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes loader-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes loader-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .loader-ring-outer {
          animation: loader-spin 1.4s linear infinite;
        }
        .loader-ring-inner {
          animation: loader-spin-reverse 1s linear infinite;
        }
        .loader-glow {
          animation: loader-pulse-glow 2s ease-in-out infinite;
        }
        .loader-dot {
          animation: loader-dot-bounce 1.2s ease-in-out infinite;
        }
        .loader-scanline {
          animation: loader-scanline 2.2s ease-in-out infinite;
        }
        .loader-content {
          animation: loader-fade-in 0.4s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .loader-ring-outer,
          .loader-ring-inner,
          .loader-glow,
          .loader-dot,
          .loader-scanline {
            animation: none !important;
          }
          .loader-ring-outer {
            border-top-color: var(--accent);
          }
        }
      `,
        }}
      />

      {/* Ambient background glow, consistent with Home's hero glows */}
      <div
        aria-hidden="true"
        className="loader-glow pointer-events-none absolute h-[280px] w-[280px] rounded-full bg-[var(--accent-soft)] opacity-50 blur-3xl"
      />

      {/* Faint scanning line sweeping through, echoing the ScanLine effect on CTAs */}
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>

        {/* Label with bouncing dots instead of a static ellipsis */}
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