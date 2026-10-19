import { useRef, useState } from 'react';
import { isFresh } from '../lib/fresh';
import { categoryMeta } from '../lib/gtd';
import { useBackClose } from '../lib/history';
import { updateNote } from '../lib/store';
import { extractLinks, formatDate } from '../lib/text';
import type { Note } from '../lib/types';
import { CheckBox, Icon, IconButton } from './Icon';
import { LinkedText } from './LinkedText';
import { LinkPreviewCard } from './LinkPreview';
import { toast } from './Toast';

interface Props {
  items: Note[];
  /** Nombre total de cartes (avant la recherche). */
  total: number;
  onOpen: (id: string) => void;
  /** together : toutes les cartes vont au même endroit. */
  onFile: (ids: string[], together?: boolean) => void;
  /** Fusionne les cartes sélectionnées en une liste (dans l'ordre affiché). */
  onMerge: (ids: string[]) => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

/**
 * Onglet Inbox (décisions 49 à 51) : un bouton « Ranger » par carte, glisser vers la gauche
 * pour archiver, appui long pour sélectionner (puis Fusionner ou Ranger ensemble).
 */
export function InboxView({ items, total, onOpen, onFile, onMerge }: Props) {
  const [selected, setSelected] = useState<string[] | null>(null);
  const selecting = selected !== null;
  useBackClose(selecting, () => setSelected(null));

  const toggle = (id: string) =>
    setSelected((s) => {
      if (!s) return [id];
      const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
      return next.length ? next : null;
    });

  // Dans l'ordre d'affichage.
  const chosen = () => items.filter((i) => selected?.includes(i.id)).map((i) => i.id);

  return (
    <div className="inbox">
      {total > 0 && !selecting && (
        <div className="inbox-head">
          <span>{plural(total, 'carte')} à ranger</span>
          <button type="button" className="btn primary" onClick={() => onFile(items.map((i) => i.id))} disabled={!items.length}>
            Tout ranger
          </button>
        </div>
      )}
      {selecting && (
        <div className="inbox-head selecting">
          <IconButton name="close" label="Annuler la sélection" onClick={() => setSelected(null)} />
          <span>{selected.length} sélectionnée{selected.length > 1 ? 's' : ''}</span>
          {selected.length >= 2 && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                onMerge(chosen());
                setSelected(null);
              }}
            >
              Fusionner
            </button>
          )}
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              onFile(chosen(), true);
              setSelected(null);
            }}
          >
            Ranger
          </button>
        </div>
      )}

      <ul className="inbox-list">
        {items.map((item) => (
          <InboxRow
            key={item.id}
            item={item}
            selecting={selecting}
            checked={!!selected?.includes(item.id)}
            onOpen={() => (selecting ? toggle(item.id) : onOpen(item.id))}
            onHold={() => toggle(item.id)}
            onFile={() => onFile([item.id])}
          />
        ))}
      </ul>

      {items.length === 0 && (
        <div className="empty">
          <Icon name="inbox" size={96} />
          <p>{total ? 'Aucun résultat' : 'Tout est rangé. Tu peux souffler.'}</p>
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
  onHold: () => void;
  onFile: () => void;
}

const HOLD_MS = 450;

function InboxRow({ item, selecting, checked, onOpen, onHold, onFile }: RowProps) {
  const text = item.type === 'list' ? item.title : [item.title, item.content].filter((t) => t.trim()).join('\n');
  const listItems = item.type === 'list' ? item.items.filter((i) => i.text.trim()) : [];
  const link = extractLinks(item)[0];

  // Geste en cours : appui long (sélection) ou glisser horizontal (archivage).
  const [dx, setDx] = useState(0);
  const gesture = useRef<{ x: number; y: number; id: number; mode: 'wait' | 'swipe' | 'scroll'; timer: number } | null>(null);
  const skipClick = useRef(false);
  const rowRef = useRef<HTMLLIElement>(null);

  const archive = () => {
    void updateNote(item.id, { archived: true });
    toast('Archivée', { label: 'Annuler', run: () => void updateNote(item.id, { archived: false }) });
  };

  const end = () => {
    const g = gesture.current;
    if (g) clearTimeout(g.timer);
    gesture.current = null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, a')) return;
    skipClick.current = false;
    const timer = window.setTimeout(() => {
      // Appui long : sélection, sans attendre que le doigt se lève.
      navigator.vibrate?.(30);
      skipClick.current = true;
      end();
      onHold();
    }, HOLD_MS);
    gesture.current = { x: e.clientX, y: e.clientY, id: e.pointerId, mode: 'wait', timer };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const mx = e.clientX - g.x;
    const my = e.clientY - g.y;
    if (g.mode === 'wait') {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      clearTimeout(g.timer);
      // Glisser vers la gauche (hors sélection) : archivage ; sinon on laisse défiler.
      g.mode = !selecting && mx < 0 && Math.abs(mx) > Math.abs(my) ? 'swipe' : 'scroll';
      if (g.mode === 'swipe') rowRef.current?.setPointerCapture(e.pointerId);
      else return end();
    }
    if (g.mode === 'swipe') setDx(Math.min(0, mx));
  };

  const onPointerUp = () => {
    const g = gesture.current;
    end();
    if (g?.mode !== 'swipe') return;
    skipClick.current = true;
    const width = rowRef.current?.offsetWidth ?? 320;
    if (-dx > width * 0.35) {
      setDx(-width);
      setTimeout(archive, 150);
    } else setDx(0);
  };

  return (
    <li
      ref={rowRef}
      className={`inbox-swipe ${dx ? 'swiping' : ''} ${isFresh(item.id) ? 'new-card' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { end(); setDx(0); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="swipe-reveal" aria-hidden="true">
        <Icon name="archive" size={20} /> Archiver
      </div>
      <div
        className={`inbox-row ${selecting ? 'selecting' : ''} ${checked ? 'selected' : ''}`}
        style={dx ? { transform: `translateX(${dx}px)`, transition: gesture.current ? 'none' : undefined } : undefined}
      >
        {selecting && (
          <span className="select-box">
            <CheckBox checked={checked} />
          </span>
        )}
        <div
          className="inbox-text"
          role="button"
          tabIndex={0}
          aria-pressed={selecting ? checked : undefined}
          onClick={() => {
            if (skipClick.current) {
              skipClick.current = false;
              return;
            }
            onOpen();
          }}
          onKeyDown={(e) => e.key === 'Enter' && onOpen()}
        >
          {text.trim() && <p className={item.type === 'list' ? 'inbox-title' : ''}><LinkedText text={text} /></p>}
          {listItems.length > 0 && (
            <ul className="inbox-items">
              {listItems.slice(0, 6).map((i) => (
                <li key={i.id} className={i.checked ? 'struck' : ''}>
                  <CheckBox checked={i.checked} /> <LinkedText text={i.text} />
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
          <button type="button" className="file-btn" aria-label="Ranger cette carte" onClick={onFile}>
            <Icon name="file" size={18} /> Ranger
          </button>
        )}
      </div>
    </li>
  );
}
