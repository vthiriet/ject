import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, categoryOf } from '../lib/gtd';
import { fileInboxItems, trashNote, type FileDetails, type FileTarget } from '../lib/store';
import { normalize } from '../lib/text';
import type { Category, Label, Note } from '../lib/types';
import { Dialog } from './Dialog';
import { FrequencyPicker } from './FrequencyPicker';
import { Icon } from './Icon';
import { Segmented } from './Segmented';
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

/** Mode « Ranger » : pour chaque élément de l'inbox, choisir son type, puis sa destination. */
export function FileDialog({ ids, notes, labels, onClose }: Props) {
  const [queue] = useState(ids);
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [filed, setFiled] = useState(0);
  const item = notes.find((n) => n.id === queue[index]);

  // Précisions, remises à zéro pour chaque élément.
  const [category, setCategory] = useState<Category | null>(item?.category ?? null);
  const [status, setStatus] = useState<FileDetails['status']>('todo');
  const [projectStatus, setProjectStatus] = useState<FileDetails['projectStatus']>('active');
  const [frequency, setFrequency] = useState('');
  const [labelIds, setLabelIds] = useState<string[]>([]);

  useEffect(() => {
    setCategory(item?.category ?? null);
    setStatus('todo');
    setProjectStatus('active');
    setFrequency('');
    setLabelIds(item?.labelIds ?? []);
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
    await fileInboxItems([item.id], target, { category, status, projectStatus, frequency: frequency || undefined, labelIds });
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
  const toggleLabel = (id: string) => setLabelIds(labelIds.includes(id) ? labelIds.filter((l) => l !== id) : [...labelIds, id]);

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
      </div>

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
          {category !== 'resource' && <p className="section-label">2. Précisions (facultatif)</p>}
          {category === 'action' && (
            <Segmented
              value={status ?? 'todo'}
              options={[['todo', 'À faire'], ['waiting', 'En attente'], ['someday', 'Un jour']]}
              onChange={(v) => setStatus(v as FileDetails['status'])}
            />
          )}
          {category === 'project' && (
            <Segmented
              value={projectStatus ?? 'active'}
              options={[['active', 'Actif'], ['someday', 'Un jour']]}
              onChange={(v) => setProjectStatus(v as FileDetails['projectStatus'])}
            />
          )}
          {category === 'habit' && <FrequencyPicker value={frequency} onChange={setFrequency} />}

          {labels.length > 0 && (
            <p className="section-label">Aire (facultatif)</p>
          )}
          {labels.length > 0 && (
            <div className="chips file-aires" aria-label="Aires">
              {labels.map((l) => (
                <button key={l.id} type="button" className={`chip ${labelIds.includes(l.id) ? 'on' : ''}`} onClick={() => toggleLabel(l.id)}>
                  {l.emoji} {l.name}
                </button>
              ))}
            </div>
          )}

          <p className="section-label">{category === 'resource' ? '2' : '3'}. Ranger dans…</p>
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
            <li>
              <button type="button" className="file-target new" onClick={() => void file({ newCard: true })}>
                <Icon name="add" size={20} /> Carte seule dans {CATEGORIES.find((c) => c.id === category)!.plural}
              </button>
            </li>
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
            {!lists.length && !query.trim() && (
              <li className="hint">Aucune liste de ce type : tape un nom pour en créer une.</li>
            )}
          </ul>
        </>
      )}
    </Dialog>
  );
}
