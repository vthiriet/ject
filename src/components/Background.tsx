import { findPreset } from '../lib/backgrounds';
import type { BackgroundImage } from '../lib/types';

/** Bandeau d'illustration en haut d'une note (galerie intégrée ou image importée). */
export function Banner({ value, images, tall }: { value: string | null; images: BackgroundImage[]; tall?: boolean }) {
  if (!value) return null;
  const cls = `banner ${tall ? 'tall' : ''}`;
  if (value.startsWith('preset:')) {
    const p = findPreset(value.slice(7));
    if (!p) return null;
    return (
      <div className={`${cls} preset`} style={{ '--bg-light': p.light, '--bg-dark': p.dark } as React.CSSProperties}>
        <span className="banner-emoji" aria-hidden="true">{p.emoji}</span>
        <span className="banner-emoji small" aria-hidden="true">{p.emoji}</span>
        <span className="banner-emoji tiny" aria-hidden="true">{p.emoji}</span>
      </div>
    );
  }
  const img = images.find((i) => `img:${i.id}` === value);
  if (!img?.dataUrl) return null;
  return <div className={cls} style={{ backgroundImage: `url(${img.dataUrl})` }} />;
}
