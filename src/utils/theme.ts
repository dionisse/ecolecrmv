import { useSyncExternalStore } from 'react';

/* ---------- Theme (dark/light with system default) ---------- */
export type Theme = 'light' | 'dark';
const THEME_KEY = 'ecolecrm.theme';
const listeners = new Set<() => void>();
let currentTheme: Theme =
  (typeof localStorage !== 'undefined' && (localStorage.getItem(THEME_KEY) as Theme)) ||
  (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

function applyTheme(t: Theme) {
  currentTheme = t;
  try { localStorage.setItem(THEME_KEY, t); } catch {}
  document.documentElement.classList.toggle('dark', t === 'dark');
  listeners.forEach((l) => l());
}

export function useTheme() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => currentTheme,
    () => 'light' as Theme
  );
}

export function initTheme() { applyTheme(currentTheme); }
export function toggleTheme() { applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
export function setTheme(t: Theme) { applyTheme(t); }
