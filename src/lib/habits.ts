import type { HabitConfig, Note } from './types';

/**
 * Calculs des habitudes : périodes (jour, semaine du lundi, mois, année), progression
 * et pourcentage de réussite.
 */

export type Scale = 'day' | 'week' | 'month' | 'year';

const pad = (n: number) => String(n).padStart(2, '0');

/** Date locale au format AAAA-MM-JJ. */
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** 0 = lundi … 6 = dimanche. */
export const weekday = (d: Date) => (d.getDay() + 6) % 7;
export const isWeekend = (d: Date) => weekday(d) >= 5;

export const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Anciennes régularités (texte) converties en réglages. */
function fromFrequency(f?: string): HabitConfig {
  if (!f || f === 'daily') return { rhythm: 'daily' };
  if (f === 'weekly') return { rhythm: 'weekly' };
  if (f === 'monthly') return { rhythm: 'monthly' };
  const m = f.match(/^(\d)-(week|month)$/);
  if (m) return { rhythm: m[2] === 'week' ? 'perWeek' : 'perMonth', times: Number(m[1]) };
  return { rhythm: 'daily', target: f };
}

export const habitConfig = (n: Note): HabitConfig => n.habit ?? fromFrequency(n.frequency);

export function scaleOf(c: HabitConfig): Scale {
  if (c.rhythm === 'daily' || c.rhythm === 'days') return 'day';
  if (c.rhythm === 'perWeek' || c.rhythm === 'weekly') return 'week';
  if (c.rhythm === 'perYear' || c.rhythm === 'yearly') return 'year';
  return 'month';
}

/** Nombre de fois à faire par période. */
export function goalOf(c: HabitConfig) {
  if (c.rhythm === 'perWeek' || c.rhythm === 'perMonth' || c.rhythm === 'perYear') return Math.max(1, c.times ?? 1);
  return 1;
}

/** Début et fin (inclus) de la période contenant `d`. */
export function periodRange(scale: Scale, date: Date): [Date, Date] {
  // On raisonne en journées entières (minuit), sans tenir compte de l'heure.
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (scale === 'day') return [d, d];
  if (scale === 'week') {
    const start = addDays(d, -weekday(d));
    return [start, addDays(start, 6)];
  }
  if (scale === 'year') return [new Date(d.getFullYear(), 0, 1), new Date(d.getFullYear(), 11, 31)];
  return [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 0)];
}

export const periodKey = (scale: Scale, d: Date) => iso(periodRange(scale, d)[0]);

export function countIn(n: Note, from: Date, to: Date) {
  let total = 0;
  for (const [day, count] of Object.entries(n.habitLog ?? {})) {
    const t = parse(day);
    if (t >= from && t <= to) total += count;
  }
  return total;
}

export function isPaused(n: Note, d: Date) {
  const day = iso(d);
  return (n.habitPauses ?? []).some((p) => p.from <= day && day <= p.to);
}

/** Pause en cours (ou à venir) : la dernière qui n'est pas terminée. */
export function currentPause(n: Note, today: Date) {
  const day = iso(today);
  return (n.habitPauses ?? []).find((p) => p.to >= day && p.from <= day);
}

/** Une habitude quotidienne s'applique-t-elle ce jour-là ? */
export function appliesOn(c: HabitConfig, d: Date) {
  if (c.rhythm === 'daily') return !(c.noWeekend && isWeekend(d));
  if (c.rhythm === 'days') return (c.days ?? []).includes(weekday(d));
  return true;
}

export interface Progress {
  scale: Scale;
  goal: number;
  count: number;
  done: boolean;
  /** Jours restants dans la période, aujourd'hui compris. */
  daysLeft: number;
}

export function progress(n: Note, today = new Date()): Progress {
  const c = habitConfig(n);
  const scale = scaleOf(c);
  const [from, to] = periodRange(scale, today);
  const goal = goalOf(c);
  const count = countIn(n, from, to);
  const daysLeft = Math.round((to.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000) + 1;
  return { scale, goal, count, done: count >= goal, daysLeft };
}

const PERIOD_WORD: Record<Scale, string> = { day: "aujourd'hui", week: 'cette semaine', month: 'ce mois-ci', year: 'cette année' };

/** Petit message d'encouragement selon l'avancement. */
export function encouragement(n: Note, p = progress(n)) {
  const c = habitConfig(n);
  const word = PERIOD_WORD[p.scale];
  if (p.done) return c.avoid ? `Tenu ${word} 💪` : `Objectif atteint ${word} 🎉`;
  const left = p.goal - p.count;
  if (p.scale === 'day') return c.target ? `Objectif : ${c.target}` : '';
  if (left > p.daysLeft) return `Il reste ${p.daysLeft} jour${p.daysLeft > 1 ? 's' : ''} pour ${left} fois : on s'accroche !`;
  if (left === 1) return p.count > 0 ? `Plus qu'une fois ${word} !` : `À faire ${word}`;
  if (p.count > 0) return `Encore ${left} fois ${word}, bien lancé !`;
  return `${left} fois ${word}`;
}

/**
 * Réussite sur les dernières périodes (4 semaines, 3 mois ou 3 ans) : périodes tenues /
 * périodes comptées. La période en cours ne compte que si elle est déjà réussie ;
 * les périodes en pause sont ignorées. Renvoie null pour une habitude quotidienne.
 */
export function successRate(n: Note, today = new Date()) {
  const c = habitConfig(n);
  const scale = scaleOf(c);
  if (scale === 'day') return null;
  const count = scale === 'week' ? 4 : 3;
  const back = (i: number) =>
    scale === 'week' ? addDays(today, -7 * i)
    : scale === 'year' ? new Date(today.getFullYear() - i, 0, 1)
    : new Date(today.getFullYear(), today.getMonth() - i, 1);
  const goal = goalOf(c);
  const created = new Date(n.createdAt);
  let ok = 0;
  let total = 0;
  for (let i = 0; i < count; i++) {
    const [from, to] = periodRange(scale, back(i));
    if (to < periodRange(scale, created)[0]) break; // avant la création de l'habitude
    if (isPaused(n, from) && isPaused(n, to)) continue;
    const done = countIn(n, from, to) >= goal;
    if (i === 0 && !done) continue;
    total++;
    if (done) ok++;
  }
  return total ? { rate: Math.round((ok / total) * 100), periods: total, scale } : null;
}

/** Historique : les dernières périodes avec leur compte (pour la fiche détaillée). */
export function history(n: Note, periods: number, today = new Date()) {
  const c = habitConfig(n);
  const scale = scaleOf(c);
  const out: { label: string; count: number; goal: number; paused: boolean }[] = [];
  for (let i = periods - 1; i >= 0; i--) {
    const ref =
      scale === 'day' ? addDays(today, -i)
      : scale === 'week' ? addDays(today, -7 * i)
      : scale === 'year' ? new Date(today.getFullYear() - i, 0, 1)
      : new Date(today.getFullYear(), today.getMonth() - i, 1);
    const [from, to] = periodRange(scale, ref);
    const label =
      scale === 'day' ? DAY_NAMES[weekday(from)]
      : scale === 'week' ? `${from.getDate()}/${from.getMonth() + 1}`
      : scale === 'year' ? String(from.getFullYear())
      : from.toLocaleDateString('fr-FR', { month: 'short' });
    out.push({ label, count: countIn(n, from, to), goal: goalOf(c), paused: isPaused(n, from) && isPaused(n, to) });
  }
  return out;
}

/** Libellé lisible du rythme. */
export function rhythmLabel(c: HabitConfig) {
  switch (c.rhythm) {
    case 'daily':
      return c.noWeekend ? 'Chaque jour de semaine' : 'Chaque jour';
    case 'days':
      return (c.days ?? []).length ? (c.days ?? []).slice().sort().map((d) => DAY_NAMES[d]).join(', ') : 'Certains jours';
    case 'perWeek':
      return `${goalOf(c)} fois par semaine`;
    case 'weekly':
      return 'Chaque semaine';
    case 'perMonth':
      return `${goalOf(c)} fois par mois`;
    case 'monthly':
      return c.monthDay ? `Chaque mois (le ${c.monthDay})` : 'Chaque mois';
    case 'perYear':
      return `${goalOf(c)} fois par an`;
    case 'yearly':
      return 'Chaque année';
  }
}

export const MOMENT_LABEL = { morning: 'Matin', day: 'Journée', evening: 'Soir' } as const;
