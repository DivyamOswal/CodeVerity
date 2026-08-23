// frontend/src/components/Auth/AuthLayout.jsx
import { Link } from "react-router-dom";

// -----------------------------------------------------------------
// Shared shell for Login and Register. Anything identical between
// the two pages (wordmark, corner-bracket card frame, OAuth buttons,
// divider, entrance/breathing animations, footer tagline) lives here
// once. Each page only supplies its own form fields as `children`,
// plus a few text props.
// -----------------------------------------------------------------

export default function AuthLayout({ title, terminalText, error, onOAuth, footer, children }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <style>{`
        @keyframes cv-caret {
          0%, 45% { opacity: 1; }
          50%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }
        .cv-caret { animation: cv-caret 1.1s steps(1) infinite; }
        .cv-enter-1 { animation: fadeUp 0.5s ease both; }
        .cv-enter-2 { animation: fadeUp 0.5s 0.08s ease both; }
        .cv-enter-3 { animation: fadeUp 0.5s 0.16s ease both; }
        .cv-breathe {
          animation: pulseGlow 3.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cv-caret, .cv-enter-1, .cv-enter-2, .cv-enter-3, .cv-breathe {
            animation: none;
          }
        }
      `}</style>

      {/* ambient background: sparse dot grid, indigo accent */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Wordmark */}
        <div className="text-center mb-6 cv-enter-1">
          <div className="inline-flex items-center gap-2 mb-3.5">
            <span className="w-6 h-6 rounded-md bg-[var(--accent-soft)] border border-[var(--accent)]/30 flex items-center justify-center">
              <span className="w-2 h-2 rounded-sm bg-[var(--accent)]" />
            </span>
            <span className="font-mono text-sm tracking-[0.2em] text-[var(--text-secondary)] uppercase">
              CodeVerity
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{title}</h1>
          <p className="font-mono text-xs text-[var(--text-muted)] mt-1.5">
            <span className="text-[var(--accent)]">$</span> {terminalText}
            <span className="cv-caret text-[var(--accent)]">_</span>
          </p>
        </div>

        {/* Card with breathing corner-bracket framing */}
        <div className="relative cv-enter-2">
          <span className="cv-breathe absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-[var(--accent)]/50 rounded-tl-2xl" />
          <span className="cv-breathe absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-[var(--accent)]/50 rounded-tr-2xl" />
          <span className="cv-breathe absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-[var(--accent)]/50 rounded-bl-2xl" />
          <span className="cv-breathe absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-[var(--accent)]/50 rounded-br-2xl" />

          <div className="relative overflow-hidden bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl p-6 space-y-4">
            {error && (
              <div className="font-mono text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                error: {error}
              </div>
            )}

            {/* OAuth options */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onOAuth("github")}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium
                  bg-white/[0.04] border border-[var(--border-light)] text-[var(--text-secondary)]
                  hover:bg-white/[0.08] hover:border-[var(--accent)]/40 transition-colors"
              >
                <GitHubIcon className="w-4 h-4" />
                Continue with GitHub
              </button>
              <button
                type="button"
                onClick={() => onOAuth("google")}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium
                  bg-white/[0.04] border border-[var(--border-light)] text-[var(--text-secondary)]
                  hover:bg-white/[0.08] hover:border-[var(--accent)]/40 transition-colors"
              >
                <GoogleIcon className="w-4 h-4" />
                Continue with Google
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--border-light)]" />
              <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-[var(--border-light)]" />
            </div>

            {/* Page-specific form */}
            {children}

            {footer && (
              <p className="text-center text-sm text-[var(--text-muted)]">
                {footer.question}{" "}
                <Link to={footer.linkTo} className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
                  {footer.linkText}
                </Link>
              </p>
            )}
          </div>
        </div>

        <p className="text-center font-mono text-[11px] text-[var(--text-muted)] mt-5 tracking-wide cv-enter-3">
          CodeVerity · AI Repository Intelligence
        </p>
      </div>
    </div>
  );
}

function GitHubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.5 0 12.3c0 5.44 3.44 10.05 8.21 11.68.6.12.82-.27.82-.6 0-.3-.01-1.08-.02-2.12-3.34.75-4.04-1.64-4.04-1.64-.55-1.44-1.34-1.82-1.34-1.82-1.09-.77.08-.75.08-.75 1.21.09 1.84 1.28 1.84 1.28 1.07 1.87 2.81 1.33 3.5 1.02.11-.79.42-1.33.76-1.64-2.67-.31-5.47-1.38-5.47-6.15 0-1.36.47-2.47 1.24-3.34-.12-.31-.54-1.57.12-3.28 0 0 1.01-.33 3.3 1.28a11.3 11.3 0 0 1 6 0c2.29-1.61 3.3-1.28 3.3-1.28.66 1.71.24 2.97.12 3.28.77.87 1.24 1.98 1.24 3.34 0 4.78-2.81 5.83-5.49 6.14.43.38.82 1.13.82 2.29 0 1.65-.02 2.98-.02 3.39 0 .33.22.72.83.6C20.57 22.34 24 17.73 24 12.3 24 5.5 18.63 0 12 0Z" />
    </svg>
  );
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.1A11.998 11.998 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.62l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}