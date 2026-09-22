// frontend/src/components/RouteProgressBar.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export default function RouteProgressBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const hideTimer = useRef(null);

  useEffect(() => {
    setVisible(true);
    setProgress(0);

    const t1 = setTimeout(() => setProgress(80), 50);

    const t2 = setTimeout(() => {
      setProgress(100);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [location.pathname]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] h-[2px] w-full bg-transparent"
    >
      <div
        className="h-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: visible ? 1 : 0 }}
      />
    </div>
  );
}