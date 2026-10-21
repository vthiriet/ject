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
  const done = note.items.filter((i) => i.checked && !i.exported && i.text.trim());
  const checkedCount = done.length;
  // Les éléments cochés restent visibles, barrés, après ceux à faire.
  const shown = [...open, ...done].slice(0, MAX_ITEMS);
  const hidden = open.length + done.length - shown.length;
  const exportedCount = note.items.filter((i) => i.exported).length;
  const noteLabels = note.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean) as Label[];
  const link = extractLinks(note)[0];
  const empty = !note.title.trim() && !note.content.trim() && open.length === 0 && checkedCount === 0;

  const category = categoryOf(note);
  // Actions : l'épingle s'appelle « Prioritaire » et se signale par une flamme devant le texte.
  const urgent = category === 'action' && note.pinned && !note.inbox;
  const flag = urgent ? <span className="prio-flag" title="Prioritaire" aria-label="Prioritaire"><Icon name="flame" size={16} fill /></span> : null;
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
      {note.pinned && !urgent && <span className="card-pin" title="Épinglée"><Icon name="pin" size={18} fill /></span>}
      <div className="card-body">
        {note.title.trim() && <h3 className="card-title">{flag}{note.title}</h3>}
        {note.type === 'text' && note.content.trim() && (
          <p className="card-content">{!note.title.trim() && flag}<LinkedText text={note.content} /></p>
        )}
        {note.type === 'list' && !note.title.trim() && flag}
        {note.type === 'list' && shown.length > 0 && (
          <ul className="card-items">
            {shown.map((i) => (
              <li key={i.id} className={i.checked ? 'done' : ''}>
                <button
                  type="button"
                  className="check"
                  aria-label={`${i.checked ? 'Décocher' : 'Cocher'} « ${i.text} »`}
                  onClick={(e) => { e.stopPropagation(); void toggle(i.id); }}
                >
                  <CheckBox checked={i.checked} />
                </button>
                <span><LinkedText text={i.text} /></span>
              </li>
            ))}
          </ul>
        )}
        {note.type === 'list' && hidden > 0 && <p className="card-more">… et {hidden} autre{hidden > 1 ? 's' : ''}</p>}
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

