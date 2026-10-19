import { categoryOf } from '../lib/gtd';
import { habitConfig, rhythmLabel } from '../lib/habits';
import { isFresh } from '../lib/fresh';
import { updateNote } from '../lib/store';
import { extractLinks, formatDate } from '../lib/text';
import type { BackgroundImage, Label, Note } from '../lib/types';
import { Banner } from './Background';
import { CheckBox, Icon } from './Icon';
import { LinkedText } from './LinkedText';
import { LinkPreviewCard } from './LinkPreview';

interface Props {
  note: Note;
  labels: Label[];
  images: BackgroundImage[];
  onOpen: () => void;
  actions?: React.ReactNode;
  /** Bouton unique placé à droite, centré verticalement (ex. poubelle). */
  sideAction?: React.ReactNode;
}

const MAX_ITEMS = 8;

export function NoteCard({ note, labels, images, onOpen, actions, sideAction }: Props) {
  const open = note.items.filter((i) => !i.checked && !i.exported && i.text.trim());
  const checkedCount = note.items.filter((i) => i.checked && !i.exported && i.text.trim()).length;
  const exportedCount = note.items.filter((i) => i.exported).length;
  const noteLabels = note.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean) as Label[];
  const link = extractLinks(note)[0];
  const empty = !note.title.trim() && !note.content.trim() && open.length === 0 && checkedCount === 0;

  const category = categoryOf(note);
  // Pastille de régularité (habitudes) ; plus d'états pour les actions et projets.
  const meta = category === 'habit' ? rhythmLabel(habitConfig(note)) : '';

  const toggle = (id: string) =>
    updateNote(note.id, { items: note.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)) });

  return (
    <article
      className={`note-card ${sideAction ? 'has-side' : ''} ${isFresh(note.id) ? 'new-card' : ''}`}
      data-color={note.color}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onOpen()}
    >
      <Banner value={note.background} images={images} />
      {note.pinned && <span className="card-pin" title="Épinglée"><Icon name="pin" size={18} fill /></span>}
      <div className="card-body">
        {note.title.trim() && <h3 className="card-title">{note.title}</h3>}
        {note.type === 'text' && note.content.trim() && (
          <p className="card-content"><LinkedText text={note.content} /></p>
        )}
        {note.type === 'list' && open.length > 0 && (
          <ul className="card-items">
            {open.slice(0, MAX_ITEMS).map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  className="check"
                  aria-label={`Cocher « ${i.text} »`}
                  onClick={(e) => { e.stopPropagation(); void toggle(i.id); }}
                >
                  <CheckBox checked={false} />
                </button>
                <span><LinkedText text={i.text} /></span>
              </li>
            ))}
          </ul>
        )}
        {note.type === 'list' && open.length > MAX_ITEMS && <p className="card-more">… et {open.length - MAX_ITEMS} autres</p>}
        {checkedCount > 0 && <p className="card-more">+ {checkedCount} élément{checkedCount > 1 ? 's' : ''} coché{checkedCount > 1 ? 's' : ''}</p>}
        {empty && !note.background && <p className="card-empty">Carte vide</p>}
        {link && <LinkPreviewCard url={link} compact />}
        {note.exported ? (
          <p className="notion-mention"><Icon name="check" size={16} /> Exportée vers Notion · {note.exported.pageTitle} · {formatDate(note.exported.at)}</p>
        ) : exportedCount > 0 ? (
          <p className="notion-mention"><Icon name="check" size={16} /> {exportedCount} élément{exportedCount > 1 ? 's' : ''} exporté{exportedCount > 1 ? 's' : ''} vers Notion</p>
        ) : null}
        {meta && <p className="card-meta"><Icon name="repeat" size={14} /> {meta}</p>}
        {noteLabels.length > 0 && (
          <div className="chips">
            {noteLabels.map((l) => (
              <span key={l.id} className="chip small"><span className="emoji">{l.emoji}</span> {l.name}</span>
            ))}
          </div>
        )}
      </div>
      {actions && <div className="card-actions" onClick={(e) => e.stopPropagation()}>{actions}</div>}
      {sideAction && <div className="card-side" onClick={(e) => e.stopPropagation()}>{sideAction}</div>}
    </article>
  );
}

