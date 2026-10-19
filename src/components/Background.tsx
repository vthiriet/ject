import { illustrationOf } from '../lib/backgrounds';
import type { BackgroundImage } from '../lib/types';

/** Emoji penché vers la droite ou la gauche, toujours du même côté pour un même emoji. */
const sideOf = (emoji: string) => ([...emoji].reduce((a, c) => a + (c.codePointAt(0) ?? 0), 0) % 2 ? 'right' : 'left');

/** Bandeau d'illustration en haut d'une carte : aplat de couleur + grand emoji incliné (décision 16). */
export function Banner({ value, images, tall }: { value: string | null; images: BackgroundImage[]; tall?: boolean }) {
  if (!value) return null;
  const cls = `banner ${tall ? 'tall' : ''}`;
  const ill = illustrationOf(value);
  if (ill) {
    return (
      <div className={`${cls} illustration`} data-color={ill.color}>
        <span className={`banner-emoji ${sideOf(ill.emoji)}`} aria-hidden="true">{ill.emoji}</span>
      </div>
    );
  }
  // Images importées avant la charte : toujours affichées.
  const img = images.find((i) => `img:${i.id}` === value);
  if (!img?.dataUrl) return null;
  return <div className={cls} style={{ backgroundImage: `url(${img.dataUrl})` }} />;
}
