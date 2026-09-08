import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'portfolio-motion-enabled-v1';
function readPreference() {
  try { return window.localStorage.getItem(STORAGE_KEY) !== 'false'; }
  catch { return true; }
}

// Start with motion on, regardless of the device's reduced-motion preference.
// Only an explicit choice made with the site's toggle disables it.
let enabled = typeof window === 'undefined' ? true : readPreference();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
const onStorage = (event: StorageEvent) => {
  if (event.key === STORAGE_KEY || event.key === null) {
    enabled = readPreference();
    notify();
  }
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
};
const getSnapshot = () => enabled;
const getServerSnapshot = () => true;
const toggleMotion = () => {
  enabled = !enabled;
  try { window.localStorage.setItem(STORAGE_KEY, String(enabled)); }
  catch { /* The toggle still works for this visit if storage is unavailable. */ }
  notify();
};

export function usePortfolioMotion() {
  const motionEnabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { reducedMotion: !motionEnabled, toggleMotion };
}
