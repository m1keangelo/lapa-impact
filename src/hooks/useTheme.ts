/**
 * Theme state — dark is the designed-first default (no class on <html>);
 * the light theme is applied by adding `.light`. Persisted in localStorage.
 */
import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
const THEME_KEY = 'lapa:theme';

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  return 'dark';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}

/** Apply persisted theme before first paint (call once in main.tsx). */
export function bootstrapTheme() {
  applyTheme(initialTheme());
}
