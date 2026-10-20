import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { db } from './db';
import { syncState } from './sync';
import type { BackgroundImage, Label, Note } from './types';

const EMPTY: never[] = [];

export function useNotes(): Note[] {
  return useLiveQuery(() => db.notes.filter((n) => !n.deleted).toArray(), [], EMPTY);
}

/** La base locale a-t-elle répondu au moins une fois ? (sinon : chargement, pas « vide »). */
export function useDbReady(): boolean {
  return useLiveQuery(() => db.notes.count().then(() => true), [], false);
}

export function useLabels(): Label[] {
  const labels = useLiveQuery(() => db.labels.filter((l) => !l.deleted).toArray(), [], EMPTY);
  return [...labels].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export function useBackgrounds(): BackgroundImage[] {
  const imgs = useLiveQuery(() => db.backgrounds.filter((b) => !b.deleted).toArray(), [], EMPTY);
  return [...imgs].sort((a, b) => b.createdAt - a.createdAt);
}

export function useSyncStatus() {
  return useSyncExternalStore(syncState.subscribe, syncState.get);
}

export type ThemePref = 'auto' | 'light' | 'dark';

function readLocal<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}

/** Petite préférence propre à cet appareil (thème, affichage…). */
export function useLocalPref<T extends string>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => readLocal(key, fallback));
  return [
    value,
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(key, v);
      } catch {}
    },
  ];
}

export function useTheme(): [ThemePref, (t: ThemePref) => void] {
  const [theme, setTheme] = useLocalPref<ThemePref>('ject-theme', 'auto');
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = theme;
    // Les barres du téléphone (état, navigation) prennent la couleur du thème affiché.
    const sync = () => {
      const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
        m.removeAttribute('media');
        m.setAttribute('content', bg);
      });
    };
    sync();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [theme]);
  return [theme, setTheme];
}
