import { categoryMeta } from '../lib/gtd';
import { restoreNote, trashNote } from '../lib/store';
import { extractLinks, formatDate } from '../lib/text';
import type { Note } from '../lib/types';
import { Icon, IconButton } from './Icon';
import { LinkedText } from './LinkedText';
import { LinkPreviewCard } from './LinkPreview';
import { toast } from './Toast';

interface Props {
  items: Note[];
  /** Nombre total d'éléments (avant la recherche). */
  total: number;
  onOpen: (id: string) => void;
  onFile: (ids: string[]) => void;
}

/** Onglet Inbox : les éléments bruts déposés avec le bouton +, en attente d'être rangés. */
export function InboxView({ items, total, onOpen, onFile }: Props) {
  return (
    <div className="inbox">
      {total > 0 && (
        <div className="inbox-head">
          <span>{total} élément{total > 1 ? 's' : ''} à ranger</span>
          <button type="button" className="btn primary" onClick={() => onFile(items.map((i) => i.id))} disabled={!items.length}>
            <Icon name="file" size={18} /> Ranger
          </button>
        </div>
      )}

      <ul className="inbox-list">
        {items.map((item) => (
          <InboxRow key={item.id} item={item} onOpen={() => onOpen(item.id)} onFile={() => onFile([item.id])} />
        ))}
      </ul>

      {items.length === 0 && (
        <div className="empty">
          <Icon name="inbox" size={96} />
          <p>{total ? 'Aucun résultat' : 'Inbox vide. Touche + pour noter une idée, une reco, une envie… tu rangeras plus tard.'}</p>
        </div>
      )}
    </div>
  );
}

function InboxRow({ item, onOpen, onFile }: { item: Note; onOpen: () => void; onFile: () => void }) {
  const text = item.type === 'list' ? item.title : [item.title, item.content].filter((t) => t.trim()).join('\n');
  const listItems = item.type === 'list' ? item.items.filter((i) => i.text.trim()) : [];
  const link = extractLinks(item)[0];

  const remove = () => {
    void trashNote(item.id);
    toast('Élément supprimé', { label: 'Annuler', run: () => void restoreNote(item.id) });
  };

  return (
    <li className="inbox-row">
      <div className="inbox-text" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
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
        {link && <LinkPreviewCard url={link} compact />}
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
