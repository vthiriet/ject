import Dexie, { type Table } from 'dexie';
import type { BackgroundImage, Kind, Label, LinkPreview, Note } from './types';

/**
 * Base de données locale (IndexedDB, intégrée au navigateur) : tout y est
 * enregistré d'abord, ce qui rend l'app instantanée et utilisable hors ligne.
 */
class JectDB extends Dexie {
  notes!: Table<Note, string>;
  labels!: Table<Label, string>;
  backgrounds!: Table<BackgroundImage, string>;
  /** Éléments modifiés pas encore envoyés à Supabase. */
  outbox!: Table<{ id: string; kind: Kind }, string>;
  previews!: Table<LinkPreview, string>;
  meta!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('ject');
    this.version(1).stores({
      notes: 'id',
      labels: 'id',
      backgrounds: 'id',
      outbox: 'id',
      previews: 'url',
      meta: 'key',
    });
  }
}

export const db = new JectDB();

export function tableFor(kind: Kind): Table<any, string> {
  return kind === 'note' ? db.notes : kind === 'label' ? db.labels : db.backgrounds;
}

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key);
  return row === undefined ? fallback : (row.value as T);
}

export async function setMeta(key: string, value: unknown) {
  await db.meta.put({ key, value });
}
