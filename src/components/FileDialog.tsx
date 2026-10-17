import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, categoryOf } from '../lib/gtd';
import { fileInboxItems, trashNote, type FileTarget } from '../lib/store';
import { normalize } from '../lib/text';
import type { Category, Note } from '../lib/types';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { LinkedText } from './LinkedText';
import { toast } from './Toast';

interface Props {
  /** Éléments à ranger, dans l'ordre. */
  ids: string[];
  /** Tous les éléments vont ensemble au même endroit (sélection multiple). */
  together?: boolean;
  notes: Note[];
  onClose: () => void;
}

const listName = (n: Note) => n.title.trim() || n.items.find((i) => i.text.trim())?.text || 'Liste sans titre';

/** Mode « Ranger » : pour chaque élément de l'inbox, choisir son type, puis sa destination. */
export function FileDialog({ ids, together = false, notes, onClose }: Props) {
  const [queue] = useState(ids);
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [filed, setFiled] = useState(0);
  const item = notes.find((n) => n.id === queue[index]);
  const group = together ? queue.map((id) => notes.find((n) => n.id === id)).filter((n): n is Note => !!n) : [];

  // Type commun à tous les éléments sélectionnés, s'il y en a un.
  const sharedCategory = () => {
    const cats = new Set(group.map((n) => n.category ?? null));
    return cats.size === 1 ? [...cats][0] : null;
  };

  // Type, remis à jour pour chaque élément.
  const [category, setCategory] = useState<Category | null>(together ? sharedCategory() : item?.category ?? null);

  useEffect(() => {
    if (together) return;
    setCategory(item?.category ?? null);
    setQuery('');
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const lists = useMemo(
    () =>
      notes
        .filter((n) => n.type === 'list' && !n.inbox && n.trashedAt === null && !n.archived && categoryOf(n) === category)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [notes, category],
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
    // Saute les éléments supprimés entre-temps.
    let i = index + 1;
    while (i < queue.length && !notes.some((n) => n.id === queue[i])) i++;
    if (i >= queue.length) finish(count);
    else setIndex(i);
  };

  const file = async (target: FileTarget) => {
    if (!item || !category) return;
    if (together) {
      await fileInboxItems(group.map((n) => n.id), target, { category });
      finish(group.length);
      return;
    }
    await fileInboxItems([item.id], target, { category, labelIds: item.labelIds });
    next(true);
  };

  if (!item) {
    return (
      <Dialog title="Ranger" onClose={onClose}>
        <p className="hint">Plus rien à ranger.</p>
      </Dialog>
    );
  }

  const textOf = (n: Note) =>
    n.type === 'list'
      ? [n.title, ...n.items.filter((i) => i.text.trim()).map((i) => `☐ ${i.text}`)].filter((t) => t.trim()).join('\n')
      : [n.title, n.content].filter((t) => t.trim()).join('\n');

  const removeAll = async () => {
    for (const n of group) await trashNote(n.id);
    onClose();
    toast(`${group.length} élément${group.length > 1 ? 's' : ''} supprimé${group.length > 1 ? 's' : ''}`);
  };

  return (
    <Dialog
      title={together ? `Ranger ${group.length} élément${group.length > 1 ? 's' : ''}` : queue.length > 1 ? `Ranger · ${index + 1} / ${queue.length}` : 'Ranger'}
      onClose={() => finish(filed)}
      className="file-dialog"
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={() => void (together ? removeAll() : trashNote(item.id).then(() => next(false)))}
          >
            <Icon name="trash" size={18} /> Supprimer
          </button>
          {queue.length > 1 && !together && (
            <button type="button" className="btn" onClick={() => next(false)}>
              Passer <Icon name="next" size={18} />
            </button>
          )}
        </>
      }
    >
      {together ? (
        <div className="file-item group">
          {group.map((n) => (
            <div key={n.id}>
              <LinkedText text={textOf(n)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="file-item">
          <LinkedText text={textOf(item)} />
        </div>
      )}

      <p className="section-label">1. C’est…</p>
      <div className="type-grid" role="radiogroup" aria-label="Type">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={category === c.id}
            className={`type-chip big ${category === c.id ? 'on' : ''}`}
            onClick={() => setCategory(c.id)}
          >
            <Icon name={c.icon} size={20} /> {c.label}
          </button>
        ))}
      </div>

      {!category ? (
        <p className="hint">Choisis un type pour voir où le ranger.</p>
      ) : (
        <>
          <p className="section-label">2. Ranger dans…</p>
          <button type="button" className="file-target new card-first" onClick={() => void file({ newCard: true })}>
            <Icon name="add" size={20} /> {together && group.length > 1 ? `${group.length} cartes seules dans` : 'Carte seule dans'}{' '}
            {CATEGORIES.find((c) => c.id === category)!.plural}
          </button>
          <input
            className="text-input"
            value={query}
            placeholder="Chercher ou créer une liste"
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
                  <span>{listName(l)}</span>
                  <small>{l.items.filter((i) => !i.checked && !i.exported && i.text.trim()).length}</small>
                </button>
              </li>
            ))}
            {!lists.length && !query.trim() && (
              <li className="hint">Aucune liste de ce type : tape un nom pour en créer une.</li>
            )}
          </ul>
        </>
      )}
    </Dialog>
  );
}
