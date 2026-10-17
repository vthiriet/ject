import { useRef, useState } from 'react';
import { categoryMeta } from '../lib/gtd';
import { useBackClose } from '../lib/history';
import { updateNote } from '../lib/store';
import { extractLinks, formatDate } from '../lib/text';
import type { Note } from '../lib/types';
import { Icon, IconButton } from './Icon';
import { LinkedText } from './LinkedText';
import { LinkPreviewCard } from './LinkPreview';
import { NoteGrid } from './NoteGrid';
import { toast } from './Toast';

interface Props {
  items: Note[];
  /** Nombre total d'éléments (avant la recherche). */
  total: number;
  onOpen: (id: string) => void;
  /** together : tous les éléments vont au même endroit. */
  onFile: (ids: string[], together?: boolean) => void;
  /** Lâcher un élément sur un autre : ils fusionnent en une liste. */
  onMerge?: (sourceId: string, targetId: string) => void;
}

/** Onglet Inbox : les éléments bruts déposés avec le bouton +, en attente d'être rangés. */
export function InboxView({ items, total, onOpen, onFile, onMerge }: Props) {
  // Sélection multiple (appui long sur téléphone, bouton « Sélectionner » sur ordinateur).
  const [selected, setSelected] = useState<string[] | null>(null);
  const selecting = selected !== null;
  useBackClose(selecting, () => setSelected(null));
  // Sélection d'avant l'appui long, pour l'annuler si le doigt se met à glisser.
  const beforeHold = useRef<string[] | null>(null);

  const toggle = (id: string) =>
    setSelected((s) => {
      if (!s) return [id];
      const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
      return next.length ? next : null;
    });

  const fileSelected = () => {
    if (!selected?.length) return;
    onFile(selected, true);
    setSelected(null);
  };

  return (
    <div className="inbox">
      {total > 0 && !selecting && (
        <div className="inbox-head">
          <span>{total} élément{total > 1 ? 's' : ''} à ranger</span>
          <button type="button" className="link-btn" onClick={() => setSelected([])} disabled={!items.length}>
            Sélectionner
          </button>
          <button type="button" className="btn primary" onClick={() => onFile(items.map((i) => i.id))} disabled={!items.length}>
            <Icon name="file" size={18} /> Ranger
          </button>
        </div>
      )}
      {selecting && (
        <div className="inbox-head selecting">
          <IconButton name="close" label="Annuler la sélection" onClick={() => setSelected(null)} />
          <span>{selected.length} sélectionné{selected.length > 1 ? 's' : ''}</span>
          <button
            type="button"
            className="link-btn"
            onClick={() => setSelected(selected.length === items.length ? [] : items.map((i) => i.id))}
          >
            {selected.length === items.length ? 'Aucun' : 'Tout'}
          </button>
          <button type="button" className="btn primary" onClick={fileSelected} disabled={!selected.length}>
            <Icon name="file" size={18} /> Ranger
          </button>
        </div>
      )}

      <NoteGrid
        notes={items}
        layout="list"
        sortable={!!onMerge}
        reorder={false}
        onMerge={onMerge}
        onHold={(id) => {
          beforeHold.current = selected;
          toggle(id);
        }}
        onHoldCancel={() => setSelected(beforeHold.current)}
        render={(item) => (
          <InboxRow
            item={item}
            selecting={selecting}
            checked={!!selected?.includes(item.id)}
            onOpen={() => (selecting ? toggle(item.id) : onOpen(item.id))}
            onFile={() => onFile([item.id])}
          />
        )}
      />

      {items.length === 0 && (
        <div className="empty">
          <Icon name="inbox" size={96} />
          <p>{total ? 'Aucun résultat' : 'Inbox vide. Touche + pour noter une idée, une reco, une envie… tu rangeras plus tard.'}</p>
        </div>
      )}
    </div>
  );
}

interface RowProps {
  item: Note;
  selecting: boolean;
  checked: boolean;
  onOpen: () => void;
  onFile: () => void;
}

function InboxRow({ item, selecting, checked, onOpen, onFile }: RowProps) {
  const text = item.type === 'list' ? item.title : [item.title, item.content].filter((t) => t.trim()).join('\n');
  const listItems = item.type === 'list' ? item.items.filter((i) => i.text.trim()) : [];
  const link = extractLinks(item)[0];

  const archive = () => {
    void updateNote(item.id, { archived: true });
    toast('Archivé ✓', { label: 'Annuler', run: () => void updateNote(item.id, { archived: false }) });
  };

  return (
    <div className={`inbox-row ${selecting ? 'selecting' : ''} ${checked ? 'selected' : ''}`}>
      {selecting && (
        <span className="select-box" onClick={onOpen} aria-hidden>
          <Icon name={checked ? 'checked' : 'unchecked'} size={22} />
        </span>
      )}
      <div
        className="inbox-text"
        role="button"
        tabIndex={0}
        aria-pressed={selecting ? checked : undefined}
        onClick={onOpen}
        onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      >
        {text.trim() && <p className={item.type === 'list' ? 'inbox-title' : ''}><LinkedText text={text} /></p>}
        {listItems.length > 0 && (
          <ul className="inbox-items">
            {listItems.slice(0, 6).map((i) => (
              <li key={i.id} className={i.checked ? 'struck' : ''}>
                <Icon name={i.checked ? 'checked' : 'unchecked'} size={16} /> <LinkedText text={i.text} />
              </li>
            ))}
            {listItems.length > 6 && <li className="hint">… et {listItems.length - 6} autres</li>}
          </ul>
        )}
        {link && !selecting && <LinkPreviewCard url={link} compact />}
        <small>
          {item.category && <span className="type-badge"><Icon name={categoryMeta(item.category).icon} size={14} /> {categoryMeta(item.category).label}</span>}
          {formatDate(item.createdAt)}
        </small>
      </div>
      {!selecting && (
        <>
          <IconButton name="file" label="Ranger cet élément" onClick={onFile} />
          <IconButton name="check" label="Archiver" onClick={archive} />
        </>
      )}
    </div>
  );
}
