import { illustrationOf } from '../lib/backgrounds';
import { cardColor } from '../lib/colors';
import type { BackgroundImage, Note, NoteColor } from '../lib/types';

/**
 * Couleur de fond d'une carte : sa couleur, ou celle de son illustration si la carte est
 * restée « Papier » (l'aplat de couleur de l'ancien bandeau n'est pas perdu).
 */
export function tintOf(note: Pick<Note, 'color' | 'background'>): NoteColor {
  const ill = illustrationOf(note.background);
  return ill && cardColor(note.color) === 'default' ? ill.color : note.color;
}

/** Illustration en filigrane : grand emoji pâle, incliné, coupé par le coin bas droit (décision 56). */
export function Watermark({ value }: { value: string | null }) {
  const ill = illustrationOf(value);
  if (!ill) return null;
  return (
    <span className="watermark" aria-hidden="true">
      <span className="watermark-emoji">{ill.emoji}</span>
    </span>
  );
}

/** Bandeau en haut d'une carte, pour les images importées avant la charte (toujours affichées). */
export function Banner({ value, images, tall }: { value: string | null; images: BackgroundImage[]; tall?: boolean }) {
  if (!value?.startsWith('img:')) return null;
  const img = images.find((i) => `img:${i.id}` === value);
  if (!img?.dataUrl) return null;
  return <div className={`banner ${tall ? 'tall' : ''}`} style={{ backgroundImage: `url(${img.dataUrl})` }} />;
}
