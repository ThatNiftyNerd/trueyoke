import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Light/dark toggle for the public landing page. Reads and writes through
 * the same ThemeProvider context (and localStorage key) as the in-app
 * toggle in DisplaySettingsPanel, so a visitor's explicit choice here
 * carries over once they sign up — no jarring switch back to light after
 * account creation.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex items-center justify-center rounded-full border border-app-accent/40 p-1.5 text-app-ink/70 transition-colors hover:text-app-ink sm:p-2 ${className}`.trim()}
    >
      {isDark ? (
        <Sun className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
      )}
    </button>
  );
}
