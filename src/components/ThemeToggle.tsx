import { useEffect, useState } from "react";
import { getStoredTheme, resolveTheme, saveTheme, type Theme } from "../lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(getStoredTheme()));

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      if (!getStoredTheme()) {
        setTheme(resolveTheme(null));
      }
    };
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function handleToggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    saveTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
