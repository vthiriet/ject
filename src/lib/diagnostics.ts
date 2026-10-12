import { db } from './db';
import { createInboxItem, deleteNoteForever } from './store';
import { getSession } from './supabase';
import { syncState } from './sync';

declare const __BUILD_TIME__: string;

/** Dernières erreurs rencontrées (affichées dans Paramètres › Diagnostic). */
const errors: string[] = [];

export function logError(message: string) {
  errors.unshift(`${new Date().toLocaleTimeString('fr-FR')} ${message}`);
  errors.length = Math.min(errors.length, 10);
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
    const all = await db.notes.toArray();
    add('Notes enregistrées', all.length);
    add('dont Inbox', all.filter((n) => n.inbox && !n.deleted && n.trashedAt === null).length);
    add('dont supprimées', all.filter((n) => n.deleted).length);
    add('En attente d’envoi', await db.outbox.count());
  } catch (e) {
    add('Lecture de la base', `ÉCHEC ${describe(e)}`);
  }
  // Essai réel : ajouter un élément à l'inbox, le relire, puis l'effacer.
  try {
    const note = await createInboxItem('Test diagnostic');
    const back = await db.notes.get(note.id);
    add('Essai d’ajout à l’inbox', back?.inbox ? 'OK' : 'ÉCHEC (élément introuvable après ajout)');
    await deleteNoteForever(note.id);
  } catch (e) {
    add('Essai d’ajout à l’inbox', `ÉCHEC ${describe(e)}`);
  }
  try {
    const session = await getSession();
    add('Compte', session?.user.email ?? 'non connecté');
  } catch (e) {
    add('Compte', `ÉCHEC ${describe(e)}`);
  }
  add('Synchronisation', `${syncState.get()} ${syncState.error()}`.trim());
  add('Dernières erreurs', errors.length ? `\n  ${errors.join('\n  ')}` : 'aucune');
  return lines.join('\n');
}

export const describe = (e: unknown) => (e instanceof Error ? `${e.name} – ${e.message}` : String(e));
