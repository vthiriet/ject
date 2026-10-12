import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { describe, logError } from '../lib/diagnostics';
import { CATEGORIES, categoryMeta } from '../lib/gtd';
import { createInboxItem, restoreNote, trashNote, updateNote } from '../lib/store';
import { extractLinks, formatDate } from '../lib/text';
import type { Category, Note } from '../lib/types';
import { Icon, IconButton } from './Icon';
import { LinkedText } from './LinkedText';
import { LinkPreviewCard } from './LinkPreview';
import { toast } from './Toast';

interface Props {
  items: Note[];
  /** Nombre total d'éléments (avant la recherche). */
  total: number;
  focusSignal: number;
  onFile: (ids: string[]) => void;
}

/** Onglet Inbox : déposer très vite des éléments bruts, puis les ranger. */
export function InboxView({ items, total, focusSignal, onFile }: Props) {
  const [text, setText] = useState('');
  /** Type pressenti (facultatif), remis à zéro après chaque ajout. */
  const [category, setCategory] = useState<Category | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusSignal) inputRef.current?.focus();
  }, [focusSignal]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  // La zone se vide aussitôt (saisie en rafale) ; en cas d'échec, le texte est remis.
  const add = async () => {
    const value = text;
    const type = category;
    if (!value.trim()) return;
    setText('');
    setCategory(null);
    inputRef.current?.focus();
    try {
      await createInboxItem(value, type ?? undefined);
    } catch (e) {
      setText((current) => (current ? `${value}\n${current}` : value));
      setCategory(type);
      logError(`Ajout inbox : ${describe(e)}`);
      toast(`Impossible d’enregistrer : ${describe(e)}`);
    }
  };


  return (
    <div className="inbox">
      <form className="capture" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <div className="capture-types" role="radiogroup" aria-label="Type (facultatif)">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={category === c.id}
              className={`type-chip ${category === c.id ? 'on' : ''}`}
              // Garde le clavier ouvert : le bouton ne prend pas le focus.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setCategory(category === c.id ? null : c.id)}
            >
              <Icon name={c.icon} size={16} /> {c.label}
            </button>
          ))}
        </div>
        <div className="capture-row">
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          placeholder="Une idée, une reco, une envie…"
          aria-label="Ajouter à l'inbox"
          enterKeyHint="send"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void add();
            }
          }}
        />
        <button type="submit" className="capture-send" aria-label="Ajouter" disabled={!text.trim()}>
          <Icon name="send" size={22} />
        </button>
        </div>
      </form>

      {total > 0 && (
        <div className="inbox-head">
          <span>{total} élément{total > 1 ? 's' : ''} à ranger</span>
          <button type="button" className="btn primary" onClick={() => onFile(items.map((i) => i.id))} disabled={!items.length}>
            <Icon name="file" size={18} /> Ranger
          </button>
        </div>
      )}

      <ul className="inbox-list">
        {items.map((item) => <InboxRow key={item.id} item={item} onFile={() => onFile([item.id])} />)}
      </ul>

      {items.length === 0 && (
        <div className="empty">
          <Icon name="inbox" size={96} />
          <p>{total ? 'Aucun résultat' : 'Inbox vide : vide-toi la tête ici, tu rangeras plus tard.'}</p>
        </div>
      )}
    </div>
  );
}

function InboxRow({ item, onFile }: { item: Note; onFile: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);
  const ref = useRef<HTMLTextAreaElement>(null);
  const text = [item.title, item.content].filter((t) => t.trim()).join('\n');
  const link = extractLinks(item)[0];

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, editing]);

  const startEdit = () => {
    setDraft(text);
    setEditing(true);
  };

  // Curseur placé en fin de texte dès l'ouverture de la modification.
  useLayoutEffect(() => {
    const el = ref.current;
    if (editing && el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (!draft.trim()) return remove();
    if (draft !== text) void updateNote(item.id, { title: '', content: draft.trim() });
  };

  const remove = () => {
    void trashNote(item.id);
    toast('Élément supprimé', { label: 'Annuler', run: () => void restoreNote(item.id) });
  };

  return (
    <li className="inbox-row">
      <div className="inbox-text">
        {editing ? (
          <textarea
            ref={ref}
            className="auto"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ref.current?.blur();
              } else if (e.key === 'Escape') {
                setDraft(text);
                setEditing(false);
              }
            }}
          />
        ) : (
          <p onClick={startEdit}><LinkedText text={text} /></p>
        )}
        {link && !editing && <LinkPreviewCard url={link} compact />}
        <small>
          {item.category && <span className="type-badge"><Icon name={categoryMeta(item.category).icon} size={14} /> {categoryMeta(item.category).label}</span>}
          {formatDate(item.createdAt)}
        </small>
      </div>
      <IconButton name="file" label="Ranger cet élément" onClick={onFile} />
      <IconButton name="trash" label="Supprimer" onClick={remove} />
    </li>
  );
}
