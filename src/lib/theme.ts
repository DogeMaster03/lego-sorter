const THEME_KEY = "bricksort:theme";

export type Theme = "light" | "dark";

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getStoredTheme(): Theme | null {
  const value = localStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function resolveTheme(theme: Theme | null): Theme {
  if (theme) return theme;
  return prefersDark() ? "dark" : "light";
}

export function applyTheme(theme: Theme | null): Theme {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function initTheme(): Theme {
  return applyTheme(getStoredTheme());
}

export function toggleTheme(): Theme {
  const next: Theme = resolveTheme(getStoredTheme()) === "dark" ? "light" : "dark";
  saveTheme(next);
  return next;
}
