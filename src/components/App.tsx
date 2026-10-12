import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, categoryMeta, categoryOf } from '../lib/gtd';
import { useBackgrounds, useLabels, useLocalPref, useNotes, useSyncStatus, useTheme } from '../lib/hooks';
import { buildNote, createInboxItem, deleteNoteForever, emptyTrash, purgeOldTrash, restoreNote, saveNote } from '../lib/store';
import { startAutoSync } from '../lib/sync';
import { matchesQuery } from '../lib/text';
import type { Category, Note } from '../lib/types';
import { Drawer, type Section } from './Drawer';
import { FileDialog } from './FileDialog';
import { Icon, IconButton } from './Icon';
import { InboxView } from './InboxView';
import { LabelManager } from './LabelManager';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { NoteGrid } from './NoteGrid';
import { Settings } from './Settings';
import { toast, Toaster } from './Toast';

const SYNC_LABEL = {
  local: 'Notes sur cet appareil uniquement',
  syncing: 'Synchronisation…',
  synced: 'Synchronisé',
  offline: 'Hors ligne',
  error: 'Erreur de synchronisation',
};

const isCategory = (s: Section): s is Category => CATEGORIES.some((c) => c.id === s);

/** Regroupe les cartes d'un onglet en sections (épinglées, puis par état). */
function groupsFor(section: Section, notes: Note[]): { label: string; notes: Note[] }[] {
  if (!isCategory(section)) return [{ label: '', notes }];
  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);
  const groups: { label: string; notes: Note[] }[] = [];
  if (pinned.length) groups.push({ label: 'Épinglées', notes: pinned });
  if (section === 'action') {
    const by = (s: string) => rest.filter((n) => n.type === 'text' && n.status === s);
    groups.push({ label: 'À faire', notes: rest.filter((n) => n.type === 'list' || !n.status || n.status === 'todo') });
    groups.push({ label: 'En attente', notes: by('waiting') });
    groups.push({ label: 'Un jour', notes: by('someday') });
    groups.push({ label: 'Faites', notes: by('done') });
  } else if (section === 'project') {
    groups.push({ label: 'Actifs', notes: rest.filter((n) => n.projectStatus !== 'someday') });
    groups.push({ label: 'Un jour', notes: rest.filter((n) => n.projectStatus === 'someday') });
  } else {
    groups.push({ label: pinned.length ? 'Autres' : '', notes: rest });
  }
  return groups.filter((g) => g.notes.length);
}

export default function App() {
  const notes = useNotes();
  const labels = useLabels();
  const images = useBackgrounds();
  const status = useSyncStatus();
  const [theme, setTheme] = useTheme();
  const [layout, setLayout] = useLocalPref<'grid' | 'list'>('ject-layout', 'grid');

  const [section, setSection] = useState<Section>('inbox');
  const [labelId, setLabelId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [editing, setEditing] = useState<{ id: string; isNew: boolean; initial?: Note } | null>(null);
  const [dialog, setDialog] = useState<null | 'settings' | 'labels'>(null);
  const [filing, setFiling] = useState<string[] | null>(null);
  const [focusInbox, setFocusInbox] = useState(0);
  const started = useRef(false);

  // L'éditeur s'ouvre immédiatement ; l'enregistrement se fait en parallèle.
  const newNote = (type: 'text' | 'list', category: Category) => {
    setSection(category);
    const note = buildNote({
      type,
      category,
      labelIds: labelId ? [labelId] : [],
      ...(category === 'action' && type === 'text' ? { status: 'todo' as const } : {}),
      ...(category === 'project' ? { projectStatus: 'active' as const } : {}),
    });
    setEditing({ id: note.id, isNew: true, initial: note });
    void saveNote(note);
  };

  // Démarrage : synchro, nettoyage de la corbeille, raccourcis et partage Android.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Toute erreur inattendue s'affiche à l'écran au lieu de passer inaperçue.
    window.addEventListener('unhandledrejection', (e) => {
      const r = e.reason;
      toast(`Erreur : ${r instanceof Error ? `${r.name} – ${r.message}` : String(r)}`);
    });
    window.addEventListener('error', (e) => toast(`Erreur : ${e.message}`));
    startAutoSync();
    void purgeOldTrash();
    const params = new URLSearchParams(location.search);
    const shared = ['share_title', 'share_text', 'share_url'].map((k) => params.get(k)?.trim() ?? '');
    const tab = params.get('tab');
    if (shared.some(Boolean)) {
      // Partage Android : le contenu arrive dans l'inbox.
      const [title, text, url] = shared;
      const content = [title, text, url && !text.includes(url) ? url : ''].filter(Boolean).join('\n');
      void createInboxItem(content).then(() => toast('Ajouté à ton inbox'));
    } else if (tab && CATEGORIES.some((c) => c.id === tab)) {
      setSection(tab as Category);
    } else {
      setFocusInbox(Date.now());
    }
    if (location.search) history.replaceState(null, '', '/');
  }, []);

  const inboxAll = useMemo(
    () => notes.filter((n) => n.inbox && n.trashedAt === null).sort((a, b) => b.createdAt - a.createdAt),
    [notes],
  );
  const inboxItems = useMemo(() => inboxAll.filter((n) => matchesQuery(n, query)), [inboxAll, query]);

  const visible = useMemo(() => {
    if (section === 'inbox') return [];
    const list = notes.filter((n) => {
      if (section === 'trash') return n.trashedAt !== null && matchesQuery(n, query);
      if (n.trashedAt !== null || n.inbox) return false;
      if (section === 'archive' ? !n.archived : n.archived) return false;
      if (isCategory(section) && categoryOf(n) !== section) return false;
      if (labelId && !n.labelIds.includes(labelId)) return false;
      return matchesQuery(n, query);
    });
    return section === 'trash'
      ? list.sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0))
      : list.sort((a, b) => b.position - a.position);
  }, [notes, section, labelId, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { inbox: inboxAll.length };
    for (const n of notes) {
      if (n.inbox || n.archived || n.trashedAt !== null) continue;
      const cat = categoryOf(n);
      c[cat] = (c[cat] ?? 0) + 1;
      for (const l of n.labelIds) c[l] = (c[l] ?? 0) + 1;
    }
    return c;
  }, [notes, inboxAll]);

  const navigate = (s: Section, l: string | null = labelId) => {
    setSection(s);
    setLabelId(s === 'inbox' || s === 'trash' ? null : l);
    setDrawer(false);
    window.scrollTo(0, 0);
    if (s === 'inbox') setFocusInbox(Date.now());
  };

  const sortable = !query && section !== 'trash';
  const groups = groupsFor(section, visible);

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
  const heading =
    section === 'inbox' ? 'Inbox'
    : section === 'archive' ? 'Archives'
    : section === 'trash' ? 'Corbeille'
    : categoryMeta(section).plural + (currentLabel ? ` · ${currentLabel.emoji} ${currentLabel.name}` : '');
  const isTab = section === 'inbox' || isCategory(section);

  return (
    <div className="app">
      <header className="topbar">
        <IconButton name="menu" label="Menu" onClick={() => setDrawer(true)} />
        <span className="topbar-title">{heading}</span>
        <label className="search">
          <Icon name="search" size={20} />
          <input type="search" value={query} placeholder="Rechercher" onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher" />
          {query && <IconButton name="close" label="Effacer la recherche" size={18} onClick={() => setQuery('')} />}
        </label>
        {section !== 'inbox' && <IconButton name={layout === 'grid' ? 'list' : 'grid'} label={layout === 'grid' ? 'Affichage en liste' : 'Affichage en grille'} onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')} />}
        <button type="button" className={`sync-indicator ${status}`} title={SYNC_LABEL[status]} aria-label={SYNC_LABEL[status]} onClick={() => setDialog('settings')}>
          <Icon name="cloud" size={22} />
        </button>
      </header>

      {isTab && (
        <nav className="tabs" aria-label="Onglets">
          <button type="button" className={section === 'inbox' ? 'on' : ''} aria-current={section === 'inbox'} onClick={() => navigate('inbox')}>
            <Icon name="inbox" size={22} /> Inbox
            {counts.inbox > 0 && <span className="badge">{counts.inbox}</span>}
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={section === c.id ? 'on' : ''} aria-current={section === c.id} onClick={() => navigate(c.id)}>
              <Icon name={c.icon} size={22} /> {c.plural}
            </button>
          ))}
        </nav>
      )}

      {section !== 'inbox' && section !== 'trash' && labels.length > 0 && (
        <div className="label-bar" role="toolbar" aria-label="Filtrer par aire">
          <button type="button" className={`chip ${!labelId ? 'on' : ''}`} onClick={() => setLabelId(null)}>Toutes les aires</button>
          {labels.map((l) => (
            <button key={l.id} type="button" className={`chip ${labelId === l.id ? 'on' : ''}`} onClick={() => setLabelId(labelId === l.id ? null : l.id)}>
              {l.emoji} {l.name}
            </button>
          ))}
        </div>
      )}

      <main className={`content ${isTab ? 'with-tabs' : ''}`}>
        {section === 'inbox' && (
          <InboxView items={inboxItems} total={inboxAll.length} focusSignal={focusInbox} onFile={setFiling} />
        )}

        {isCategory(section) && (
          <div className="composer">
            <button type="button" className="composer-main" onClick={() => newNote('text', section)}>
              {section === 'action' ? 'Nouvelle action…' : section === 'habit' ? 'Nouvelle habitude…' : section === 'project' ? 'Nouveau projet…' : 'Nouvelle ressource…'}
            </button>
            <IconButton name="checked" label="Nouvelle liste" onClick={() => newNote('list', section)} />
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

        {groups.map((g) => (
          <section key={g.label || 'all'}>
            {g.label && <p className="section-label grid-label">{g.label}</p>}
            <NoteGrid notes={g.notes} layout={layout} sortable={sortable} render={card} />
          </section>
        ))}

        {section !== 'inbox' && visible.length === 0 && (
          <div className="empty">
            <Icon name={section === 'archive' ? 'archive' : section === 'trash' ? 'trash' : query ? 'search' : categoryMeta(section).icon} size={96} />
            <p>
              {query ? 'Aucun résultat'
                : section === 'archive' ? 'Les cartes archivées et les projets terminés s’affichent ici'
                : section === 'trash' ? 'La corbeille est vide'
                : section === 'action' ? 'Tes actions à faire s’affichent ici'
                : section === 'habit' ? 'Tes habitudes et leur régularité s’affichent ici'
                : section === 'project' ? 'Tes projets s’affichent ici'
                : 'Tes ressources (recos, idées, infos à garder) s’affichent ici'}
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
        onNavigate={(s, l) => navigate(s, l ?? null)}
        onEditLabels={() => { setDrawer(false); setDialog('labels'); }}
        onSettings={() => { setDrawer(false); setDialog('settings'); }}
        onClose={() => setDrawer(false)}
      />

      {editing && (
        <NoteEditor key={editing.id} noteId={editing.id} isNew={editing.isNew} initial={editing.initial} labels={labels} images={images} onClose={() => setEditing(null)} />
      )}
      {dialog === 'settings' && <Settings onClose={() => setDialog(null)} theme={theme} setTheme={setTheme} />}
      {filing && <FileDialog ids={filing} notes={notes} labels={labels} onClose={() => setFiling(null)} />}
      {dialog === 'labels' && <LabelManager labels={labels} onClose={() => setDialog(null)} />}
      <Toaster />
    </div>
  );
}
