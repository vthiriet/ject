import { useState } from 'react';
import { createLabel, updateNote } from '../lib/store';
import type { Label, Note } from '../lib/types';
import { Icon } from './Icon';

/** Cocher / décocher les libellés d'une note, ou en créer un nouveau. */
export function LabelPicker({ note, labels }: { note: Note; labels: Label[] }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = labels.filter((l) => l.name.toLowerCase().includes(q));
  const exact = labels.some((l) => l.name.toLowerCase() === q);

  const toggle = (id: string) =>
    updateNote(note.id, {
      labelIds: note.labelIds.includes(id) ? note.labelIds.filter((l) => l !== id) : [...note.labelIds, id],
    });

  const create = async () => {
    const label = await createLabel(query);
    await updateNote(note.id, { labelIds: [...note.labelIds, label.id] });
    setQuery('');
  };

  return (
    <div className="panel picker">
      <input
        className="text-input"
        value={query}
        placeholder="Chercher ou créer une catégorie"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && q && !exact && void create()}
      />
      <ul className="label-options">
        {shown.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => void toggle(l.id)}>
              <Icon name={note.labelIds.includes(l.id) ? 'checked' : 'unchecked'} size={20} />
              <span>{l.emoji} {l.name}</span>
            </button>
          </li>
        ))}
        {q && !exact && (
          <li>
            <button type="button" onClick={() => void create()}>
              <Icon name="add" size={20} /> Créer « {query.trim()} »
            </button>
          </li>
        )}
        {!labels.length && !q && <li className="hint">Aucune catégorie pour l’instant : tape un nom pour en créer une.</li>}
      </ul>
    </div>
  );
}
