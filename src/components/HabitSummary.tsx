import { useState } from 'react';
import { addDays, habitConfig, isPaused, iso, level, pointsOf, progress, scaleOf } from '../lib/habits';
import { pauseHabits, resumeHabit } from '../lib/store';
import type { Note } from '../lib/types';
import { toast } from './Toast';

/** En-tête de l'onglet Habitudes : bilan de la semaine et du mois, niveau, pause générale. */
export function HabitSummary({ habits }: { habits: Note[] }) {
  const [pausing, setPausing] = useState(false);
  const today = new Date();
  const [until, setUntil] = useState(iso(addDays(today, 7)));
  const active = habits.filter((h) => !isPaused(h, today));
  const tally = (scale: 'week' | 'month') => {
    const list = active.filter((h) => scaleOf(habitConfig(h)) === scale);
    return { done: list.filter((h) => progress(h, today).done).length, total: list.length };
  };
  const week = tally('week');
  const month = tally('month');
  const points = habits.reduce((sum, h) => sum + pointsOf(h), 0);
  const { level: lvl, inLevel } = level(points);
  const anyPaused = habits.some((h) => isPaused(h, today));

  if (!habits.length) return null;
  return (
    <section className="habit-summary">
      <div className="summary-tiles">
        {week.total > 0 && (
          <div><strong>{week.done} / {week.total}</strong><span>tenues cette semaine</span></div>
        )}
        {month.total > 0 && (
          <div><strong>{month.done} / {month.total}</strong><span>tenues ce mois-ci</span></div>
        )}
        <div className="level">
          <strong>Niveau {lvl}</strong>
          <span className="level-bar"><span style={{ width: `${inLevel}%` }} /></span>
          <span>{points} pts · encore {100 - inLevel} pour le niveau {lvl + 1}</span>
        </div>
      </div>
      <div className="row wrap summary-pause">
        {pausing ? (
          <>
            <span>Tout mettre en pause jusqu’au</span>
            <input className="text-input" type="date" value={until} min={iso(today)} onChange={(e) => setUntil(e.target.value)} aria-label="Jusqu'au" />
            <button
              type="button"
              className="btn primary"
              onClick={() =>
                void pauseHabits(habits.map((h) => h.id), iso(today), until).then(() => {
                  setPausing(false);
                  toast('Toutes les habitudes sont en pause : ces jours ne compteront pas');
                })
              }
            >
              OK
            </button>
            <button type="button" className="btn" onClick={() => setPausing(false)}>Annuler</button>
          </>
        ) : anyPaused ? (
          <button
            type="button"
            className="link-btn"
            onClick={() => void Promise.all(habits.map((h) => resumeHabit(h.id, iso(today), iso(addDays(today, -1))))).then(() => toast('Habitudes reprises'))}
          >
            Reprendre toutes les habitudes
          </button>
        ) : (
          <button type="button" className="link-btn" onClick={() => setPausing(true)}>⏸ Pause vacances / maladie</button>
        )}
      </div>
    </section>
  );
}
