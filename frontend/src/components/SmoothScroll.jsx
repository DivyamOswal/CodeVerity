import { useRef, useEffect } from "react";
import { gsap, useGSAP, ScrollSmoother, ScrollTrigger } from "../lib/gsap";

export default function SmoothScroll({ children }) {
  const wrapperRef = useRef(null);
  const smootherRef = useRef(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    // Desktop + normal motion
    mm.add(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      () => {
        // If there's an existing smoother, kill it first
        if (smootherRef.current) {
          smootherRef.current.kill();
          smootherRef.current = null;
        }

        smootherRef.current = ScrollSmoother.create({
          wrapper: "#smooth-wrapper",
          content: "#smooth-content",
          smooth: 0.9,
          effects: false,
          normalizeScroll: true,
          ignoreMobileResize: true,
        });

        ScrollTrigger.refresh();
      }
    );

    // Mobile / reduced motion
    mm.add(
      "(max-width: 767px), (prefers-reduced-motion: reduce)",
      () => {
        if (smootherRef.current) {
          smootherRef.current.kill();
          smootherRef.current = null;
        }
        // Ensure native scroll works
        // No additional action needed
      }
    );

    return () => {
      // Cleanup on unmount
      if (smootherRef.current) {
        smootherRef.current.kill();
        smootherRef.current = null;
      }
      mm.revert(); // But useGSAP already reverts? Actually useGSAP does not auto-revert matchMedia; we need to call mm.revert() ourselves.
      // However, we are returning a cleanup function that will be called on unmount. That's fine.
      // But useGSAP also allows returning a cleanup from the callback; we can return a function that does mm.revert and kill smoother.
      // The current return is returning mm.revert? Actually we are returning a function that calls mm.revert? Let's structure it properly.
    };
  }, { dependencies: [] });

  return (
    <div id="smooth-wrapper" ref={wrapperRef}>
      <div id="smooth-content">{children}</div>
    </div>
  );
}