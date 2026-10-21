import { useEffect, useRef } from 'react';

/**
 * Sélecteur de tous les emoji, avec recherche en français (bibliothèque emoji-picker-element).
 * Les données (~400 Ko) ne sont chargées qu'à la première ouverture, puis gardées par le navigateur.
 */
export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    let picker: HTMLElement | null = null;
    let cancelled = false;
    void Promise.all([import('emoji-picker-element'), import('emoji-picker-element/i18n/fr')]).then(([, fr]) => {
      if (cancelled || !host.current) return;
      const el = document.createElement('emoji-picker') as HTMLElement & { i18n: unknown; locale: string; dataSource: string };
      el.locale = 'fr';
      el.dataSource = '/emoji/fr.json';
      el.i18n = fr.default;
      // Suit le thème choisi dans l'app (clair, sombre ou automatique).
      const dark = getComputedStyle(document.documentElement).colorScheme.includes('dark');
      el.classList.add(dark ? 'dark' : 'light');
      el.addEventListener('emoji-click', (e) => {
        const unicode = (e as CustomEvent<{ unicode?: string }>).detail.unicode;
        if (unicode) pick.current(unicode);
      });
      host.current.appendChild(el);
      picker = el;
    });
    return () => {
      cancelled = true;
      picker?.remove();
    };
  }, []);

  return <div ref={host} className="emoji-picker-host" />;
}
