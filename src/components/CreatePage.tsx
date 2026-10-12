import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, categoryOf } from '../lib/gtd';
import { createFromForm } from '../lib/store';
import { normalize } from '../lib/text';
import type { Category, Label, Note } from '../lib/types';
import { DetailsFields, EMPTY_DETAILS, type Details } from './DetailsFields';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { Segmented } from './Segmented';
import { toast } from './Toast';

interface Props {
  category: Category;
  notes: Note[];
  labels: Label[];
  /** Aire filtrée à l'écran, proposée par défaut. */
  labelId: string | null;
  onClose: () => void;
  onCreated: (category: Category) => void;
}

/** « Nouvelle » ou « existante » selon le genre du mot. */
const NEW_LABEL: Record<Category, [string, string, string]> = {
  action: ['Nouvelle action', 'Action existante', 'Ajouter à une action existante'],
  habit: ['Nouvelle habitude', 'Habitude existante', 'Ajouter à une habitude existante'],
  project: ['Nouveau projet', 'Projet existant', 'Ajouter à un projet existant'],
  resource: ['Nouvelle ressource', 'Ressource existante', 'Ajouter à une ressource existante'],
};

const CREATED: Record<Category, string> = {
  action: 'Action créée',
  habit: 'Habitude créée',
  project: 'Projet créé',
  resource: 'Ressource créée',
};

const listName = (n: Note) => n.title.trim() || n.items.find((i) => i.text.trim())?.text || 'Liste sans titre';

/** Page de création ouverte par le bouton + : format, destination, précisions. */
export function CreatePage({ category: initial, notes, labels, labelId, onClose, onCreated }: Props) {
  const [category, setCategory] = useState<Category>(initial);
  const [format, setFormat] = useState<'single' | 'list'>('single');
  const [target, setTarget] = useState<'new' | 'existing'>('new');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<string[]>(['']);
  const [listId, setListId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [details, setDetails] = useState<Details>({ ...EMPTY_DETAILS, labelIds: labelId ? [labelId] : [] });
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Curseur prêt à écrire dès l'ouverture.
  useLayoutEffect(() => {
    textRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (focusIndex === null) return;
    itemRefs.current[focusIndex]?.focus();
    setFocusIndex(null);
  }, [focusIndex, items]);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 96)}px`;
  }, [text, format]);

  const lists = useMemo(
    () =>
      notes
        .filter((n) => n.type === 'list' && !n.inbox && n.trashedAt === null && !n.archived && categoryOf(n) === category)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [notes, category],
  );
  const q = normalize(query.trim());
  const shown = q ? lists.filter((l) => normalize(listName(l)).includes(q)) : lists;
  const chosen = lists.find((l) => l.id === listId);

  const filled = format === 'single' ? !!text.trim() : items.some((i) => i.trim());
  const canCreate = filled && (target === 'new' || !!chosen);
  const [newLabel, existingLabel, addTitle] = NEW_LABEL[category];

  const switchFormat = (f: 'single' | 'list') => {
    // Le texte saisi passe d'un format à l'autre sans être perdu.
    if (f === 'list' && format === 'single') {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      setItems(lines.length ? lines : ['']);
      setFocusIndex(Math.max(lines.length - 1, 0));
    }
    if (f === 'single' && format === 'list') setText(items.filter((i) => i.trim()).join('\n'));
    setFormat(f);
  };

  const create = async () => {
    if (!canCreate) return;
    const existing = target === 'existing' ? chosen?.id : undefined;
    await createFromForm(
      format === 'single' ? { format, text, listId: existing } : { format, title, items, listId: existing },
      { category, ...details, frequency: details.frequency || undefined },
    );
    toast(existing ? `Ajouté à « ${listName(chosen!)} »` : CREATED[category]);
    onCreated(category);
  };

  const onItemKey = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = [...items];
      next.splice(i + 1, 0, '');
      setItems(next);
      setFocusIndex(i + 1);
    } else if (e.key === 'Backspace' && items[i] === '' && items.length > 1) {
      e.preventDefault();
      setItems(items.filter((_, k) => k !== i));
      setFocusIndex(Math.max(i - 1, 0));
    }
  };

  return (
    <Dialog
      title={target === 'existing' ? addTitle : newLabel}
      onClose={onClose}
      className="file-dialog create-page"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Annuler</button>
          <button type="button" className="btn primary" disabled={!canCreate} onClick={() => void create()}>
            {target === 'existing' ? 'Ajouter' : 'Créer'}
          </button>
        </>
      }
    >
      <div className="type-grid four" role="radiogroup" aria-label="Type">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={category === c.id}
            className={`type-chip ${category === c.id ? 'on' : ''}`}
            onClick={() => {
              setCategory(c.id);
              setListId(null);
            }}
          >
            <Icon name={c.icon} size={16} /> {c.label}
          </button>
        ))}
      </div>

      <div className="create-switches">
        <Segmented value={format} options={[['single', 'Unique'], ['list', 'Liste']]} onChange={(v) => switchFormat(v as 'single' | 'list')} />
        <Segmented value={target} options={[['new', newLabel], ['existing', existingLabel]]} onChange={(v) => setTarget(v as 'new' | 'existing')} />
      </div>

      {format === 'single' ? (
        <textarea
          ref={textRef}
          className="text-input create-text"
          value={text}
          placeholder={target === 'existing' ? 'Élément à ajouter' : 'Écris ici…'}
          onChange={(e) => setText(e.target.value)}
        />
      ) : (
        <div className="create-list">
          {target === 'new' && (
            <input className="text-input create-title" value={title} placeholder="Titre de la liste" onChange={(e) => setTitle(e.target.value)} />
          )}
          {items.map((it, i) => (
            <div key={i} className="create-item">
              <Icon name="unchecked" size={20} />
              <input
                ref={(el) => { itemRefs.current[i] = el; }}
                className="text-input flat"
                value={it}
                placeholder="Élément de liste"
                enterKeyHint="next"
                onChange={(e) => setItems(items.map((x, k) => (k === i ? e.target.value : x)))}
                onKeyDown={(e) => onItemKey(e, i)}
              />
            </div>
          ))}
          <button type="button" className="add-item" onClick={() => { setItems([...items, '']); setFocusIndex(items.length); }}>
            <Icon name="add" size={20} /> Élément de liste
          </button>
        </div>
      )}

      {target === 'existing' && (
        <>
          <p className="section-label">Dans quelle liste ?</p>
          {lists.length > 5 && (
            <input className="text-input" value={query} placeholder="Chercher" onChange={(e) => setQuery(e.target.value)} />
          )}
          <ul className="file-targets">
            {shown.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  className={`file-target ${listId === l.id ? 'selected' : ''}`}
                  data-color={l.color}
                  aria-pressed={listId === l.id}
                  onClick={() => setListId(l.id)}
                >
                  <Icon name={listId === l.id ? 'checked' : 'unchecked'} size={20} />
                  <span>{listName(l)}</span>
                  <small>{l.items.filter((i) => !i.checked && !i.exported && i.text.trim()).length}</small>
                </button>
              </li>
            ))}
            {!lists.length && <li className="hint">Aucune liste de ce type pour l’instant : choisis « {newLabel} ».</li>}
          </ul>
        </>
      )}

      <DetailsFields category={category} value={details} onChange={setDetails} labels={labels} title="Précisions et aires (facultatif)" />
    </Dialog>
  );
}
