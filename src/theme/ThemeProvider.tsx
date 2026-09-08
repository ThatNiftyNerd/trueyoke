import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "trueyoke-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Wraps the app; toggles the `.dark` class on <html> (already wired via
 * `@custom-variant dark (&:is(.dark *))` in styles.css) and persists explicit
 * choices to localStorage. Pairs with the inline script in index.html that
 * sets the class before first paint, so there's no flash on load.
 *
 * The mount-time sync intentionally does NOT write to localStorage. Without
 * that guard, the very first mount of this provider anywhere in the app
 * would silently persist whatever `readInitialTheme` inferred (e.g. from
 * `prefers-color-scheme`) as if it were a real, explicit choice — which
 * defeats any consumer (like the landing page) that needs to tell "the user
 * picked dark" apart from "nothing's ever been chosen, this is just a
 * guess." Only setTheme/toggleTheme — i.e. an actual interaction — persists.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);
  const isFirstSync = useRef(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (isFirstSync.current) {
      isFirstSync.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function setTheme(t: Theme) {
    isFirstSync.current = false;
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
  }

  function toggleTheme() {
    isFirstSync.current = false;
    setThemeState((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
