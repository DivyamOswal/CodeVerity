// src/components/SmoothScroll.jsx
import { useRef } from "react";
import { gsap, useGSAP, ScrollSmoother, ScrollTrigger } from "../lib/gsap";

export default function SmoothScroll({ children }) {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const smootherRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop + normal motion → enable ScrollSmoother
      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          if (!wrapperRef.current || !contentRef.current) return;

          const smoother = ScrollSmoother.create({
            wrapper: wrapperRef.current,
            content: contentRef.current,
            smooth: 0.9,
            effects: false,
            normalizeScroll: true,
          });

          smootherRef.current = smoother;

          // Wait for the smoother to settle before refreshing
          // ScrollTrigger, otherwise pinned sections can jump.
          requestAnimationFrame(() => ScrollTrigger.refresh());

          return () => {
            smoother.kill();
            smootherRef.current = null;
          };
        }
      );

      // Mobile or reduced motion → native scroll, no smoother.
      // This branch has nothing to set up; if the desktop branch
      // was previously active, GSAP runs its cleanup automatically
      // when the desktop media query stops matching.
      mm.add(
        "(max-width: 767px), (prefers-reduced-motion: reduce)",
        () => {}
      );

      return () => {
        if (smootherRef.current) {
          smootherRef.current.kill();
          smootherRef.current = null;
        }
        mm.revert();
      };
    },
    { scope: wrapperRef, dependencies: [] }
  );

  return (
    <div id="smooth-wrapper" ref={wrapperRef}>
      <div id="smooth-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
}