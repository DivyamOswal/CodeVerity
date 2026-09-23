// frontend/src/components/HomeBackground.jsx
import { useEffect, useRef } from "react";

export default function HomeBackground() {
  const rootRef = useRef(null);
  const spotlightRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const spotlight = spotlightRef.current;
    if (!root || !spotlight) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let raf = 0;
    let targetX = 50;
    let targetY = 20;
    let currentX = 50;
    let currentY = 20;

    const handleMove = (e) => {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      spotlight.style.setProperty("--mx", `${currentX}%`);
      spotlight.style.setProperty("--my", `${currentY}%`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handleMove);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="home-bg pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Base */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]" />

      {/* Aurora blobs — slow drifting mesh gradient */}
      <div className="home-aurora home-aurora-1" />
      <div className="home-aurora home-aurora-2" />
      <div className="home-aurora home-aurora-3" />

      {/* Dot grid with radial mask — fades at edges */}
      <div className="home-grid absolute inset-0" />

      {/* Cursor spotlight — soft accent glow that trails the pointer */}
      <div ref={spotlightRef} className="home-spotlight absolute inset-0" />

      {/* Film grain */}
      <div className="home-noise absolute inset-0" />

      {/* Edge vignette */}
      <div className="home-vignette absolute inset-0" />

      <style dangerouslySetInnerHTML={{ __html: `
        .home-bg { contain: strict; }

        /* ─── Aurora blobs ─────────────────────────────── */
        .home-aurora {
          position: absolute;
          border-radius: 9999px;
          filter: blur(120px);
          opacity: 0.5;
          will-change: transform;
          mix-blend-mode: screen;
        }
        .home-aurora-1 {
          width: 55vw; height: 55vw;
          top: -10%; left: 10%;
          background: radial-gradient(circle, var(--accent) 0%, transparent 65%);
          animation: aurora-drift-1 32s ease-in-out infinite alternate;
        }
        .home-aurora-2 {
          width: 45vw; height: 45vw;
          top: 30%; right: 5%;
          background: radial-gradient(circle, var(--accent-secondary, #818cf8) 0%, transparent 65%);
          opacity: 0.35;
          animation: aurora-drift-2 38s ease-in-out infinite alternate;
        }
        .home-aurora-3 {
          width: 40vw; height: 40vw;
          bottom: -5%; left: 20%;
          background: radial-gradient(circle, var(--accent) 0%, transparent 60%);
          opacity: 0.28;
          animation: aurora-drift-3 44s ease-in-out infinite alternate;
        }

        @keyframes aurora-drift-1 {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to   { transform: translate3d(6%, 4%, 0) scale(1.1); }
        }
        @keyframes aurora-drift-2 {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to   { transform: translate3d(-8%, 6%, 0) scale(1.15); }
        }
        @keyframes aurora-drift-3 {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to   { transform: translate3d(4%, -6%, 0) scale(1.08); }
        }

        /* ─── Grid with fade mask ─────────────────────── */
        .home-grid {
          background-image: radial-gradient(circle at center, var(--accent) 1px, transparent 1.5px);
          background-size: 32px 32px;
          opacity: 0.05;
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 35%, black 30%, transparent 75%);
          mask-image: radial-gradient(ellipse 80% 60% at 50% 35%, black 30%, transparent 75%);
        }

        /* ─── Cursor spotlight ─────────────────────────── */
        .home-spotlight {
          background: radial-gradient(
            500px circle at var(--mx, 50%) var(--my, 20%),
            var(--accent-soft-strong, rgba(168, 85, 247, 0.15)),
            transparent 45%
          );
          opacity: 0.65;
        }

        /* ─── Noise overlay ───────────────────────────── */
        .home-noise {
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 300px 300px;
          mix-blend-mode: overlay;
        }

        /* ─── Vignette ─────────────────────────────────── */
        .home-vignette {
          background: radial-gradient(
            ellipse 100% 70% at 50% 30%,
            transparent 40%,
            var(--bg-primary) 100%
          );
          opacity: 0.7;
        }

        /* ─── Reduced motion ───────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .home-aurora { animation: none; }
          .home-spotlight { opacity: 0; }
        }
      ` }} />
    </div>
  );
}