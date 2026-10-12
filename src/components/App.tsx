import { useEffect, useMemo, useRef, useState } from 'react';
import { useBackgrounds, useLabels, useLocalPref, useNotes, useSyncStatus, useTheme } from '../lib/hooks';
import { buildNote, createNote, deleteNoteForever, emptyTrash, purgeOldTrash, restoreNote, saveNote } from '../lib/store';
import { startAutoSync } from '../lib/sync';
import { matchesQuery } from '../lib/text';
import type { Note } from '../lib/types';
import { Drawer, type Section } from './Drawer';
import { Icon, IconButton } from './Icon';
import { LabelManager } from './LabelManager';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { NoteGrid } from './NoteGrid';
import { Settings, type LaunchPref } from './Settings';
import { toast, Toaster } from './Toast';

const SYNC_LABEL = {
  local: 'Notes sur cet appareil uniquement',
  syncing: 'Synchronisation…',
  synced: 'Synchronisé',
  offline: 'Hors ligne',
  error: 'Erreur de synchronisation',
};

export default function App() {
  const notes = useNotes();
  const labels = useLabels();
  const images = useBackgrounds();
  const status = useSyncStatus();
  const [theme, setTheme] = useTheme();
  const [layout, setLayout] = useLocalPref<'grid' | 'list'>('ject-layout', 'grid');
  const [launch, setLaunch] = useLocalPref<LaunchPref>('ject-launch', 'none');

  const [section, setSection] = useState<Section>('inbox');
  const [labelId, setLabelId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [editing, setEditing] = useState<{ id: string; isNew: boolean; initial?: Note } | null>(null);
  const [dialog, setDialog] = useState<null | 'settings' | 'labels'>(null);
  const started = useRef(false);

  // L'éditeur s'ouvre immédiatement ; l'enregistrement se fait en parallèle.
  const newNote = (type: 'text' | 'list', extra: Partial<Note> = {}) => {
    const note = buildNote({ type, labelIds: labelId ? [labelId] : [], ...extra });
    setEditing({ id: note.id, isNew: true, initial: note });
    void saveNote(note);
  };

  // Démarrage : synchro, nettoyage de la corbeille, raccourcis et partage Android.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startAutoSync();
    void purgeOldTrash();
    const params = new URLSearchParams(location.search);
    const shared = ['share_title', 'share_text', 'share_url'].map((k) => params.get(k)?.trim() ?? '');
    if (shared.some(Boolean)) {
      const [title, text, url] = shared;
      const content = [text, url && !text.includes(url) ? url : ''].filter(Boolean).join('\n');
      void createNote({ type: 'text', title, content }).then((n) => {
        setEditing({ id: n.id, isNew: false });
        toast('Ajouté à ton inbox');
      });
    } else if (params.get('new') === 'list' || params.get('new') === 'text') {
      newNote(params.get('new') as 'text' | 'list');
    } else if (launch !== 'none') {
      newNote(launch);
    }
    if (location.search) history.replaceState(null, '', '/');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const list = notes.filter((n) => {
      if (section === 'trash') return n.trashedAt !== null;
      if (n.trashedAt !== null) return false;
      if (section === 'archive' ? !n.archived : n.archived) return false;
      if (labelId && !n.labelIds.includes(labelId)) return false;
      return matchesQuery(n, query);
    });
    return section === 'trash'
      ? list.sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0))
      : list.sort((a, b) => b.position - a.position);
  }, [notes, section, labelId, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { inbox: 0 };
    for (const n of notes) {
      if (n.archived || n.trashedAt !== null) continue;
      c.inbox++;
      for (const l of n.labelIds) c[l] = (c[l] ?? 0) + 1;
    }
    return c;
  }, [notes]);

  const navigate = (s: Section, l: string | null = null) => {
    setSection(s);
    setLabelId(l);
    setDrawer(false);
    window.scrollTo(0, 0);
  };

  const pinned = section === 'inbox' ? visible.filter((n) => n.pinned) : [];
  const others = section === 'inbox' ? visible.filter((n) => !n.pinned) : visible;
  const sortable = !query && section !== 'trash';

  const card = (n: Note) =>
    section === 'trash' ? (
      <NoteCard
        note={n}
        labels={labels}
        images={images}
        onOpen={() => toast('Restaure la note pour la modifier')}
        actions={
          <>
            <IconButton name="restore" label="Restaurer" onClick={() => void restoreNote(n.id)} />
            <IconButton name="trash" label="Supprimer définitivement" onClick={() => confirm('Supprimer définitivement cette note ?') && void deleteNoteForever(n.id)} />
          </>
        }
      />
    ) : (
      <NoteCard note={n} labels={labels} images={images} onOpen={() => setEditing({ id: n.id, isNew: false })} />
    );

  const currentLabel = labels.find((l) => l.id === labelId);
  const heading = section === 'archive' ? 'Archives' : section === 'trash' ? 'Corbeille' : currentLabel ? `${currentLabel.emoji} ${currentLabel.name}` : 'Inbox';

  return (
    <div className="app">
      <header className="topbar">
        <IconButton name="menu" label="Menu" onClick={() => setDrawer(true)} />
        <span className="topbar-title">{heading}</span>
        <label className="search">
          <Icon name="search" size={20} />
          <input type="search" value={query} placeholder="Rechercher" onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher dans les notes" />
          {query && <IconButton name="close" label="Effacer la recherche" size={18} onClick={() => setQuery('')} />}
        </label>
        <IconButton name={layout === 'grid' ? 'list' : 'grid'} label={layout === 'grid' ? 'Affichage en liste' : 'Affichage en grille'} onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')} />
        <button type="button" className={`sync-indicator ${status}`} title={SYNC_LABEL[status]} aria-label={SYNC_LABEL[status]} onClick={() => setDialog('settings')}>
          <Icon name="cloud" size={22} />
        </button>
      </header>

      {section !== 'trash' && labels.length > 0 && (
        <div className="label-bar" role="toolbar" aria-label="Filtrer par libellé">
          <button type="button" className={`chip ${!labelId ? 'on' : ''}`} onClick={() => setLabelId(null)}>Tout</button>
          {labels.map((l) => (
            <button key={l.id} type="button" className={`chip ${labelId === l.id ? 'on' : ''}`} onClick={() => setLabelId(labelId === l.id ? null : l.id)}>
              {l.emoji} {l.name}
            </button>
          ))}
        </div>
      )}

      <main className="content">
        {section === 'inbox' && (
          <div className="composer">
            <button type="button" className="composer-main" onClick={() => newNote('text')}>Créer une note…</button>
            <IconButton name="checked" label="Nouvelle liste" onClick={() => newNote('list')} />
          </div>
        )}

        {section === 'trash' && visible.length > 0 && (
          <div className="trash-head">
            <span>Les notes de la corbeille sont supprimées après 7 jours.</span>
            <button type="button" className="link-btn" onClick={() => confirm('Vider la corbeille ? Les notes seront supprimées définitivement.') && void emptyTrash()}>
              Vider la corbeille
            </button>
          </div>
        )}

        {pinned.length > 0 && (
          <>
            <p className="section-label grid-label">Épinglées</p>
            <NoteGrid notes={pinned} layout={layout} sortable={sortable} render={card} />
            {others.length > 0 && <p className="section-label grid-label">Autres</p>}
          </>
        )}
        <NoteGrid notes={others} layout={layout} sortable={sortable} render={card} />

        {visible.length === 0 && (
          <div className="empty">
            <Icon name={section === 'archive' ? 'archive' : section === 'trash' ? 'trash' : query ? 'search' : 'inbox'} size={96} />
            <p>
              {query ? 'Aucun résultat' : section === 'archive' ? 'Les notes archivées s’affichent ici' : section === 'trash' ? 'La corbeille est vide' : 'Tes idées, listes et envies s’affichent ici'}
            </p>
          </div>
        )}
      </main>

      <Drawer
        open={drawer}
        section={section}
        labelId={labelId}
        labels={labels}
        counts={counts}
        onNavigate={navigate}
        onEditLabels={() => { setDrawer(false); setDialog('labels'); }}
        onSettings={() => { setDrawer(false); setDialog('settings'); }}
        onClose={() => setDrawer(false)}
      />

      {editing && (
        <NoteEditor key={editing.id} noteId={editing.id} isNew={editing.isNew} initial={editing.initial} labels={labels} images={images} onClose={() => setEditing(null)} />
      )}
      {dialog === 'settings' && <Settings onClose={() => setDialog(null)} theme={theme} setTheme={setTheme} launch={launch} setLaunch={setLaunch} />}
      {dialog === 'labels' && <LabelManager labels={labels} onClose={() => setDialog(null)} />}
      <Toaster />
    </div>
  );
}
