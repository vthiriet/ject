import { useState } from 'react';
import { illustrationOf, illustrationValue, PRESET_BACKGROUNDS } from '../lib/backgrounds';
import { cardColor, COLOR_IDS, NOTE_COLORS, type CardColor } from '../lib/colors';
import { deleteBackgroundImage, updateNote } from '../lib/store';
import type { BackgroundImage, Note } from '../lib/types';
import { Icon } from './Icon';

/** Premier emoji (ou caractère) d'un texte saisi. */
const firstEmoji = (s: string) => {
  const seg = new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(s.trim());
  return [...seg][0]?.segment ?? '';
};

/**
 * Couleur et illustration d'une carte (décisions 8, 16, 17, 24) : 7 pastilles rondes, la galerie
 * d'illustrations, et une illustration à composer soi-même (un emoji + une couleur).
 */
export function BackgroundPicker({ note, images }: { note: Note; images: BackgroundImage[] }) {
  const current = illustrationOf(note.background);
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState<CardColor>(cardColor(note.color));
  const custom = firstEmoji(emoji);
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
            className={`bg-thumb ${note.background === `preset:${p.id}` ? 'selected' : ''}`}
            data-color={p.color}
            title={p.name}
            aria-label={p.name}
            onClick={() => void updateNote(note.id, { background: `preset:${p.id}` })}
          >
            <span className="thumb-emoji">{p.emoji}</span>
          </button>
        ))}
        {current && note.background?.startsWith('ill:') && (
          <button type="button" className="bg-thumb selected" data-color={current.color} aria-label="Mon illustration">
            <span className="thumb-emoji">{current.emoji}</span>
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

      <p className="section-label">Créer une illustration</p>
      <div className="illus-maker">
        <input
          className="text-input emoji-input"
          value={emoji}
          placeholder="🙂"
          aria-label="Emoji de l’illustration"
          onChange={(e) => setEmoji(e.target.value)}
        />
        <div className="swatches mini" role="radiogroup" aria-label="Couleur de l’illustration">
          {COLOR_IDS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={NOTE_COLORS[c][0]}
              title={NOTE_COLORS[c][0]}
              className={`swatch ${color === c ? 'selected' : ''}`}
              data-color={c}
              onClick={() => setColor(c)}
            >
              {color === c && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn primary"
          disabled={!custom}
          onClick={() => {
            void updateNote(note.id, { background: illustrationValue({ emoji: custom, color }) });
            setEmoji('');
          }}
        >
          Utiliser
        </button>
      </div>
    </div>
  );
}
