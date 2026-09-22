// frontend/src/components/RouteChangeLoader.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import PageLoader from "./PageLoader";

/**
 * Full-page loader shown on every route change.
 *
 * Fires on location.pathname changes (skips the initial mount so the
 * very first page load isn't masked by a loader). Hides after `minMs`.
 *
 * Note: this is time-based, not data-aware. It shows for a fixed
 * duration rather than waiting for a page's API calls to finish.
 * For content-aware loading, pages need to signal ready via context.
 */
export default function RouteChangeLoader({ minMs = 700 }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const isFirstRender = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setVisible(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, minMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.pathname, minMs]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--bg-primary)]"
    >
      <PageLoader />
    </div>
  );
}