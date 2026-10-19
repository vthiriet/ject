import { useState } from 'react';
import { addDays, isPaused, iso } from '../lib/habits';
import { pauseHabits, resumeHabit } from '../lib/store';
import type { Note } from '../lib/types';
import { toast } from './Toast';

/** En-tête de l'onglet Habitudes : pause générale (vacances, maladie). */
export function HabitSummary({ habits }: { habits: Note[] }) {
  const [pausing, setPausing] = useState(false);
  const today = new Date();
  const [until, setUntil] = useState(iso(addDays(today, 7)));
  const anyPaused = habits.some((h) => isPaused(h, today));

  if (!habits.length) return null;
  return (
    <section className="habit-summary">
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
