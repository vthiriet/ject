import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../lib/db';
import { describe, logError, openSettings, withTimeout } from '../lib/diagnostics';
import { initHistory, pushView, useBackClose } from '../lib/history';
import { CATEGORIES, categoryMeta, categoryOf } from '../lib/gtd';
import { appliesOn, habitConfig, isPaused, progress, scaleOf } from '../lib/habits';
import { useBackgrounds, useDbReady, useLabels, useLocalPref, useNotes, useSyncStatus, useTheme } from '../lib/hooks';
import { buildNote, createInboxItem, deleteNoteForever, emptyTrash, migrateIllustrations, migratePriorities, purgeOldTrash, mergeNotes, restoreNote, restoreNotes, saveNote, trashNote, updateNote } from '../lib/store';
import { startAutoSync } from '../lib/sync';
import { matchesQuery } from '../lib/text';
import type { Category, Note } from '../lib/types';
import { Drawer, type Section } from './Drawer';
import { Fab } from './Fab';
import { HabitCard } from './HabitCard';
import { HabitSheet } from './HabitSheet';
import { HabitReview } from './HabitReview';
import { HabitSummary } from './HabitSummary';
import { FileDialog } from './FileDialog';
import { Icon, IconButton } from './Icon';
import { InboxView } from './InboxView';
import { LabelManager } from './LabelManager';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { NoteGrid } from './NoteGrid';
import { Settings } from './Settings';
import { Swipeable } from './Swipeable';
import { toast, Toaster } from './Toast';

const isCategory = (s: Section): s is Category => CATEGORIES.some((c) => c.id === s);

type ReviewScale = 'day' | 'week' | 'month';
type Group = { label: string; notes: Note[]; progress?: { done: number; total: number }; review?: ReviewScale };

/** Regroupe les cartes d'un onglet en sections : épinglées (« Prioritaires » dans Actions), puis les autres. */
function groupsFor(section: Section, notes: Note[]): Group[] {
  if (!isCategory(section)) return [{ label: '', notes }];
  if (section === 'habit') return habitGroups(notes);
  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);
  const groups: Group[] = [];
  if (pinned.length) groups.push({ label: section === 'action' ? 'Prioritaires' : 'Épinglées', notes: pinned });
  groups.push({ label: pinned.length ? 'Autres' : '', notes: rest });
  return groups.filter((g) => g.notes.length);
}

/**
 * Habitudes : par rythme, dans un ordre stable (cocher ne déplace pas la carte), avec une
 * barre de progression par section ; puis « pas aujourd'hui » et « en pause ».
 */
function habitGroups(notes: Note[]): Group[] {
  const today = new Date();
  const tally = (list: Note[]) => ({ done: list.filter((n) => progress(n, today).done).length, total: list.length });
  // Matin, journée, soir, puis sans moment ; à moment égal, l'ordre habituel des cartes.
  const MOMENTS = ['morning', 'day', 'evening'];
  const rank = (n: Note) => {
    const m = habitConfig(n).moment;
    return m ? MOMENTS.indexOf(m) : MOMENTS.length;
  };
  const byMoment = (list: readonly Note[]) => [...list].sort((a, b) => rank(a) - rank(b));
  const active = notes.filter((n) => !isPaused(n, today));
  const of = (scale: string) => active.filter((n) => scaleOf(habitConfig(n)) === scale);
  const daily = of('day');
  return [
    ...([
      ["Aujourd'hui", daily.filter((n) => appliesOn(habitConfig(n), today)), 'day'],
      ['Cette semaine', of('week'), 'week'],
      ['Ce mois-ci', of('month'), 'month'],
      ['Cette année', of('year'), undefined],
    ] as const).map(([label, list, review]) => ({ label, notes: byMoment(list), progress: tally(list), review })),
    { label: "Pas aujourd'hui", notes: daily.filter((n) => !appliesOn(habitConfig(n), today)) },
    { label: 'En pause', notes: notes.filter((n) => isPaused(n, today)) },
  ].filter((g) => g.notes.length);
}

export default function App() {
  // Relecture de la base quand le service worker y a écrit (« +1 » depuis une notification).
  const [rev, setRev] = useState(0);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => e.data === 'ject:refresh' && setRev((r) => r + 1);
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, []);
  const notes = useNotes(rev);
  const dbReady = useDbReady();
  // Base du navigateur qui ne répond pas, même après un rechargement automatique.
  const [dbStuck, setDbStuck] = useState(false);
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
  const [settingsFocus, setSettingsFocus] = useState<'diagnostic' | undefined>();
  // Astuce « glisse vers la gauche », montrée une seule fois (au toucher seulement).
  const [tipSeen, setTipSeen] = useLocalPref<'0' | '1'>('ject-tip-prio', '0');
  const dismissTip = () => tipSeen === '0' && setTipSeen('1');
  const touchDevice = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  const [filing, setFiling] = useState<{ ids: string[]; together?: boolean } | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  // Bilan d'une section des Habitudes.
  const [review, setReview] = useState<ReviewScale | null>(null);
  const started = useRef(false);
  useBackClose(drawer, () => setDrawer(false));
  // Recherche repliée en icône, filtre des aires replié derrière le bouton « Aires ».
  const [searchOpen, setSearchOpen] = useState(false);
  const [airesOpen, setAiresOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeSearch = () => {
    setQuery('');
    setSearchOpen(false);
  };
  useBackClose(searchOpen, closeSearch);
  useBackClose(airesOpen, () => setAiresOpen(false));

  // L'éditeur s'ouvre immédiatement ; l'enregistrement se fait en parallèle.
  // Depuis l'Inbox, la carte est un élément brut ; ailleurs, elle prend le type de l'onglet.
  const newNote = (type: 'text' | 'list', category: Category | null) => {
    const note = category
      ? buildNote({
          type,
          category,
          labelIds: labelId ? [labelId] : [],
          ...(category === 'action' && type === 'text' ? { status: 'todo' as const } : {}),
          ...(category === 'project' ? { projectStatus: 'active' as const } : {}),
        })
      : buildNote({ type, inbox: true });
    setEditing({ id: note.id, isNew: true, initial: note });
    void saveNote(note);
  };

  // Démarrage : synchro, nettoyage de la corbeille, raccourcis et partage Android.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Toute erreur inattendue s'affiche à l'écran au lieu de passer inaperçue.
    // Message rassurant ; le détail technique va dans le journal (décision 47).
    const oops = () => toast('Un souci est survenu, tes cartes sont en sécurité.', { label: 'Voir le détail', run: () => openSettings('diagnostic') });
    window.addEventListener('unhandledrejection', (e) => {
      logError(describe(e.reason));
      oops();
    });
    window.addEventListener('error', (e) => {
      logError(e.message);
      oops();
    });
    window.addEventListener('ject:settings', (e) => {
      setEditing(null);
      setSettingsFocus((e as CustomEvent<'diagnostic' | undefined>).detail);
      setDialog('settings');
    });
    startAutoSync();
    // Vérifie que la base du navigateur répond. Sinon, on recharge une fois automatiquement
    // (souvent suffisant sur Chrome Android), puis on explique quoi faire.
    const RELOADED = 'ject-db-reload';
    withTimeout(db.notes.count(), 8000)
      .then(() => sessionStorage.removeItem(RELOADED))
      .catch((e) => {
        logError(`Base locale : ${describe(e)}`);
        if (!sessionStorage.getItem(RELOADED)) {
          sessionStorage.setItem(RELOADED, '1');
          location.reload();
        } else {
          sessionStorage.removeItem(RELOADED);
          setDbStuck(true);
        }
      });
    void purgeOldTrash();
    void migratePriorities();
    void migrateIllustrations();
    const params = new URLSearchParams(location.search);
    const shared = ['share_title', 'share_text', 'share_url'].map((k) => params.get(k)?.trim() ?? '');
    const tab = params.get('tab');
    if (shared.some(Boolean)) {
      // Partage Android : le contenu arrive dans l'inbox.
      const [title, text, url] = shared;
      const content = [title, text, url && !text.includes(url) ? url : ''].filter(Boolean).join('\n');
      void createInboxItem(content).then(() => toast('Ajouté à ton Inbox'));
    } else if (tab && CATEGORIES.some((c) => c.id === tab)) {
      setSection(tab as Category);
    } else if (params.get('new') === 'inbox') {
      newNote('text', null);
    }
    // Bouton « précédent » du téléphone : retour à l'onglet d'avant (après lecture de l'adresse).
    const startTab = tab && CATEGORIES.some((c) => c.id === tab) ? tab : 'inbox';
    initHistory({ section: startTab, labelId: null }, (v) => {
      setSection(v.section as Section);
      setLabelId(v.labelId);
      window.scrollTo(0, 0);
    });
  }, []);

  const inboxAll = useMemo(
    () => notes.filter((n) => n.inbox && !n.archived && n.trashedAt === null).sort((a, b) => b.createdAt - a.createdAt),
    [notes],
  );
  const inboxItems = useMemo(() => inboxAll.filter((n) => matchesQuery(n, query)), [inboxAll, query]);

  const visible = useMemo(() => {
    if (section === 'inbox') return [];
    const list = notes.filter((n) => {
      if (section === 'trash') return n.trashedAt !== null && matchesQuery(n, query);
      if (n.trashedAt !== null || (n.inbox && section !== 'archive')) return false;
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
    const label = s === 'inbox' || s === 'trash' ? null : l;
    setSection(s);
    setLabelId(label);
    pushView({ section: s, labelId: label });
    setDrawer(false);
    setAiresOpen(false);
    window.scrollTo(0, 0);
  };

  const sortable = !query && section !== 'trash';

  // Lâcher une carte au centre d'une autre : elles fusionnent en une liste (annulable).
  const merge = async (sourceId: string, targetId: string) => {
    const before = await mergeNotes(sourceId, targetId);
    if (before) toast('Cartes fusionnées en liste', { label: 'Annuler', run: () => void restoreNotes(before) });
  };
  // Inbox : fusionne les cartes sélectionnées dans la première (annulable d'un coup).
  const mergeMany = async ([target, ...sources]: string[]) => {
    const snapshots: Note[][] = [];
    for (const source of sources) {
      const before = await mergeNotes(source, target);
      if (before) snapshots.push(before);
    }
    if (!snapshots.length) return;
    toast('Cartes fusionnées en liste', {
      label: 'Annuler',
      run: () => void (async () => {
        for (const snap of snapshots.reverse()) await restoreNotes(snap);
      })(),
    });
  };
  const groups = groupsFor(section, visible);

  const habits = useMemo(() => notes.filter((n) => categoryOf(n) === 'habit' && !n.inbox && !n.archived && n.trashedAt === null), [notes]);

  // Actions : un seul niveau de priorité, porté par l'épingle ; annulable.
  const togglePriority = (n: Note) => {
    const was = n.pinned;
    void updateNote(n.id, { pinned: !was });
    toast(was ? 'Priorité retirée' : 'Prioritaire', { label: 'Annuler', run: () => void updateNote(n.id, { pinned: was }) });
    dismissTip();
  };

  const card = (n: Note) =>
    section === 'action' ? (
      // Glisser vers la gauche au doigt : prioritaire ; à la souris, flamme au survol.
      <Swipeable
        reveal={<><Icon name="flame" size={20} fill={!n.pinned} /> {n.pinned ? 'Retirer la priorité' : 'Prioritaire'}</>}
        onSwipe={() => togglePriority(n)}
      >
        {categoryCard(n)}
      </Swipeable>
    ) : categoryCard(n);

  const categoryCard = (n: Note) =>
    section === 'habit' ? (
      <HabitCard note={n} onOpen={() => setSheet(n.id)} />
    ) : section === 'trash' ? (
      <NoteCard
        note={n}
        labels={labels}
        images={images}
        onOpen={() => toast('Restaure la carte pour la modifier')}
        actions={
          <>
            <IconButton name="restore" label="Restaurer" onClick={() => void restoreNote(n.id)} />
            <IconButton name="trash" label="Supprimer définitivement" onClick={() => confirm('Supprimer définitivement cette carte ?') && void deleteNoteForever(n.id)} />
          </>
        }
      />
    ) : (
      <NoteCard
        note={n}
        labels={labels}
        images={images}
        onOpen={() => setEditing({ id: n.id, isNew: false })}
        actions={
          section === 'action' ? (
            <IconButton
              name="flame"
              label={n.pinned ? 'Retirer la priorité' : 'Prioritaire'}
              active={n.pinned}
              className="prio-hover"
              onClick={() => togglePriority(n)}
            />
          ) : undefined
        }
        sideAction={
          isCategory(section) ? (
            <IconButton
              name="check"
              label="Archiver"
              size={22}
              onClick={() => {
                void updateNote(n.id, { archived: true, pinned: false });
                toast('Archivée', { label: 'Annuler', run: () => void updateNote(n.id, { archived: false, pinned: n.pinned }) });
              }}
            />
          ) : section === 'archive' ? (
            // Dans les Archives : remettre en place, ou supprimer (corbeille, 7 jours).
            <>
              <IconButton name="unarchive" label="Désarchiver" size={20} onClick={() => void updateNote(n.id, { archived: false })} />
              <IconButton
                name="trash"
                label="Supprimer"
                size={20}
                onClick={() => {
                  void trashNote(n.id);
                  toast('Carte placée dans la corbeille', { label: 'Annuler', run: () => void restoreNote(n.id) });
                }}
              />
            </>
          ) : undefined
        }
      />
    );

  const currentLabel = labels.find((l) => l.id === labelId);
  const heading =
    section === 'inbox' ? 'Inbox'
    : section === 'archive' ? 'Archives'
    : section === 'trash' ? 'Corbeille'
    : categoryMeta(section).plural;
  const isTab = section === 'inbox' || isCategory(section);

  return (
    <div className="app">
      <header className="topbar">
        <IconButton name="menu" label="Menu" onClick={() => setDrawer(true)} />
        <h1 className="topbar-title">{heading}</h1>
        <label className={`search ${searchOpen || query ? 'open' : ''}`}>
          <Icon name="search" size={20} />
          <input ref={searchRef} type="search" value={query} placeholder="Rechercher" onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher" />
          {(query || searchOpen) && <IconButton name="close" label="Fermer la recherche" size={18} onClick={closeSearch} />}
        </label>
        <IconButton
          name="search"
          label="Rechercher"
          className="search-toggle"
          onClick={() => {
            setSearchOpen(true);
            setTimeout(() => searchRef.current?.focus(), 0);
          }}
        />
        {section !== 'inbox' && section !== 'trash' && labels.length > 0 && (
          <button
            type="button"
            className={`aires-btn ${labelId || airesOpen ? 'on' : ''}`}
            aria-expanded={airesOpen}
            onClick={() => setAiresOpen(!airesOpen)}
          >
            <Icon name="funnel" size={20} fill={!!labelId} />
            <span>{currentLabel ? currentLabel.name : 'Catégories'}</span>
          </button>
        )}
      </header>

      {isTab && (
        <nav className="tabs" aria-label="Onglets">
          <button type="button" className={section === 'inbox' ? 'on' : ''} aria-current={section === 'inbox'} onClick={() => navigate('inbox')}>
            <span className="tab-pill">
              <Icon name="inbox" size={22} fill={section === 'inbox'} />
              {counts.inbox > 0 && <span className="badge">{counts.inbox}</span>}
            </span>
            Inbox
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={section === c.id ? 'on' : ''} aria-current={section === c.id} onClick={() => navigate(c.id)}>
              <span className="tab-pill">
                <Icon name={c.icon} size={22} fill={section === c.id} />
              </span>
              {c.plural}
            </button>
          ))}
        </nav>
      )}

      {airesOpen && section !== 'inbox' && section !== 'trash' && (
        <div className="label-bar" role="toolbar" aria-label="Filtrer par catégorie">
          <button type="button" className={`chip ${!labelId ? 'on' : ''}`} onClick={() => { setLabelId(null); setAiresOpen(false); }}>Toutes les catégories</button>
          {labels.map((l) => (
            <button key={l.id} type="button" className={`chip ${labelId === l.id ? 'on' : ''}`} onClick={() => { setLabelId(labelId === l.id ? null : l.id); setAiresOpen(false); }}>
              {l.emoji} {l.name}
            </button>
          ))}
        </div>
      )}

      <main className={`content ${isTab ? 'with-tabs' : ''}`}>
        {!dbReady ? (
          <div className="empty">
            {dbStuck ? (
              <div className="db-stuck">
                <p><strong>La mémoire du navigateur ne répond pas.</strong> Tes cartes sont en sécurité (sur ton compte si tu es connecté).</p>
                <p>Ferme complètement le navigateur (Paramètres du téléphone › Applications › Chrome › Forcer l’arrêt), ferme les autres onglets Ject, puis rouvre Ject.</p>
                <button type="button" className="btn primary" onClick={() => location.reload()}>Réessayer</button>
              </div>
            ) : (
              <p>Chargement…</p>
            )}
          </div>
        ) : (
          <>
          {section === 'inbox' && (
            <InboxView
              items={inboxItems}
              total={inboxAll.length}
              onOpen={(id) => setEditing({ id, isNew: false })}
              onFile={(ids, together) => setFiling({ ids, together })}
              onMerge={(ids) => void mergeMany(ids)}
            />
          )}


          {section === 'trash' && visible.length > 0 && (
            <div className="trash-head">
              <span>Les cartes de la corbeille sont supprimées après 7 jours.</span>
              <button type="button" className="link-btn" onClick={() => confirm('Vider la corbeille ? Les cartes seront supprimées définitivement.') && void emptyTrash()}>
                Vider la corbeille
              </button>
            </div>
          )}

          {section === 'habit' && !query && <HabitSummary habits={habits} />}
            {section === 'action' && touchDevice && tipSeen === '0' && visible.length > 0 && (
              <div className="tip">
                <Icon name="flame" size={18} />
                <span>Astuce : glisse une action vers la gauche pour la rendre prioritaire.</span>
                <IconButton name="close" label="Fermer l’astuce" size={18} onClick={dismissTip} />
              </div>
            )}

          {groups.map((g) => (
            <section key={g.label || 'all'}>
              {g.label && !g.progress && <p className="section-label grid-label">{g.label}</p>}
              {g.progress && (
                // En-tête : le toucher ouvre le bilan de la section (quotidiennes, hebdomadaires, mensuelles).
                <button
                  type="button"
                  className="section-progress"
                  disabled={!g.review}
                  aria-label={`${g.label} : ${g.progress.done} sur ${g.progress.total} tenues${g.review ? '. Voir le bilan' : ''}`}
                  onClick={() => g.review && setReview(g.review)}
                >
                  <span className="section-label grid-label">
                    {g.label}
                    {/* Le compteur grossit un instant quand il change (décision 15). */}
                    <span key={g.progress.done} className="bump">{g.progress.done} / {g.progress.total}</span>
                    {g.review && <Icon name="next" size={16} />}
                  </span>
                  <span className="habit-bar">
                    <span style={{ width: `${Math.round((g.progress.done / g.progress.total) * 100)}%` }} />
                  </span>
                </button>
              )}
              <NoteGrid
                notes={g.notes}
                layout={section === 'habit' ? 'list' : layout}
                sortable={sortable && section !== 'habit'}
                onMerge={isCategory(section) && section !== 'habit' ? (a, b) => void merge(a, b) : undefined}
                render={card}
              />
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
          </>
        )}
      </main>

      {isTab && <Fab onNew={() => newNote('text', isCategory(section) ? section : null)} />}

      <Drawer
        open={drawer}
        section={section}
        labelId={labelId}
        labels={labels}
        counts={counts}
        layout={layout}
        onToggleLayout={() => setLayout(layout === 'grid' ? 'list' : 'grid')}
        syncStatus={status}
        onNavigate={(s, l) => navigate(s, l ?? null)}
        onEditLabels={() => { setDrawer(false); setDialog('labels'); }}
        onSettings={() => { setDrawer(false); setDialog('settings'); }}
        onClose={() => setDrawer(false)}
      />

      {editing && (
        <NoteEditor key={editing.id} noteId={editing.id} isNew={editing.isNew} initial={editing.initial} labels={labels} images={images} onClose={() => setEditing(null)} />
      )}
      {dialog === 'settings' && <Settings onClose={() => { setDialog(null); setSettingsFocus(undefined); }} theme={theme} setTheme={setTheme} focus={settingsFocus} />}
      {sheet && notes.find((n) => n.id === sheet) && (
        <HabitSheet
          note={notes.find((n) => n.id === sheet)!}
          onClose={() => setSheet(null)}
          onEdit={() => {
            setSheet(null);
            setEditing({ id: sheet, isNew: false });
          }}
        />
      )}
      {review && (
        <HabitReview
          scale={review}
          habits={habits.filter((h) => scaleOf(habitConfig(h)) === review)}
          onClose={() => setReview(null)}
        />
      )}
      {filing && <FileDialog ids={filing.ids} together={filing.together} notes={notes} onClose={() => setFiling(null)} />}
      {dialog === 'labels' && <LabelManager labels={labels} onClose={() => setDialog(null)} />}
      <Toaster />
    </div>
  );
}
