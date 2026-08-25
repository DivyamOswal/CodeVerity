// frontend/src/components/SmoothScroll.jsx
import { useRef } from "react";
import { gsap, useGSAP, ScrollSmoother } from "../lib/gsap";

// -----------------------------------------------------------------
// Wraps the whole app in GSAP's smooth-scroll containers. Required
// structure: #smooth-wrapper > #smooth-content > everything else.
// If you use this, ScrollTrigger-based Reveal animations still work
// — ScrollSmoother and ScrollTrigger are designed to be used together.
//
// Respects prefers-reduced-motion, same as Reveal.jsx — smoothing is
// itself a motion effect, so users with that setting on get plain
// native scroll instead (no ScrollSmoother instance is created at
// all in that branch).
//
// Reminder from setup: position: sticky elements (your Navbar,
// History's detail header) don't behave normally inside smoothed
// content, since ScrollSmoother scrolls via transform. If you use
// this wrapper, either render the Navbar outside #smooth-content or
// convert those sticky elements to ScrollTrigger pin: true.
// -----------------------------------------------------------------

export default function SmoothScroll({ children }) {
  const smoother = useRef(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      smoother.current = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.2, // higher = "floatier"; 1–1.5 is a natural range
        effects: false, // set true only if you add data-speed/data-lag attrs for parallax
        normalizeScroll: true, // fixes iOS/touch scroll jank
      });
    });

    // Reduced motion: no ScrollSmoother instance at all — the wrapper
    // divs stay plain, so the browser's native scroll takes over.
    mm.add("(prefers-reduced-motion: reduce)", () => {
      smoother.current = null;
    });

    return () => mm.revert();
  });

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content">{children}</div>
    </div>
  );
}