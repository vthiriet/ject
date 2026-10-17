import { db, tableFor } from './db';
import { scheduleSync } from './sync';
import type { BackgroundImage, Category, ChecklistItem, Kind, Label, Note, NotionMention } from './types';

const TRASH_DAYS = 7;

/** Identifiant unique (repli pour les navigateurs sans crypto.randomUUID). */
export const uid = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16),
      );

/** Enregistre localement et met l'élément en file d'attente pour Supabase. */
async function save<T extends { id: string; updatedAt: number }>(kind: Kind, record: T) {
  record.updatedAt = Date.now();
  await db.transaction('rw', tableFor(kind), db.outbox, async () => {
    await tableFor(kind).put(record);
    await db.outbox.put({ id: record.id, kind });
  });
  scheduleSync();
  return record;
}

// ---------- Notes ----------

export function newItem(text = '', checked = false): ChecklistItem {
  return { id: uid(), text, checked };
}

/** Prépare une note sans l'enregistrer (pour ouvrir l'éditeur sans attendre). */
export function buildNote(partial: Partial<Note> = {}): Note {
  const now = Date.now();
  const note: Note = {
    id: uid(),
    type: 'text',
    title: '',
    content: '',
    items: [],
    color: 'default',
    background: null,
    pinned: false,
    archived: false,
    trashedAt: null,
    position: now,
    labelIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
  if (note.type === 'list' && note.items.length === 0) note.items = [newItem()];
  return note;
}

export const saveNote = (note: Note) => save('note', note);

export const createNote = (partial: Partial<Note> = {}) => saveNote(buildNote(partial));

export async function updateNote(id: string, patch: Partial<Note>) {
  const note = await db.notes.get(id);
  if (!note) return;
  return save('note', { ...note, ...patch });
}

export const isEmptyNote = (n: Note) =>
  !n.title.trim() && !n.content.trim() && n.items.every((i) => !i.text.trim()) && !n.background;

/** Supprime pour de bon (une « pierre tombale » est gardée pour la synchro). */
export async function deleteNoteForever(id: string) {
  const note = await db.notes.get(id);
  if (!note) return;
  await save('note', { ...note, title: '', content: '', items: [], deleted: true });
}

export const trashNote = (id: string) => updateNote(id, { trashedAt: Date.now(), pinned: false });
export const restoreNote = (id: string) => updateNote(id, { trashedAt: null });

export async function emptyTrash() {
  const trashed = await db.notes.filter((n) => !n.deleted && n.trashedAt !== null).toArray();
  for (const n of trashed) await deleteNoteForever(n.id);
}

export async function purgeOldTrash() {
  const limit = Date.now() - TRASH_DAYS * 24 * 3600 * 1000;
  const old = await db.notes.filter((n) => !n.deleted && n.trashedAt !== null && n.trashedAt < limit).toArray();
  for (const n of old) await deleteNoteForever(n.id);
}

export async function duplicateNote(id: string) {
  const n = await db.notes.get(id);
  if (!n) return;
  const { id: _id, exported: _e, ...rest } = n;
  return createNote({
    ...rest,
    title: n.title ? `${n.title} (copie)` : '',
    items: n.items.map((i) => ({ ...i, id: uid(), exported: undefined })),
    pinned: false,
    archived: false,
  });
}

/** Place `id` entre deux voisins (positions décroissantes de haut en bas). */
export async function moveNote(id: string, above: Note | undefined, below: Note | undefined) {
  let position: number;
  if (above && below) position = (above.position + below.position) / 2;
  else if (above) position = above.position - 1000;
  else if (below) position = below.position + 1000;
  else return;
  await updateNote(id, { position });
}

/** Après un export Notion : archive la note ou marque les éléments envoyés. */
export async function markExported(id: string, itemIds: string[] | 'all', mention: NotionMention) {
  const note = await db.notes.get(id);
  if (!note) return;
  if (itemIds === 'all') {
    await save('note', { ...note, exported: mention, archived: true, pinned: false });
    return;
  }
  const items = note.items.map((i) => (itemIds.includes(i.id) ? { ...i, exported: mention } : i));
  const remaining = items.filter((i) => !i.exported && i.text.trim());
  const allDone = remaining.length === 0;
  await save('note', {
    ...note,
    items,
    ...(allDone ? { exported: mention, archived: true, pinned: false } : {}),
  });
}

// ---------- Inbox ----------

export const createInboxItem = (text: string, category?: Category) =>
  createNote({ type: 'text', content: text.trim(), inbox: true, ...(category ? { category } : {}) });

/** Chaque ligne (ou élément) non vide d'un élément de l'inbox devient un élément de liste. */
function linesOf(note: Note) {
  // Une liste apporte ses éléments (son titre seulement si elle n'en a pas).
  if (note.type === 'list') {
    const texts = note.items.map((i) => i.text.trim()).filter(Boolean);
    return texts.length ? texts : [note.title.trim()].filter(Boolean);
  }
  return [note.title, ...note.content.split(/\r?\n/)].map((l) => l.trim()).filter(Boolean);
}

/** Où ranger : une carte seule, une nouvelle liste, ou une liste existante. */
export type FileTarget = { newCard: true } | { newTitle: string } | { listId: string };

/** Précisions choisies pendant le rangement. */
export interface FileDetails {
  category: Category;
  status?: 'todo' | 'waiting' | 'someday';
  projectStatus?: 'active' | 'someday';
  frequency?: string;
  labelIds?: string[];
}

function itemFor(text: string, d: FileDetails): ChecklistItem {
  const item = newItem(text);
  if ((d.category === 'action' || d.category === 'project') && (d.status === 'waiting' || d.status === 'someday')) item.status = d.status;
  if (d.category === 'habit' && d.frequency) item.frequency = d.frequency;
  return item;
}

function cardFields(d: FileDetails): Partial<Note> {
  return {
    category: d.category,
    labelIds: d.labelIds ?? [],
    ...(d.category === 'action' ? { status: d.status ?? 'todo' } : {}),
    ...(d.category === 'project' ? { projectStatus: d.projectStatus ?? 'active' } : {}),
    ...(d.category === 'habit' && d.frequency ? { frequency: d.frequency } : {}),
  };
}

/** Range des éléments de l'inbox selon le type et la destination choisis. */
export async function fileInboxItems(ids: string[], target: FileTarget, d: FileDetails) {
  const items = (await db.notes.bulkGet(ids)).filter((n): n is Note => !!n && !n.deleted);
  if (!items.length) return;
  if ('newCard' in target) {
    // L'élément devient une carte seule dans l'onglet choisi.
    for (const n of items) await save('note', { ...n, ...cardFields(d), inbox: false, position: Date.now() });
    return;
  }
  const created = items.flatMap((n) => linesOf(n).map((l) => itemFor(l, d)));
  if ('newTitle' in target) {
    await createNote({ ...cardFields(d), type: 'list', title: target.newTitle.trim(), items: created, status: undefined });
  } else {
    await appendToList(target.listId, created);
  }
  for (const n of items) await deleteNoteForever(n.id);
}

/** Ajoute des éléments à une liste, après le dernier élément non coché. */
async function appendToList(listId: string, created: ChecklistItem[]) {
  const list = await db.notes.get(listId);
  if (!list) return;
  const kept = list.items.filter((i) => i.text.trim());
  const lastOpen = kept.map((i) => !i.checked && !i.exported).lastIndexOf(true);
  kept.splice(lastOpen + 1, 0, ...created);
  await save('note', { ...list, type: 'list', items: kept, archived: false, trashedAt: null });
}


/** Change l'état d'un projet ; « terminé » l'envoie dans les Archives. */
export const setProjectStatus = (id: string, projectStatus: 'active' | 'someday' | 'done') =>
  updateNote(id, { projectStatus, archived: projectStatus === 'done', pinned: false });

// ---------- Libellés ----------

export async function createLabel(name: string, emoji = '🏷️') {
  const label: Label = { id: uid(), name: name.trim(), emoji, position: Date.now(), updatedAt: 0 };
  return save('label', label);
}

export async function updateLabel(id: string, patch: Partial<Label>) {
  const label = await db.labels.get(id);
  if (!label) return;
  return save('label', { ...label, ...patch });
}

export async function deleteLabel(id: string) {
  const label = await db.labels.get(id);
  if (!label) return;
  await save('label', { ...label, deleted: true });
  const notes = await db.notes.filter((n) => n.labelIds.includes(id)).toArray();
  for (const n of notes) await updateNote(n.id, { labelIds: n.labelIds.filter((l) => l !== id) });
}

// ---------- Images de fond importées ----------

export async function addBackgroundImage(dataUrl: string) {
  const now = Date.now();
  const img: BackgroundImage = { id: uid(), dataUrl, createdAt: now, updatedAt: now };
  return save('background', img);
}

export async function deleteBackgroundImage(id: string) {
  const img = await db.backgrounds.get(id);
  if (!img) return;
  await save('background', { ...img, dataUrl: '', deleted: true });
  const notes = await db.notes.filter((n) => n.background === `img:${id}`).toArray();
  for (const n of notes) await updateNote(n.id, { background: null });
}

// ---------- Sauvegarde ----------

export async function importBackup(data: { notes?: Note[]; labels?: Label[]; backgrounds?: BackgroundImage[] }) {
  let count = 0;
  for (const n of data.notes ?? []) if (n.id && !n.deleted) { await save('note', { ...n }); count++; }
  for (const l of data.labels ?? []) if (l.id && !l.deleted) await save('label', { ...l });
  for (const b of data.backgrounds ?? []) if (b.id && !b.deleted) await save('background', { ...b });
  return count;
}

// ---------- Habitudes ----------

/** Ajoute (ou retire, avec delta = -1) une fois faite à une date donnée. */
export async function logHabit(id: string, day: string, delta: 1 | -1) {
  const note = await db.notes.get(id);
  if (!note) return;
  const log = { ...(note.habitLog ?? {}) };
  const next = Math.max(0, (log[day] ?? 0) + delta);
  if (next) log[day] = next;
  else delete log[day];
  await save('note', { ...note, habitLog: log });
}

/**
 * Coche ou décoche une étape de routine. Quand toutes les étapes sont cochées, la routine
 * compte comme faite une fois et ses étapes se décochent pour la fois suivante.
 * Renvoie true si la routine vient d'être complétée.
 */
export async function toggleHabitStep(id: string, itemId: string, period: string, today: string) {
  const note = await db.notes.get(id);
  if (!note) return false;
  const steps = note.items.filter((i) => i.text.trim()).map((i) => i.id);
  const current = note.habitSteps?.period === period ? note.habitSteps.done : [];
  let done = current.includes(itemId) ? current.filter((d) => d !== itemId) : [...current, itemId];
  const complete = steps.length > 0 && steps.every((s) => done.includes(s));
  const log = { ...(note.habitLog ?? {}) };
  if (complete) {
    log[today] = (log[today] ?? 0) + 1;
    done = [];
  }
  await save('note', { ...note, habitSteps: { period, done }, habitLog: log });
  return complete;
}

/** Met des habitudes en pause jusqu'à une date (vacances, maladie). */
export async function pauseHabits(ids: string[], from: string, to: string) {
  for (const id of ids) {
    const note = await db.notes.get(id);
    if (!note) continue;
    const pauses = (note.habitPauses ?? []).filter((p) => p.to < from);
    await save('note', { ...note, habitPauses: [...pauses, { from, to }] });
  }
}

/** Arrête une pause en cours : elle se termine la veille. */
export async function resumeHabit(id: string, today: string, yesterday: string) {
  const note = await db.notes.get(id);
  if (!note) return;
  const pauses = (note.habitPauses ?? [])
    .map((p) => (p.from <= today && today <= p.to ? { ...p, to: yesterday } : p))
    .filter((p) => p.from <= p.to);
  await save('note', { ...note, habitPauses: pauses });
}
