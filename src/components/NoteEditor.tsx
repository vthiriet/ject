import { useLiveQuery } from 'dexie-react-hooks';
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { db } from '../lib/db';
import { habitConfig } from '../lib/habits';
import { useBackClose } from '../lib/history';
import {
  deleteNoteForever, duplicateNote, isEmptyNote, newItem, restoreNote, trashNote, updateNote,
} from '../lib/store';
import { CATEGORIES, categoryMeta, categoryOf } from '../lib/gtd';
import { extractLinks, formatDate, noteToText } from '../lib/text';
import type { BackgroundImage, Category, ChecklistItem, Label, Note } from '../lib/types';
import { Banner } from './Background';
import { BackgroundPicker } from './BackgroundPicker';
import { HabitConfigForm } from './HabitConfigForm';
import { Icon, IconButton } from './Icon';
import { LabelPicker } from './LabelPicker';
import { LinkPreviewCard } from './LinkPreview';
import { NotionExport } from './NotionExport';
import { Segmented } from './Segmented';
import { toast } from './Toast';

interface Props {
  noteId: string;
  isNew: boolean;
  /** Note toute neuve, affichée avant même d'être lue dans la base. */
  initial?: Note;
  labels: Label[];
  images: BackgroundImage[];
  onClose: () => void;
}

type Draft = Pick<Note, 'title' | 'content' | 'items' | 'type'>;
type Panel = null | 'colors' | 'labels' | 'more' | 'move';

export function NoteEditor({ noteId, isNew, initial, labels, images, onClose }: Props) {
  const stored = useLiveQuery(() => db.notes.get(noteId), [noteId]);
  const note = stored ?? initial;
  const [draft, setDraft] = useState<Draft | null>(() =>
    initial ? { title: initial.title, content: initial.content, items: initial.items, type: initial.type } : null,
  );
  const [focusId, setFocusId] = useState<string | null>(() =>
    initial && isNew ? (initial.type === 'list' ? initial.items[0]?.id ?? null : 'content') : null,
  );
  const [panel, setPanel] = useState<Panel>(null);
  const [showChecked, setShowChecked] = useState(false);
  const [exporting, setExporting] = useState(false);
  /** Élément de liste dont on règle l'état ou la régularité. */
  const [itemOptions, setItemOptions] = useState<string | null>(null);
  const dirty = useRef(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const itemRefs = useRef(new Map<string, HTMLTextAreaElement>());
  // Pas de titre pour un texte, sauf s'il en avait déjà un (pour ne rien perdre).
  const textHadTitle = useRef<boolean | null>(null);
  // Bouton « précédent » du téléphone : ferme la carte comme la flèche ←.
  const closeRef = useRef<() => void>(onClose);
  useBackClose(true, () => closeRef.current());

  // Copie de travail : chargée une fois, puis enregistrée automatiquement.
  useEffect(() => {
    if (note && !draft) {
      setDraft({ title: note.title, content: note.content, items: note.items, type: note.type });
      if (isNew) setFocusId(note.type === 'list' ? note.items[0]?.id ?? null : 'content');
    }
  }, [note, draft, isNew]);

  useEffect(() => {
    if (!draft || !dirty.current) return;
    const t = setTimeout(() => {
      dirty.current = false;
      void updateNote(noteId, draft);
    }, 400);
    return () => clearTimeout(t);
  }, [draft, noteId]);

  useLayoutEffect(() => {
    if (!focusId) return;
    const el = focusId === 'content' ? contentRef.current : focusId === 'title' ? titleRef.current : itemRefs.current.get(focusId);
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      setFocusId(null);
    }
  }, [focusId, draft]);

  if (note && textHadTitle.current === null) textHadTitle.current = !!note.title.trim();
  if (!note || !draft) return null;

  const edit = (patch: Partial<Draft>) => {
    dirty.current = true;
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const close = async () => {
    const final = { ...note, ...draft };
    if (isEmptyNote(final)) {
      await deleteNoteForever(noteId);
    } else {
      // Retire les lignes vides des listes.
      const items = draft.items.filter((i) => i.text.trim());
      await updateNote(noteId, { ...draft, items });
      if (isNew) toast(note.inbox ? 'Ajouté à l’inbox' : 'Ajouté');
    }
    onClose();
  };
  closeRef.current = () => void close();

  // ----- Listes -----
  const setItems = (items: ChecklistItem[]) => edit({ items });
  const updateItem = (id: string, patch: Partial<ChecklistItem>) =>
    setItems(draft.items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const insertAfter = (id: string | null, texts: string[] = ['']) => {
    const created = texts.map((t) => newItem(t));
    const items = [...draft.items];
    const index = id ? items.findIndex((i) => i.id === id) + 1 : items.filter((i) => !i.checked && !i.exported).length;
    items.splice(index, 0, ...created);
    setItems(items);
    setFocusId(created[created.length - 1].id);
  };

  const removeItem = (id: string) => {
    const visible = draft.items.filter((i) => !i.checked && !i.exported);
    const idx = visible.findIndex((i) => i.id === id);
    setItems(draft.items.filter((i) => i.id !== id));
    const prev = visible[idx - 1] ?? visible[idx + 1];
    setFocusId(prev ? prev.id : 'title');
  };

  const onItemKey = (e: React.KeyboardEvent<HTMLTextAreaElement>, item: ChecklistItem) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      insertAfter(item.id);
    } else if (e.key === 'Backspace' && item.text === '') {
      e.preventDefault();
      removeItem(item.id);
    }
  };

  const onItemPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, item: ChecklistItem) => {
    const lines = e.clipboardData.getData('text').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    e.preventDefault();
    const [first, ...rest] = lines;
    const items = draft.items.map((i) => (i.id === item.id ? { ...i, text: i.text + first } : i));
    const created = rest.map((t) => newItem(t));
    items.splice(items.findIndex((i) => i.id === item.id) + 1, 0, ...created);
    setItems(items);
    setFocusId(created[created.length - 1].id);
  };

  const convert = () => {
    if (draft.type === 'text') {
      const lines = draft.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      edit({ type: 'list', items: lines.length ? lines.map((l) => newItem(l)) : [newItem()], content: '' });
    } else {
      edit({ type: 'text', content: draft.items.filter((i) => i.text.trim()).map((i) => i.text).join('\n'), items: [] });
    }
    setPanel(null);
  };

  // ----- Actions -----
  const flush = () => updateNote(noteId, draft);
  const archive = async () => {
    await flush();
    await updateNote(noteId, {
      archived: !note.archived,
      pinned: false,
      // Un projet terminé qu'on désarchive redevient actif.
      ...(note.archived && note.projectStatus === 'done' ? { projectStatus: 'active' as const } : {}),
    });
    toast(note.archived ? 'Note désarchivée' : 'Note archivée', {
      label: 'Annuler',
      run: () => void updateNote(noteId, { archived: note.archived, pinned: note.pinned }),
    });
    onClose();
  };
  const remove = async () => {
    await flush();
    await trashNote(noteId);
    toast('Note placée dans la corbeille', { label: 'Annuler', run: () => void restoreNote(noteId) });
    onClose();
  };
  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(noteToText({ ...note, ...draft }));
      toast('Liste copiée');
    } catch {
      toast('Copie impossible sur cet appareil');
    }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(noteToText({ ...note, ...draft }));
    toast('Note copiée');
    setPanel(null);
  };
  const share = async () => {
    const text = noteToText({ ...note, ...draft });
    if (navigator.share) await navigator.share({ title: draft.title || 'Note Ject', text }).catch(() => {});
    else {
      await navigator.clipboard.writeText(text);
      toast('Partage indisponible ici : note copiée');
    }
    setPanel(null);
  };
  const moveTo = async (c: Category) => {
    await flush();
    await updateNote(noteId, {
      category: c,
      // Depuis l'Inbox, déplacer revient à ranger la carte telle quelle.
      inbox: false,
      position: Date.now(),
      ...(c === 'action' && !note.status ? { status: 'todo' as const } : {}),
      ...(c === 'project' && !note.projectStatus ? { projectStatus: 'active' as const } : {}),
    });
    toast(`Déplacée vers ${categoryMeta(c).plural}`);
    onClose();
  };
  const duplicate = async () => {
    await flush();
    await duplicateNote(noteId);
    toast('Copie créée');
    setPanel(null);
  };

  const unchecked = draft.items.filter((i) => !i.checked && !i.exported);
  const checked = draft.items.filter((i) => i.checked && !i.exported);
  const exported = draft.items.filter((i) => i.exported);
  const links = extractLinks(draft);

  const inInbox = !!note.inbox;
  const category = categoryOf(note);
  // Plus d'états (en attente, un jour…) sur les éléments de liste.
  const hasItemOptions = false;

  const itemBadge = (item: ChecklistItem) =>
    item.status === 'waiting'
        ? `⏳ En attente${item.waitingFor ? ` · ${item.waitingFor}` : ''}`
        : item.status === 'someday' && '💤 Un jour';

  const itemRow = (item: ChecklistItem, done: boolean) => {
    const badge = !done && hasItemOptions ? itemBadge(item) : '';
    return (
      <li key={item.id} className={`item-row ${done ? 'done' : ''} ${badge ? 'has-badge' : ''}`}>
        <button
          type="button"
          className="check"
          aria-label={done ? 'Décocher' : 'Cocher'}
          onClick={() => updateItem(item.id, { checked: !item.checked })}
        >
          <Icon name={done ? 'checked' : 'unchecked'} size={26} />
        </button>
        <div className="item-main">
          <AutoTextarea
            ref={(el) => { if (el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}
            value={item.text}
            placeholder="Élément de liste"
            onChange={(v) => updateItem(item.id, { text: v.replace(/\n/g, ' ') })}
            onKeyDown={(e) => onItemKey(e, item)}
            onPaste={(e) => onItemPaste(e, item)}
          />
          {badge && (
            <button type="button" className="item-badge" onClick={() => setItemOptions(itemOptions === item.id ? null : item.id)}>
              {badge}
            </button>
          )}
          {itemOptions === item.id && (
            <div className="item-options">
                <>
                  <Segmented
                    value={item.status ?? 'todo'}
                    options={[['todo', 'À faire'], ['waiting', 'En attente'], ['someday', 'Un jour']]}
                    onChange={(v) => updateItem(item.id, { status: v === 'todo' ? undefined : (v as 'waiting' | 'someday') })}
                  />
                  {item.status === 'waiting' && (
                    <input
                      className="text-input"
                      value={item.waitingFor ?? ''}
                      placeholder="En attente de qui ? (facultatif)"
                      onChange={(e) => updateItem(item.id, { waitingFor: e.target.value || undefined })}
                    />
                  )}
                </>
            </div>
          )}
        </div>
        {hasItemOptions && !done && (
          <IconButton
            name="hourglass"
            label="État"
            size={18}
            className={`item-remove ${itemOptions === item.id ? 'shown' : ''}`}
            onClick={() => setItemOptions(itemOptions === item.id ? null : item.id)}
          />
        )}
        <IconButton name="close" label="Supprimer l'élément" size={18} className="item-remove" onClick={() => removeItem(item.id)} />
      </li>
    );
  };

  return (
    <div className="overlay editor-overlay" onMouseDown={(e) => e.target === e.currentTarget && void close()}>
      <div className="editor" data-color={note.color} role="dialog" aria-modal="true" aria-label="Note">
        <div className="editor-top">
          <IconButton name="back" label="Fermer" onClick={() => void close()} />
          <button type="button" className="btn primary editor-ok" onClick={() => void close()}>
            <Icon name="check" size={18} /> {isNew ? 'Ajouter' : 'OK'}
          </button>
          <div className="spacer" />
          {!note.trashedAt && !inInbox && (
            <>
              <IconButton name="pin" label={note.pinned ? 'Désépingler' : 'Épingler'} active={note.pinned} onClick={() => void updateNote(noteId, { pinned: !note.pinned, archived: false })} />
              <IconButton name={note.archived ? 'unarchive' : 'archive'} label={note.archived ? 'Désarchiver' : 'Archiver'} onClick={() => void archive()} />
            </>
          )}
        </div>

        <div className="editor-scroll">
          <Banner value={note.background} images={images} tall />
          {(draft.type === 'list' || textHadTitle.current) && (
          <AutoTextarea
            ref={titleRef}
            className="editor-title"
            value={draft.title}
            placeholder="Titre"
            onChange={(v) => edit({ title: v.replace(/\n/g, ' ') })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (draft.type === 'list') setFocusId(unchecked[0]?.id ?? null);
                else setFocusId('content');
                if (draft.type === 'list' && !unchecked.length) insertAfter(null);
              }
            }}
          />
          )}

          {inInbox ? (
            <div className="editor-meta">
              <span className="type-badge"><Icon name="inbox" size={14} /> Inbox</span>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`type-chip ${note.category === c.id ? 'on' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void updateNote(noteId, { category: note.category === c.id ? undefined : c.id })}
                >
                  <Icon name={c.icon} size={16} /> {c.label}
                </button>
              ))}
            </div>
          ) : (
          <div className="editor-meta">
            <span className="type-badge"><Icon name={categoryMeta(category).icon} size={14} /> {categoryMeta(category).label}</span>

          </div>
          )}
          {!inInbox && category === 'habit' && (
            <HabitConfigForm value={habitConfig(note)} onChange={(c) => void updateNote(noteId, { habit: c, frequency: undefined })} />
          )}

          {draft.type === 'text' ? (
            <AutoTextarea
              ref={contentRef}
              className="editor-content"
              value={draft.content}
              placeholder="Créer une note…"
              onChange={(v) => edit({ content: v })}
            />
          ) : (
            <div className="editor-list">
              <ul>{unchecked.map((i) => itemRow(i, false))}</ul>
              <button type="button" className="add-item" onClick={() => insertAfter(unchecked[unchecked.length - 1]?.id ?? null)}>
                <Icon name="add" size={24} /> Élément de liste
              </button>
              {checked.length > 0 && (
                <>
                  <button type="button" className="checked-toggle" onClick={() => setShowChecked(!showChecked)} aria-expanded={showChecked}>
                    <span className={`chevron ${showChecked ? 'open' : ''}`}><Icon name="expand" size={24} /></span>
                    {checked.length} élément{checked.length > 1 ? 's' : ''} coché{checked.length > 1 ? 's' : ''}
                  </button>
                  {showChecked && <ul>{checked.map((i) => itemRow(i, true))}</ul>}
                </>
              )}
              {exported.length > 0 && (
                <div className="exported-section">
                  <p className="section-label">Exportés vers Notion</p>
                  <ul>
                    {exported.map((i) => (
                      <li key={i.id} className="item-row exported">
                        <Icon name="check" size={18} />
                        <span>
                          {i.text}
                          <small>{i.exported!.pageTitle} · {formatDate(i.exported!.at)}</small>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button type="button" className="btn copy-list" onClick={() => void copyList()}>
                <Icon name="copy" size={18} /> Copier la liste
              </button>
            </div>
          )}

          {links.length > 0 && (
            <div className="editor-links">
              {links.map((l) => <LinkPreviewCard key={l} url={l} />)}
            </div>
          )}

          {note.labelIds.length > 0 && (
            <div className="chips editor-chips">
              {note.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean).map((l) => (
                <button type="button" key={l!.id} className="chip" onClick={() => setPanel('labels')}>{l!.emoji} {l!.name}</button>
              ))}
            </div>
          )}

          {note.exported && (
            <p className="notion-mention block">
              <Icon name="check" size={16} /> Exportée vers Notion le {formatDate(note.exported.at)} dans «&nbsp;
              {note.exported.pageUrl ? <a href={note.exported.pageUrl} target="_blank" rel="noopener noreferrer">{note.exported.pageTitle}</a> : note.exported.pageTitle}
              &nbsp;»
            </p>
          )}
        </div>

        {panel === 'colors' && <BackgroundPicker note={note} images={images} />}
        {panel === 'labels' && <LabelPicker note={note} labels={labels} />}
        {panel === 'more' && (
          <div className="panel menu">
            {!inInbox && <button type="button" onClick={() => { setPanel(null); void flush().then(() => setExporting(true)); }}><Icon name="send" size={20} /> Exporter vers Notion</button>}
            <button type="button" onClick={() => setPanel('move')}><Icon name="file" size={20} /> {inInbox ? 'Ranger dans…' : 'Déplacer vers…'}</button>
            <button type="button" onClick={convert}><Icon name={draft.type === 'text' ? 'checked' : 'notes'} size={20} /> {draft.type === 'text' ? 'Transformer en liste' : 'Transformer en texte'}</button>
            <button type="button" onClick={() => void copy()}><Icon name="copy" size={20} /> Copier le texte</button>
            <button type="button" onClick={() => void share()}><Icon name="share" size={20} /> Partager</button>
            <button type="button" onClick={() => void duplicate()}><Icon name="add" size={20} /> Créer une copie</button>
            <button type="button" onClick={() => void remove()}><Icon name="trash" size={20} /> Supprimer</button>
          </div>
        )}

        {panel === 'move' && (
          <div className="panel menu">
            {CATEGORIES.filter((c) => inInbox || c.id !== category).map((c) => (
              <button key={c.id} type="button" onClick={() => void moveTo(c.id)}><Icon name={c.icon} size={20} /> {c.plural}</button>
            ))}
          </div>
        )}

        <div className="editor-bottom">
          <IconButton name="palette" label="Couleur et illustration" active={panel === 'colors'} onClick={() => setPanel(panel === 'colors' ? null : 'colors')} />
          {!inInbox && (
            <>
              <IconButton name="label" label="Aires" active={panel === 'labels'} onClick={() => setPanel(panel === 'labels' ? null : 'labels')} />
              <IconButton name="send" label="Exporter vers Notion" onClick={() => void flush().then(() => setExporting(true))} />
            </>
          )}
          <span className="edited">Modifiée le {formatDate(note.updatedAt)}</span>
          <IconButton name="more" label="Plus d'actions" active={panel === 'more'} onClick={() => setPanel(panel === 'more' ? null : 'more')} />
        </div>
      </div>
      {exporting && <NotionExport noteId={noteId} onClose={() => setExporting(false)} onDone={onClose} />}
    </div>
  );
}

// ----- Zone de texte qui s'agrandit avec son contenu -----


interface AutoProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}

const AutoTextarea = forwardRef<HTMLTextAreaElement, AutoProps>(function AutoTextarea(
  { value, onChange, placeholder, className = '', onKeyDown, onPaste }, ref,
) {
  const inner = useRef<HTMLTextAreaElement | null>(null);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={(el) => {
        inner.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      rows={1}
      className={`auto ${className}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
    />
  );
});
