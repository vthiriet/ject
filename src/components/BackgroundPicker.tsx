import { useState } from 'react';
import { illustrationOf, illustrationValue, PRESET_BACKGROUNDS } from '../lib/backgrounds';
import { cardColor, COLOR_IDS, NOTE_COLORS } from '../lib/colors';
import { deleteBackgroundImage, updateNote } from '../lib/store';
import type { BackgroundImage, Note } from '../lib/types';
import { Dialog } from './Dialog';
import { EmojiPicker } from './EmojiPicker';
import { Icon } from './Icon';

/**
 * Couleur et illustration d'une carte (décisions 8, 24, 57) : 7 pastilles rondes, la galerie
 * d'illustrations et n'importe quel emoji. L'illustration n'a pas de couleur propre : les
 * vignettes s'affichent sur la couleur de la carte.
 */
export function BackgroundPicker({ note, images }: { note: Note; images: BackgroundImage[] }) {
  const current = illustrationOf(note.background)?.emoji;
  const tint = cardColor(note.color);
  // Sélecteur de tous les emoji (recherche en français), ouvert à la demande.
  const [choosing, setChoosing] = useState(false);
  const isPreset = PRESET_BACKGROUNDS.some((p) => p.emoji === current);
  const ownImages = images.filter((img) => note.background === `img:${img.id}`);

  return (
    <div className="panel picker">
      <p className="section-label">Couleur</p>
      <div className="swatches colors" role="radiogroup" aria-label="Couleur de la carte">
        {COLOR_IDS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={cardColor(note.color) === c}
            className={`swatch ${cardColor(note.color) === c ? 'selected' : ''}`}
            data-color={c}
            title={NOTE_COLORS[c][0]}
            aria-label={NOTE_COLORS[c][0]}
            onClick={() => void updateNote(note.id, { color: c })}
          >
            {cardColor(note.color) === c && <Icon name="check" size={20} />}
          </button>
        ))}
      </div>

      <p className="section-label">Illustration</p>
      <div className="swatches backgrounds">
        <button
          type="button"
          className={`bg-thumb none ${!note.background ? 'selected' : ''}`}
          aria-label="Aucune illustration"
          title="Aucune"
          onClick={() => void updateNote(note.id, { background: null })}
        >
          <Icon name="close" size={20} />
        </button>
        {PRESET_BACKGROUNDS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`bg-thumb ${current === p.emoji ? 'selected' : ''}`}
            data-color={tint}
            title={p.name}
            aria-label={p.name}
            onClick={() => void updateNote(note.id, { background: illustrationValue(p.emoji) })}
          >
            <span className="thumb-emoji">{p.emoji}</span>
          </button>
        ))}
        {current && !isPreset && (
          <button type="button" className="bg-thumb selected" data-color={tint} aria-label={`Mon illustration : ${current}`}>
            <span className="thumb-emoji">{current}</span>
          </button>
        )}
        {ownImages.map((img) => (
          <span key={img.id} className="bg-thumb-wrap">
            <span className="bg-thumb selected" style={{ backgroundImage: `url(${img.dataUrl})` }} aria-label="Image importée" />
            <button
              type="button"
              className="bg-delete"
              aria-label="Retirer cette image"
              title="Retirer cette image"
              onClick={() => {
                if (confirm('Retirer cette image ? Les cartes qui l’utilisent perdront leur illustration.')) {
                  void deleteBackgroundImage(img.id);
                }
              }}
            >
              <Icon name="close" size={14} />
            </button>
          </span>
        ))}
      </div>

      <button type="button" className="emoji-choice" aria-expanded={choosing} onClick={() => setChoosing(true)}>
        <Icon name="add" size={20} />
        <span>Autre emoji</span>
      </button>
      {choosing && (
        <Dialog title="Choisir un emoji" onClose={() => setChoosing(false)} className="emoji-dialog">
          <EmojiPicker
            onPick={(e) => {
              void updateNote(note.id, { background: illustrationValue(e) });
              setChoosing(false);
            }}
          />
        </Dialog>
      )}
    </div>
  );
}
