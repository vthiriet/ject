import {
  addDays, goalOf, habitConfig, iso, isPaused, periodRange, progress, scaleOf, weekday, type Scale,
} from './habits';
import type { Note } from './types';

/**
 * Rappels des habitudes par notification (calcul pur, utilisé par le serveur).
 *
 * - Pas de rappel pour les habitudes quotidiennes, en pause, archivées ou déjà tenues.
 * - « Chaque mois, le N » : un rappel le jour N.
 * - Sinon : début, milieu et veille de la fin de la période
 *   (semaine : lundi, jeudi, samedi ; mois : le 1er, le 15, l'avant-dernier jour ;
 *   année : 1er janvier, 1er juillet, 1er décembre).
 * - Habitude « à éviter » : seulement en fin de période (« As-tu tenu ? »).
 * - Heure : celle du moment choisi (matin 9 h, journée 12 h, soir 18 h), 9 h sinon.
 */

export type Slot = 'date' | 'start' | 'middle' | 'end';

export interface Reminder {
  habitId: string;
  name: string;
  hour: number;
  slot: Slot;
  /** Texte court pour la notification. */
  text: string;
  /** Le bouton « +1 » a du sens (pas pour « à éviter »). */
  canAdd: boolean;
}

const HOURS = { morning: 9, day: 12, evening: 18 } as const;
const PERIOD: Record<Scale, string> = { day: "aujourd'hui", week: 'cette semaine', month: 'ce mois-ci', year: 'cette année' };

export const habitName = (n: Note) =>
  n.title.trim() || (n.type === 'text' ? n.content.trim().split('\n')[0] : '') || 'Habitude';

/** Moment de la période où tombe ce jour (début, milieu, veille de la fin), ou null. */
function slotOf(scale: Scale, day: Date): Exclude<Slot, 'date'> | null {
  const [from, to] = periodRange(scale, day);
  const d = iso(day);
  if (scale === 'week') return ({ 0: 'start', 3: 'middle', 5: 'end' } as const)[weekday(day) as 0 | 3 | 5] ?? null;
  if (scale === 'month') {
    if (d === iso(from)) return 'start';
    if (day.getDate() === 15) return 'middle';
    if (d === iso(addDays(to, -1))) return 'end';
    return null;
  }
  if (scale === 'year') {
    const md = d.slice(5);
    return md === '01-01' ? 'start' : md === '07-01' ? 'middle' : md === '12-01' ? 'end' : null;
  }
  return null;
}

/** Rappels dus le jour `day` (date locale de l'utilisateur, à minuit). */
export function remindersFor(habits: Note[], day: Date): Reminder[] {
  const out: Reminder[] = [];
  for (const n of habits) {
    if (n.deleted || n.archived || n.trashedAt !== null || n.inbox) continue;
    const c = habitConfig(n);
    const scale = scaleOf(c);
    if (scale === 'day' || c.notify === false || isPaused(n, day)) continue;
    const p = progress(n, day);
    if (p.done) continue;
    const hour = c.moment ? HOURS[c.moment] : 9;
    const name = habitName(n);
    const left = goalOf(c) - p.count;

    // Date fixée (« chaque mois, le N ») : un seul rappel, ce jour-là.
    if (c.rhythm === 'monthly' && c.monthDay) {
      const last = periodRange('month', day)[1].getDate();
      if (day.getDate() === Math.min(c.monthDay, last)) {
        out.push({ habitId: n.id, name, hour, slot: 'date', text: 'C’est le jour', canAdd: !c.avoid });
      }
      continue;
    }

    const slot = slotOf(scale, day);
    if (!slot) continue;
    if (c.avoid) {
      if (slot === 'end') out.push({ habitId: n.id, name, hour, slot, text: `As-tu tenu ${PERIOD[scale]} ?`, canAdd: false });
      continue;
    }
    const text =
      slot === 'start' ? (left > 1 ? `${left} fois ${PERIOD[scale]}` : `À faire ${PERIOD[scale]}`)
      : slot === 'middle' ? `${p.count} / ${p.goal} · encore ${left} fois ${PERIOD[scale]}`
      : scale === 'year' ? `Plus qu’un mois : encore ${left} fois`
      : `Dernier jour demain : encore ${left} fois`;
    out.push({ habitId: n.id, name, hour, slot, text, canAdd: true });
  }
  return out;
}

/** Une notification par heure : le détail si une seule habitude, sinon un résumé. */
export function digest(reminders: Reminder[]) {
  if (reminders.length === 1) {
    const r = reminders[0];
    return { title: r.name, body: r.text, habitId: r.canAdd ? r.habitId : undefined };
  }
  return {
    title: `${reminders.length} habitudes à faire`,
    body: reminders.map((r) => `${r.name} · ${r.text}`).join('\n'),
    habitId: undefined,
  };
}
