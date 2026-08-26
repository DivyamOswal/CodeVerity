// frontend/src/components/Auth/AuthLayout.jsx
import { Link } from "react-router-dom";

export default function AuthLayout({ title, terminalText, error, onOAuth, footer, children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">

      {/* ===== LEFT PANEL – Form ===== */}
      <div className="flex w-full flex-1 items-center justify-center overflow-y-auto bg-[var(--bg-primary)] p-4 sm:p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Wordmark (mobile only) */}
          <div className="mb-6 text-center lg:hidden cv-enter-1">
            <div className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]">
                <span className="text-sm font-bold text-[var(--accent-contrast)]">C</span>
              </span>
              <span className="font-mono text-sm font-bold tracking-[0.2em] text-[var(--text-primary)]">
                CodeVerity
              </span>
            </div>
          </div>

          {/* Card – identical to before */}
          <div className="relative cv-enter-2">
            <span className="cv-breathe absolute -top-px -left-px h-4 w-4 rounded-tl-2xl border-t-2 border-l-2 border-[var(--accent)]/50" />
            <span className="cv-breathe absolute -top-px -right-px h-4 w-4 rounded-tr-2xl border-t-2 border-r-2 border-[var(--accent)]/50" />
            <span className="cv-breathe absolute -bottom-px -left-px h-4 w-4 rounded-bl-2xl border-b-2 border-l-2 border-[var(--accent)]/50" />
            <span className="cv-breathe absolute -bottom-px -right-px h-4 w-4 rounded-br-2xl border-b-2 border-r-2 border-[var(--accent)]/50" />

            <div className="relative space-y-4 overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 sm:p-8">
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-400">
                  error: {error}
                </div>
              )}

              {/* OAuth buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => onOAuth("github")}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--border-light)] bg-white/[0.04] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <GitHubIcon className="h-4 w-4" />
                  Continue with GitHub
                </button>
                <button
                  type="button"
                  onClick={() => onOAuth("google")}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--border-light)] bg-white/[0.04] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <GoogleIcon className="h-4 w-4" />
                  Continue with Google
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border-light)]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">or</span>
                <div className="h-px flex-1 bg-[var(--border-light)]" />
              </div>

              {children}

              {footer && (
                <p className="text-center text-sm text-[var(--text-muted)]">
                  {footer.question}{" "}
                  <Link
                    to={footer.linkTo}
                    className="text-[var(--accent)] transition-colors duration-200 hover:text-[var(--accent-hover)]"
                  >
                    {footer.linkText}
                  </Link>
                </p>
              )}
            </div>
          </div>

          <p className="cv-enter-3 mt-5 text-center font-mono text-[11px] tracking-wide text-[var(--text-muted)]">
            CodeVerity · AI Repository Intelligence
          </p>
        </div>
      </div>

      {/* ===== RIGHT PANEL – Premium Animated Brand Side (3D effects) ===== */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--accent)]/30 via-[var(--bg-card)] to-[var(--bg-primary)] p-12 lg:flex">

        {/* ===== Animated Gradient Mesh ===== */}
        <div className="absolute inset-0 animate-gradient-mesh bg-[length:400%_400%] bg-gradient-to-br from-[var(--accent)]/5 via-[var(--accent)]/15 to-transparent" />

        {/* ===== Glow Orbs with depth ===== */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--accent)]/20 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[var(--accent)]/10 blur-3xl animate-pulse-slower" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-[var(--accent)]/5 blur-3xl animate-pulse" />

        {/* ===== 3D Floating Shapes Layer 1 (far background) ===== */}
        <div className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full bg-[var(--accent)]/10 blur-2xl animate-float-slower" />
        <div className="absolute bottom-1/3 right-1/3 h-48 w-48 rounded-full bg-[var(--accent)]/5 blur-3xl animate-float" />

        {/* ===== 3D Floating Shapes Layer 2 (mid – with transform perspective) ===== */}
        <div className="absolute top-1/3 left-1/2 h-20 w-20 rotate-45 bg-[var(--accent)]/15 blur-xl animate-float-medium" style={{ borderRadius: '4px', transform: 'rotateX(15deg) rotateY(10deg)' }} />
        <div className="absolute bottom-1/4 left-1/4 h-16 w-16 rotate-12 bg-[var(--accent)]/20 blur-xl animate-float-slow" style={{ borderRadius: '50% 50% 0 50%', transform: 'rotateX(10deg) rotateY(-5deg)' }} />
        <div className="absolute top-2/3 right-1/4 h-14 w-14 bg-[var(--accent)]/10 blur-lg animate-float-fast" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', transform: 'rotateX(20deg) rotateY(15deg)' }} />

        {/* ===== 3D Floating Shapes Layer 3 (foreground – crisp, with depth) ===== */}
        <div className="absolute top-1/5 left-1/5 h-8 w-8 rounded-full bg-[var(--accent)]/30 blur-md animate-float-fast" style={{ transform: 'translateZ(30px)' }} />
        <div className="absolute bottom-1/5 right-1/4 h-6 w-6 rotate-45 bg-[var(--accent)]/40 blur-sm animate-float-medium" style={{ borderRadius: '2px', transform: 'translateZ(40px) rotateX(10deg)' }} />
        <div className="absolute top-1/2 left-1/4 h-10 w-10 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 blur-sm animate-float-slow" style={{ transform: 'translateZ(20px)' }} />

        {/* ===== Animated Grid Overlay with parallax ===== */}
        <div className="absolute inset-0 opacity-[0.08]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5">
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4s" repeatCount="indefinite" />
                </path>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* ===== Brand Content with 3D hover effect ===== */}
        <div className="relative z-10 max-w-sm text-center perspective-800">
          {/* Logo with pulse ring and 3D transform */}
          <div className="relative inline-block transform-style-3d hover:rotate-y-[-5deg] hover:rotate-x-[3deg] transition-transform duration-700 ease-out">
            <div className="absolute -inset-4 rounded-2xl bg-[var(--accent)]/10 blur-2xl animate-pulse-slow" />
            <div className="relative inline-flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] shadow-2xl shadow-[var(--accent)]/40 transition-transform duration-500 hover:scale-105">
                <span className="text-2xl font-bold text-[var(--accent-contrast)]">C</span>
              </span>
              <span className="font-mono text-2xl font-bold tracking-[0.15em] text-[var(--text-primary)]">
                CodeVerity
              </span>
            </div>
          </div>

          {/* Heading with stagger */ }
          <h2 className="mt-8 text-4xl font-semibold leading-tight text-[var(--text-primary)] cv-enter-1">
            AI Code Intelligence
          </h2>

          {/* Tagline with animated cursor */}
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] cv-enter-2">
            Secure, AI‑powered repository analysis.
            <br />
            Ship with confidence.
            <span className="inline-block h-4 w-0.5 bg-[var(--accent)] ml-1 animate-cursor" />
          </p>

          {/* Status indicator with shimmer */}
          <div className="mt-8 flex items-center justify-center gap-3 text-xs font-mono text-[var(--text-muted)] cv-enter-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>System online</span>
            <span className="text-[var(--border-light)]">•</span>
            <span className="animate-pulse-slow">v3.2.1</span>
          </div>

          {/* Decorative 3D line */}
          <div className="mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent transform-style-3d rotate-x-5" />
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 left-0 right-0 text-center font-mono text-[10px] text-[var(--text-muted)] tracking-wider opacity-60">
          © 2026 CodeVerity · All rights reserved
        </p>
      </div>

      {/* ===== Animations (updated with 3D transforms) ===== */}
      <style>{`
        /* Cursor blink */
        @keyframes cursor {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-cursor {
          animation: cursor 1s steps(1) infinite;
        }

        /* Gradient mesh */
        @keyframes gradient-mesh {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-mesh {
          animation: gradient-mesh 15s ease-in-out infinite alternate;
        }

        /* Pulse variations */
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-pulse-slower {
          animation: pulse-slower 6s ease-in-out infinite;
        }

        /* Float variations with 3D */
        @keyframes float-slow {
          0% { transform: translate(0, 0) rotate(0deg) scale(1) translateZ(0px); }
          33% { transform: translate(30px, -20px) rotate(5deg) scale(1.05) translateZ(20px); }
          66% { transform: translate(-20px, 25px) rotate(-3deg) scale(0.95) translateZ(-10px); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1) translateZ(0px); }
        }
        @keyframes float-medium {
          0% { transform: translate(0, 0) rotate(0deg) translateZ(0px); }
          50% { transform: translate(25px, -15px) rotate(10deg) translateZ(30px); }
          100% { transform: translate(0, 0) rotate(0deg) translateZ(0px); }
        }
        @keyframes float-fast {
          0% { transform: translate(0, 0) scale(1) translateZ(0px); }
          50% { transform: translate(-15px, 20px) scale(1.1) translateZ(40px); }
          100% { transform: translate(0, 0) scale(1) translateZ(0px); }
        }
        @keyframes float {
          0% { transform: translate(0, 0) translateZ(0px); }
          50% { transform: translate(20px, -25px) translateZ(15px); }
          100% { transform: translate(0, 0) translateZ(0px); }
        }
        @keyframes float-slower {
          0% { transform: translate(0, 0) translateZ(0px); }
          50% { transform: translate(-30px, 15px) translateZ(-5px); }
          100% { transform: translate(0, 0) translateZ(0px); }
        }
        .animate-float-slow { animation: float-slow 18s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 12s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 8s ease-in-out infinite; }
        .animate-float { animation: float 14s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 22s ease-in-out infinite; }

        /* Card entrance */
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes cv-caret {
          0%, 45% { opacity: 1; }
          50%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .cv-caret { animation: cv-caret 1.1s steps(1) infinite; }
        .cv-enter-1 { animation: fadeUp 0.5s ease both; }
        .cv-enter-2 { animation: fadeUp 0.5s 0.08s ease both; }
        .cv-enter-3 { animation: fadeUp 0.5s 0.16s ease both; }
        .cv-breathe { animation: pulseGlow 3.2s ease-in-out infinite; }

        /* 3D utilities */
        .perspective-800 { perspective: 800px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .rotate-y-\\[-5deg\\] { transform: rotateY(-5deg); }
        .rotate-x-\\[3deg\\] { transform: rotateX(3deg); }
        .rotate-x-5 { transform: rotateX(5deg); }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-gradient-mesh,
          .animate-pulse-slow,
          .animate-pulse-slower,
          .animate-float-slow,
          .animate-float-medium,
          .animate-float-fast,
          .animate-float,
          .animate-float-slower,
          .cv-caret,
          .cv-enter-1,
          .cv-enter-2,
          .cv-enter-3,
          .cv-breathe {
            animation: none;
          }
          .animate-gradient-mesh {
            background-size: 100% 100%;
          }
          .animate-float-slow,
          .animate-float-medium,
          .animate-float-fast,
          .animate-float,
          .animate-float-slower {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// -----------------------------------------------------------------
// Icons
// -----------------------------------------------------------------
function GitHubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.5 0 12.3c0 5.44 3.44 10.05 8.21 11.68.6.12.82-.27.82-.6 0-.3-.01-1.08-.02-2.12-3.34.75-4.04-1.64-4.04-1.64-.55-1.44-1.34-1.82-1.34-1.82-1.09-.77.08-.75.08-.75 1.21.09 1.73 1.28 1.73 1.28 1.07 1.87 2.81 1.33 3.5 1.02.11-.79.42-1.33.76-1.64-2.67-.31-5.47-1.38-5.47-6.15 0-1.36.47-2.47 1.24-3.34-.12-.31-.54-1.57.12-3.28 0 0 1.01-.33 3.3 1.28a11.3 11.3 0 0 1 6 0c2.15-1.45 3.1-1.15 3.1-1.15.61 1.55.23 2.7.11 2.98.72.79 1.24 1.98 1.24 3.34 0 4.78-2.63 5.27-5.13 5.55.4.35.76 1.05.76 2.12v3.15c0 .3.2.65.78.54a11.27 11.27 0 0 0 7.67-10.68C23.25 5.48 18.27.5 12 .5Z" />
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