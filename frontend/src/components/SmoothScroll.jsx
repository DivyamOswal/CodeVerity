// frontend/src/components/SmoothScroll.jsx
import { useRef } from "react";
import { gsap, useGSAP, ScrollSmoother, ScrollTrigger } from "../lib/gsap";

export default function SmoothScroll({ children }) {
  const smoother = useRef(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    // Desktop + normal motion
    mm.add(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      () => {
        smoother.current = ScrollSmoother.create({
          wrapper: "#smooth-wrapper",
          content: "#smooth-content",

          // Natural developer-tool feeling.
          // Avoid making the page feel "floaty".
          smooth: 0.9,

          // We are not using data-speed/data-lag yet.
          effects: false,

          // Helps normalize wheel/touch behavior.
          normalizeScroll: true,

          // Prevents ScrollSmoother from fighting browser resize behavior.
          ignoreMobileResize: true,
        });

        // Make sure ScrollTrigger knows about the smoother.
        ScrollTrigger.refresh();
      }
    );

    // Mobile / reduced motion:
    // Native browser scrolling is intentionally preserved.
    mm.add(
      "(max-width: 767px), (prefers-reduced-motion: reduce)",
      () => {
        smoother.current = null;
      }
    );

    return () => {
      // GSAP matchMedia automatically reverts everything created
      // inside its callbacks.
      mm.revert();

      smoother.current = null;
    };
  });

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content">{children}</div>
    </div>
  );
}
