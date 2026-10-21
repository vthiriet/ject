import {
  addDays, appliesOn, countIn, goalOf, habitConfig, iso, isPaused, periodRange, weekday,
} from './habits';
import { habitName } from './reminders';
import type { Note } from './types';

/**
 * Bilans des habitudes (calcul pur) : quotidiennes sur la semaine, le mois, l'année ;
 * hebdomadaires sur le mois et l'année ; mensuelles sur l'année.
 *
 * Un jour (ou une semaine, un mois) compte s'il est passé, ou en cours et déjà tenu.
 * Ne comptent pas : les pauses, les jours non concernés (« pas le week-end »…),
 * avant la création de l'habitude, et l'avenir.
 */

/** État d'une case : tenu, pas tenu, en cours (pas encore tenu), à venir, sans objet. */
export type Mark = 'ok' | 'ko' | 'now' | 'future' | 'na';

export interface Rate {
  name: string;
  done: number;
  total: number;
  pct: number | null;
}

const today0 = (today: Date) => new Date(today.getFullYear(), today.getMonth(), today.getDate());
const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : null);
const created = (n: Note) => today0(new Date(n.createdAt || 0));

/** Une habitude quotidienne, un jour donné. */
export function dayMark(n: Note, d: Date, today: Date): Mark {
  const t = today0(today);
  if (d > t) return 'future';
  if (d < created(n) || isPaused(n, d) || !appliesOn(habitConfig(n), d)) return 'na';
  const done = (n.habitLog?.[iso(d)] ?? 0) > 0;
  if (done) return 'ok';
  return iso(d) === iso(t) ? 'now' : 'ko';
}

/** Une habitude comptée (semaine, mois), sur la période qui commence à `from`. */
export function periodMark(n: Note, scale: 'week' | 'month', from: Date, today: Date): { mark: Mark; count: number; goal: number } {
  const [start, end] = periodRange(scale, from);
  const t = today0(today);
  const goal = goalOf(habitConfig(n));
  const count = countIn(n, start, end);
  if (start > t) return { mark: 'future', count, goal };
  if (end < created(n) || (isPaused(n, start) && isPaused(n, end))) return { mark: 'na', count, goal };
  if (count >= goal) return { mark: 'ok', count, goal };
  return { mark: end >= t ? 'now' : 'ko', count, goal };
}

const tally = (marks: Mark[]) => {
  const done = marks.filter((m) => m === 'ok').length;
  const total = done + marks.filter((m) => m === 'ko').length;
  return { done, total };
};

function rates(habits: Note[], marksOf: (n: Note) => Mark[]): Rate[] {
  return habits
    .map((n) => {
      const { done, total } = tally(marksOf(n));
      return { name: habitName(n), done, total, pct: pct(done, total) };
    })
    .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
}

const daysBetween = (from: Date, to: Date) => {
  const out: Date[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
};

// ---------- Quotidiennes ----------

export function dailyWeek(habits: Note[], anyDay: Date, today: Date) {
  const [from, to] = periodRange('week', anyDay);
  const days = daysBetween(from, to);
  const rows = habits.map((n) => ({ name: habitName(n), marks: days.map((d) => dayMark(n, d, today)) }));
  const all = tally(rows.flatMap((r) => r.marks));
  return { from, to, days, rows, pct: pct(all.done, all.total), rates: rates(habits, (n) => days.map((d) => dayMark(n, d, today))) };
}

export function dailyMonth(habits: Note[], anyDay: Date, today: Date) {
  const [from, to] = periodRange('month', anyDay);
  const days = daysBetween(from, to).map((d) => {
    const marks = habits.map((n) => dayMark(n, d, today));
    const { done, total } = tally(marks);
    const future = d > today0(today);
    // Part des quotidiennes tenues ce jour-là (null : rien à compter).
    return { date: d, future, isToday: iso(d) === iso(today), share: total ? done / total : null, done, total };
  });
  const all = days.reduce((a, d) => ({ done: a.done + d.done, total: a.total + d.total }), { done: 0, total: 0 });
  const allDays = daysBetween(from, to);
  return {
    from, to, lead: weekday(from), days, pct: pct(all.done, all.total),
    rates: rates(habits, (n) => allDays.map((d) => dayMark(n, d, today))),
  };
}

export function dailyYear(habits: Note[], year: number, today: Date) {
  const months = Array.from({ length: 12 }, (_, m) => {
    const [from, to] = periodRange('month', new Date(year, m, 1));
    const days = daysBetween(from, to);
    const { done, total } = tally(habits.flatMap((n) => days.map((d) => dayMark(n, d, today))));
    return { month: m, future: from > today0(today), current: today.getFullYear() === year && today.getMonth() === m, pct: pct(done, total) };
  });
  const yearDays = daysBetween(new Date(year, 0, 1), new Date(year, 11, 31));
  const all = tally(habits.flatMap((n) => yearDays.map((d) => dayMark(n, d, today))));
  return { months, pct: pct(all.done, all.total), rates: rates(habits, (n) => yearDays.map((d) => dayMark(n, d, today))) };
}

// ---------- Hebdomadaires ----------

/** Semaines (début lundi) qui touchent le mois. */
function weeksOfMonth(anyDay: Date) {
  const [from, to] = periodRange('month', anyDay);
  const out: Date[] = [];
  for (let w = periodRange('week', from)[0]; w <= to; w = addDays(w, 7)) out.push(w);
  return out;
}

/** Semaines dont le lundi tombe dans l'année. */
function weeksOfYear(year: number) {
  const out: Date[] = [];
  let w = periodRange('week', new Date(year, 0, 1))[0];
  if (w.getFullYear() < year) w = addDays(w, 7);
  for (; w.getFullYear() === year; w = addDays(w, 7)) out.push(w);
  return out;
}

export function weeklyMonth(habits: Note[], anyDay: Date, today: Date) {
  const weeks = weeksOfMonth(anyDay);
  const rows = habits.map((n) => ({
    name: habitName(n),
    avoid: !!habitConfig(n).avoid,
    cells: weeks.map((w) => periodMark(n, 'week', w, today)),
  }));
  const all = tally(rows.flatMap((r) => r.cells.map((c) => c.mark)));
  return { weeks, rows, done: all.done, total: all.total, rates: rates(habits, (n) => weeks.map((w) => periodMark(n, 'week', w, today).mark)) };
}

export function weeklyYear(habits: Note[], year: number, today: Date) {
  const weeks = weeksOfYear(year);
  const months = Array.from({ length: 12 }, (_, m) => {
    const inMonth = weeks.filter((w) => w.getMonth() === m);
    const { done, total } = tally(habits.flatMap((n) => inMonth.map((w) => periodMark(n, 'week', w, today).mark)));
    return { month: m, future: new Date(year, m, 1) > today0(today), current: today.getFullYear() === year && today.getMonth() === m, pct: pct(done, total) };
  });
  const all = tally(habits.flatMap((n) => weeks.map((w) => periodMark(n, 'week', w, today).mark)));
  return { months, pct: pct(all.done, all.total), rates: rates(habits, (n) => weeks.map((w) => periodMark(n, 'week', w, today).mark)) };
}

// ---------- Mensuelles ----------

export function monthlyYear(habits: Note[], year: number, today: Date) {
  const months = Array.from({ length: 12 }, (_, m) => new Date(year, m, 1));
  const rows = habits.map((n) => {
    const cells = months.map((m) => periodMark(n, 'month', m, today).mark);
    const { done, total } = tally(cells);
    return { name: habitName(n), cells, done, total };
  });
  const all = tally(rows.flatMap((r) => r.cells));
  return { rows, done: all.done, total: all.total };
}

/** Pour la navigation : la même période, décalée de `step` semaines, mois ou années. */
export function shift(scale: 'week' | 'month' | 'year', d: Date, step: number) {
  if (scale === 'week') return addDays(d, 7 * step);
  if (scale === 'month') return new Date(d.getFullYear(), d.getMonth() + step, 1);
  return new Date(d.getFullYear() + step, 0, 1);
}
