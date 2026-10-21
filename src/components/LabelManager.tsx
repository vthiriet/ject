import { useState } from 'react';
import { createLabel, deleteLabel, updateLabel } from '../lib/store';
import type { Label } from '../lib/types';
import { Dialog } from './Dialog';
import { IconButton } from './Icon';

const EMOJIS = ['🏷️', '🩺', '💰', '👨‍👩‍👧', '💡', '🛒', '🚀', '📚', '🎬', '🎵', '✈️', '🍲', '🎁', '💼', '🏠', '❤️', '⭐', '📝', '🔧'];

/** Créer, renommer, changer l'emoji ou supprimer les libellés. */
export function LabelManager({ labels, onClose }: { labels: Label[]; onClose: () => void }) {
  const [name, setName] = useState('');
  const [emojiFor, setEmojiFor] = useState<string | null>(null);

  const add = async () => {
    if (!name.trim() || labels.some((l) => l.name.toLowerCase() === name.trim().toLowerCase())) return;
    await createLabel(name);
    setName('');
  };

  return (
    <Dialog title="Modifier les catégories" onClose={onClose}>
      <form className="row" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <input className="text-input" value={name} placeholder="Nouvelle catégorie (ex. Santé, Maison)" onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="btn primary">Créer</button>
      </form>
      <ul className="label-manage">
        {labels.map((l) => (
          <li key={l.id}>
            <button type="button" className="emoji-btn" aria-label="Changer l'emoji" onClick={() => setEmojiFor(emojiFor === l.id ? null : l.id)}>{l.emoji}</button>
            <input
              className="text-input flat"
              defaultValue={l.name}
              aria-label="Nom de la catégorie"
              onBlur={(e) => e.target.value.trim() && e.target.value !== l.name && void updateLabel(l.id, { name: e.target.value.trim() })}
            />
            <IconButton
              name="trash"
              label="Supprimer la catégorie"
              onClick={() => confirm(`Supprimer la catégorie « ${l.name} » ? Les cartes ne seront pas supprimées.`) && void deleteLabel(l.id)}
            />
            {emojiFor === l.id && (
              <div className="emoji-grid">
                {EMOJIS.map((em) => (
                  <button key={em} type="button" onClick={() => { void updateLabel(l.id, { emoji: em }); setEmojiFor(null); }}>{em}</button>
                ))}
              </div>
            )}
          </li>
        ))}
        {!labels.length && <li className="hint">Aucune catégorie pour l’instant : Santé, Maison, Finances, Travail…</li>}
      </ul>
    </Dialog>
  );
}
