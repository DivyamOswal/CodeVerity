// frontend/src/components/Reveal.jsx
import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";

// -----------------------------------------------------------------
// Usage — replaces this pattern seen throughout the app:
//   <div style={{ animation: "fadeUp 0.6s 0.1s ease both" }}>...</div>
// with:
//   <Reveal delay={0.1}>...</Reveal>
//
// Animates once when the element scrolls into view (not on every
// scroll up/down), matching the one-shot fadeUp/fadeDown feel you
// already have on Home/Login/Register/CodeInput/etc, but now driven
// by actual scroll position instead of a fixed mount-time delay.
//
// Respects prefers-reduced-motion — every other animation in this
// app (globals.css, AuthLayout, Home) already skips motion for users
// with that OS setting on; this does the same via gsap.matchMedia(),
// GSAP's own recommended pattern for conditional animation.
// -----------------------------------------------------------------

export default function Reveal({
  children,
  as: Tag = "div",
  className = "",
  y = 24,
  delay = 0,
  duration = 0.6,
  from = "down", // "down" (rises up into place) | "up" (drops down) | "none"
  start = "top 85%",
}) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const yFrom = from === "up" ? -y : from === "down" ? y : 0;

        gsap.fromTo(
          el,
          { autoAlpha: 0, y: yFrom },
          {
            autoAlpha: 1,
            y: 0,
            duration,
            delay,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start,
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Reduced motion: skip straight to the final visible state, no
      // fade, no movement, no scroll listener at all.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(el, { autoAlpha: 1, y: 0 });
      });

      return () => mm.revert();
    },
    {
      // ❗ No `scope` – we animate the ref directly.
      // ✅ Run once (empty deps) and clean up properly on unmount.
      dependencies: [],
      revertOnUpdate: true, // ensures old ScrollTriggers are killed if deps change
    }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}