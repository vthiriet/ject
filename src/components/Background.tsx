import { illustrationOf } from '../lib/backgrounds';
import type { BackgroundImage } from '../lib/types';

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
