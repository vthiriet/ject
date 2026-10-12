import { useMemo, useState } from 'react';
import { fileInboxItems, trashNote, type FileTarget } from '../lib/store';
import { normalize } from '../lib/text';
import type { Label, Note } from '../lib/types';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { LinkedText } from './LinkedText';
import { toast } from './Toast';

interface Props {
  /** Éléments à ranger, dans l'ordre. */
  ids: string[];
  notes: Note[];
  labels: Label[];
  onClose: () => void;
}

const listName = (n: Note) => n.title.trim() || n.items.find((i) => i.text.trim())?.text || 'Liste sans titre';

/** Mode « Ranger » : on passe les éléments de l'inbox un par un et on choisit leur liste. */
export function FileDialog({ ids, notes, labels, onClose }: Props) {
  const [queue] = useState(ids);
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [filed, setFiled] = useState(0);

  const item = notes.find((n) => n.id === queue[index]);
  const lists = useMemo(
    () =>
      notes
        .filter((n) => n.type === 'list' && !n.inbox && n.trashedAt === null && !n.archived)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [notes],
  );
  const q = normalize(query.trim());
  const shown = q ? lists.filter((l) => normalize(listName(l)).includes(q)) : lists;
  const exact = lists.some((l) => normalize(listName(l)) === q);

  const finish = (count: number) => {
    onClose();
    if (count) toast(`${count} élément${count > 1 ? 's' : ''} rangé${count > 1 ? 's' : ''}`);
  };

  const next = (didFile: boolean) => {
    const count = filed + (didFile ? 1 : 0);
    setFiled(count);
    setQuery('');
    // Saute les éléments supprimés entre-temps.
    let i = index + 1;
    while (i < queue.length && !notes.some((n) => n.id === queue[i])) i++;
    if (i >= queue.length) finish(count);
    else setIndex(i);
  };

  const file = async (target: FileTarget) => {
    if (!item) return;
    await fileInboxItems([item.id], target);
    next(true);
  };

  if (!item) {
    return (
      <Dialog title="Ranger" onClose={onClose}>
        <p className="hint">Plus rien à ranger.</p>
      </Dialog>
    );
  }

  const text = [item.title, item.content].filter((t) => t.trim()).join('\n');
  const itemLabels = item.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean) as Label[];

  return (
    <Dialog
      title={queue.length > 1 ? `Ranger · ${index + 1} / ${queue.length}` : 'Ranger'}
      onClose={() => finish(filed)}
      className="file-dialog"
      footer={
        <>
          <button type="button" className="btn" onClick={() => void trashNote(item.id).then(() => next(false))}>
            <Icon name="trash" size={18} /> Supprimer
          </button>
          {queue.length > 1 && (
            <button type="button" className="btn" onClick={() => next(false)}>
              Passer <Icon name="next" size={18} />
            </button>
          )}
        </>
      }
    >
      <div className="file-item">
        <LinkedText text={text} />
        {itemLabels.length > 0 && <small>{itemLabels.map((l) => `${l.emoji} ${l.name}`).join(' · ')}</small>}
      </div>

      <p className="section-label">Ranger dans…</p>
      <input
        className="text-input"
        value={query}
        placeholder="Chercher une liste ou en créer une"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          if (shown.length === 1) void file({ listId: shown[0].id });
          else if (query.trim() && !exact) void file({ newTitle: query });
        }}
      />
      <ul className="file-targets">
        {query.trim() && !exact && (
          <li>
            <button type="button" className="file-target new" onClick={() => void file({ newTitle: query })}>
              <Icon name="add" size={20} /> Nouvelle liste « {query.trim()} »
            </button>
          </li>
        )}
        {shown.map((l) => (
          <li key={l.id}>
            <button type="button" className="file-target" data-color={l.color} onClick={() => void file({ listId: l.id })}>
              <Icon name="checked" size={20} />
              <span>{listName(l)}</span>
              <small>{l.items.filter((i) => !i.checked && !i.exported && i.text.trim()).length}</small>
            </button>
          </li>
        ))}
        {!lists.length && !query.trim() && <li className="hint">Aucune liste pour l’instant : tape un nom pour en créer une.</li>}
        <li>
          <button type="button" className="file-target ghost" onClick={() => void file({ asNote: true })}>
            <Icon name="notes" size={20} /> Garder comme note séparée
          </button>
        </li>
      </ul>
    </Dialog>
  );
}
