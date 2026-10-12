import { db, getMeta, setMeta, tableFor } from './db';
import { logError } from './diagnostics';
import { getSession, supabase } from './supabase';
import type { Kind } from './types';

/**
 * Synchronisation avec Supabase :
 * 1. « push » : envoie ce qui a été modifié sur cet appareil (file `outbox`) ;
 * 2. « pull » : récupère ce qui a changé ailleurs depuis la dernière fois.
 * En cas de conflit, la modification la plus récente l'emporte.
 */

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline' | 'error';

let status: SyncStatus = 'local';
let lastError = '';
const listeners = new Set<() => void>();

function setStatus(s: SyncStatus, error = '') {
  status = s;
  lastError = error;
  listeners.forEach((l) => l());
}

export const syncState = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => status,
  error: () => lastError,
};

const TABLE = 'ject_records';
let running = false;
let again = false;
let timer: ReturnType<typeof setTimeout> | undefined;

export function scheduleSync(delay = 1500) {
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delay);
}

export async function syncNow() {
  if (!supabase) return setStatus('local');
  const session = await getSession();
  if (!session) return setStatus('local');
  if (typeof navigator !== 'undefined' && !navigator.onLine) return setStatus('offline');
  if (running) {
    again = true;
    return;
  }
  running = true;
  setStatus('syncing');
  try {
    await push();
    await pull();
    setStatus('synced');
  } catch (e) {
    console.error('Synchronisation', e);
    logError(`Synchronisation : ${e instanceof Error ? e.message : String(e)}`);
    setStatus(navigator.onLine ? 'error' : 'offline', e instanceof Error ? e.message : String(e));
  } finally {
    running = false;
    if (again) {
      again = false;
      scheduleSync(200);
    }
  }
}

async function push() {
  const pending = await db.outbox.toArray();
  for (let i = 0; i < pending.length; i += 50) {
    const batch = pending.slice(i, i + 50);
    const rows: { id: string; kind: Kind; data: unknown; updated_at: number; deleted: boolean }[] = [];
    for (const { id, kind } of batch) {
      const rec = await tableFor(kind).get(id);
      if (rec) rows.push({ id, kind, data: rec, updated_at: rec.updatedAt, deleted: !!rec.deleted });
    }
    if (rows.length) {
      const { error } = await supabase!.from(TABLE).upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(error.message);
    }
    // Retire de la file ce qui n'a pas été re-modifié pendant l'envoi.
    await db.transaction('rw', db.outbox, db.notes, db.labels, db.backgrounds, async () => {
      for (const row of rows) {
        const current = await tableFor(row.kind).get(row.id);
        if (current?.updatedAt === row.updated_at) await db.outbox.delete(row.id);
      }
    });
  }
}

async function pull() {
  let cursor = await getMeta<string>('pullCursor', '1970-01-01T00:00:00Z');
  for (;;) {
    const { data, error } = await supabase!
      .from(TABLE)
      .select('id, kind, data, updated_at, deleted, server_updated_at')
      .gt('server_updated_at', cursor)
      .order('server_updated_at', { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    await db.transaction('rw', db.notes, db.labels, db.backgrounds, db.outbox, async () => {
      for (const row of data) {
        const table = tableFor(row.kind);
        const local = await table.get(row.id);
        if (local && local.updatedAt > row.updated_at) continue; // la version locale est plus récente
        await table.put({ ...row.data, deleted: row.deleted || undefined });
        await db.outbox.delete(row.id);
      }
    });
    cursor = data[data.length - 1].server_updated_at;
    await setMeta('pullCursor', cursor);
    if (data.length < 500) break;
  }
}

/** Lance la synchro au démarrage, au retour du réseau, au retour sur l'app et toutes les 30 s. */
export function startAutoSync() {
  void syncNow();
  window.addEventListener('online', () => void syncNow());
  window.addEventListener('offline', () => setStatus(supabase ? 'offline' : 'local'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow();
  });
  setInterval(() => {
    if (document.visibilityState === 'visible') void syncNow();
  }, 30_000);
  supabase?.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') scheduleSync(100);
    if (event === 'SIGNED_OUT') setStatus('local');
  });
}
