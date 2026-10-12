import { useRef, useState } from 'react';
import { PRESET_BACKGROUNDS } from '../lib/backgrounds';
import { COLOR_IDS, NOTE_COLORS } from '../lib/colors';
import { resizeImage } from '../lib/images';
import { addBackgroundImage, deleteBackgroundImage, updateNote } from '../lib/store';
import type { BackgroundImage, Note } from '../lib/types';
import { Icon } from './Icon';
import { toast } from './Toast';

/** Choix de la couleur et de l'illustration de fond d'une note. */
export function BackgroundPicker({ note, images }: { note: Note; images: BackgroundImage[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const img = await addBackgroundImage(await resizeImage(file));
      await updateNote(note.id, { background: `img:${img.id}` });
    } catch {
      toast("Impossible de lire cette image");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="panel picker">
      <p className="section-label">Couleur</p>
      <div className="swatches">
        {COLOR_IDS.map((c) => (
          <button
            key={c}
            type="button"
            className={`swatch ${note.color === c ? 'selected' : ''}`}
            data-color={c}
            title={NOTE_COLORS[c][0]}
            aria-label={NOTE_COLORS[c][0]}
            onClick={() => void updateNote(note.id, { color: c })}
          >
            {c === 'default' && <span className="swatch-none" />}
            {note.color === c && <Icon name="check" size={18} />}
          </button>
        ))}
      </div>
      <p className="section-label">Illustration</p>
      <div className="swatches backgrounds">
        <button
          type="button"
          className={`bg-thumb none ${!note.background ? 'selected' : ''}`}
          title="Aucune"
          aria-label="Aucune illustration"
          onClick={() => void updateNote(note.id, { background: null })}
        >
          <span className="swatch-none" />
        </button>
        {PRESET_BACKGROUNDS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`bg-thumb preset ${note.background === `preset:${p.id}` ? 'selected' : ''}`}
            style={{ '--bg-light': p.light, '--bg-dark': p.dark } as React.CSSProperties}
            title={p.name}
            aria-label={p.name}
            onClick={() => void updateNote(note.id, { background: `preset:${p.id}` })}
          >
            {p.emoji}
          </button>
        ))}
        {images.map((img) => (
          <span key={img.id} className="bg-thumb-wrap">
            <button
              type="button"
              className={`bg-thumb ${note.background === `img:${img.id}` ? 'selected' : ''}`}
              style={{ backgroundImage: `url(${img.dataUrl})` }}
              aria-label="Mon image"
              onClick={() => void updateNote(note.id, { background: `img:${img.id}` })}
            />
            <button
              type="button"
              className="bg-delete"
              aria-label="Retirer cette image de ma galerie"
              title="Retirer de ma galerie"
              onClick={() => {
                if (confirm('Retirer cette image de ta galerie ? Les notes qui l’utilisent perdront leur illustration.')) {
                  void deleteBackgroundImage(img.id);
                }
              }}
            >
              <Icon name="close" size={14} />
            </button>
          </span>
        ))}
        <button type="button" className="bg-thumb import" onClick={() => fileRef.current?.click()} disabled={busy} title="Importer une image">
          <Icon name={busy ? 'sync' : 'upload'} size={20} />
          <span>Importer</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
    </div>
  );
}
