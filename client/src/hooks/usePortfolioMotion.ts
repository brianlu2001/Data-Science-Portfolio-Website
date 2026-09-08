import { useSyncExternalStore } from 'react';
import { useReducedMotion } from 'framer-motion';

let override: boolean | null = null;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

export function usePortfolioMotion() {
  const systemReduced = useReducedMotion();
  const enabled = useSyncExternalStore(subscribe, () => override, () => null);
  const reducedMotion = enabled === null ? !!systemReduced : !enabled;
  const toggleMotion = () => { override = reducedMotion; listeners.forEach(listener => listener()); };
  return { reducedMotion, toggleMotion };
}
