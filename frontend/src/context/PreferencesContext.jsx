// src/context/PreferencesContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const PREF_THEME = "codeverity_theme";
const PREF_COMPACT = "codeverity_compact";
const PREF_SCORES = "codeverity_showScores";

const PreferencesContext = createContext();

function loadPref(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    if (v === "true") return true;
    if (v === "false") return false;
    return v;
  } catch {
    return fallback;
  }
}

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState(() => loadPref(PREF_THEME, "dark"));
  const [compact, setCompact] = useState(() => loadPref(PREF_COMPACT, false));
  const [showScores, setShowScores] = useState(() => loadPref(PREF_SCORES, true));

  // Apply theme to document root
  // src/context/PreferencesContext.jsx updated
useEffect(() => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
    root.classList.add("dark");
    root.classList.remove("light");
  } else if (theme === "light") {
    root.setAttribute("data-theme", "light");
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    // system
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", systemDark ? "dark" : "light");
    if (systemDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }
  localStorage.setItem(PREF_THEME, theme);
}, [theme]);

  // Save other preferences
  useEffect(() => {
    localStorage.setItem(PREF_COMPACT, String(compact));
  }, [compact]);

  useEffect(() => {
    localStorage.setItem(PREF_SCORES, String(showScores));
  }, [showScores]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    compact,
    setCompact,
    showScores,
    setShowScores,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}