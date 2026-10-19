import { db } from './db';
import { createInboxItem, deleteNoteForever } from './store';
import { getSession } from './supabase';
import { syncState } from './sync';

declare const __BUILD_TIME__: string;

/** Dernières erreurs rencontrées (affichées dans Réglages › Diagnostic). */
const errors: string[] = [];

export function logError(message: string) {
  errors.unshift(`${new Date().toLocaleTimeString('fr-FR')} ${message}`);
  errors.length = Math.min(errors.length, 10);
}

/** Journal des erreurs, de la plus récente à la plus ancienne. */
export const errorLog = () => [...errors];

/** Ouvre les Réglages depuis n'importe où (éventuellement sur le Diagnostic). */
export const openSettings = (section?: 'diagnostic') =>
  window.dispatchEvent(new CustomEvent('ject:settings', { detail: section }));

/** Échoue si l'opération ne répond pas à temps (base du navigateur bloquée). */
export function withTimeout<T>(promise: Promise<T>, ms = 4000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`pas de réponse après ${ms / 1000} s (base du navigateur bloquée)`)), ms)),
  ]);
}

/** Rapport lisible sur l'état de l'app sur cet appareil. */
export async function runDiagnostics(): Promise<string> {
  const lines: string[] = [];
  const add = (k: string, v: unknown) => lines.push(`${k} : ${v}`);
  add('Version', typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : 'inconnue');
  add('Navigateur', navigator.userAgent);
  add('En ligne', navigator.onLine ? 'oui' : 'non');
  add('Service worker', navigator.serviceWorker?.controller ? 'actif' : 'aucun');
  try {
    const all = await withTimeout(db.notes.toArray());
    add('Cartes enregistrées', all.length);
    add('dont Inbox', all.filter((n) => n.inbox && !n.deleted && n.trashedAt === null).length);
    add('dont supprimées', all.filter((n) => n.deleted).length);
    add('En attente d’envoi', await withTimeout(db.outbox.count()));
  } catch (e) {
    add('Lecture de la base', `ÉCHEC ${describe(e)}`);
  }
  // Essai réel : ajouter un élément à l'inbox, le relire, puis l'effacer.
  try {
    const note = await withTimeout(createInboxItem('Test diagnostic'));
    const back = await withTimeout(db.notes.get(note.id));
    add('Essai d’ajout à l’Inbox', back?.inbox ? 'OK' : 'ÉCHEC (élément introuvable après ajout)');
    await withTimeout(deleteNoteForever(note.id));
  } catch (e) {
    add('Essai d’ajout à l’Inbox', `ÉCHEC ${describe(e)}`);
  }
  try {
    const session = await withTimeout(getSession());
    add('Compte', session?.user.email ?? 'non connecté');
  } catch (e) {
    add('Compte', `ÉCHEC ${describe(e)}`);
  }
  add('Synchronisation', `${syncState.get()} ${syncState.error()}`.trim());
  add('Dernières erreurs', errors.length ? `\n  ${errors.join('\n  ')}` : 'aucune');
  return lines.join('\n');
}

export const describe = (e: unknown) => (e instanceof Error ? `${e.name} – ${e.message}` : String(e));
