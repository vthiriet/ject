import { useState } from 'react';
import {
  addDays, currentPause, encouragement, habitConfig, history, iso, MOMENT_LABEL, parse,
  progress, rhythmLabel, successRate,
} from '../lib/habits';
import { logHabit, pauseHabits, resumeHabit, updateNote } from '../lib/store';
import { formatDate } from '../lib/text';
import type { Note } from '../lib/types';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { toast } from './Toast';

interface Props {
  note: Note;
  onClose: () => void;
  onEdit: () => void;
}

const SCALE_WORD = { day: 'jours', week: 'semaines', month: 'mois', year: 'ans' } as const;
const ONE_WORD = { day: 'jour', week: 'semaine', month: 'mois', year: 'an' } as const;
const PERIOD = { day: "aujourd'hui", week: 'cette semaine', month: 'ce mois-ci', year: 'cette année' } as const;

/** Fiche détaillée : avancement, réussite, historique, rattrapage et pause. */
export function HabitSheet({ note, onClose, onEdit }: Props) {
  const today = new Date();
  const todayIso = iso(today);
  const c = habitConfig(note);
  const p = progress(note, today);
  const rate = successRate(note, today);
  const hist = history(note, p.scale === 'day' ? 14 : p.scale === 'week' ? 8 : p.scale === 'year' ? 4 : 6, today);
  const max = Math.max(1, ...hist.map((h) => Math.max(h.count, h.goal)));
  // Jour à corriger : n'importe quel jour passé (oubli ou erreur, même longtemps après).
  const [day, setDay] = useState(todayIso);
  const [showAll, setShowAll] = useState(false);
  const [pauseUntil, setPauseUntil] = useState(iso(addDays(today, 7)));
  const pause = currentPause(note, today);

  // Tous les jours cochés, du plus récent au plus ancien.
  const logged = Object.entries(note.habitLog ?? {})
    .filter(([d]) => d <= todayIso)
    .sort(([a], [b]) => (a < b ? 1 : -1));
  const shown = showAll ? logged : logged.slice(0, 7);
  const dayCount = note.habitLog?.[day] ?? 0;

  const remove = () => {
    void updateNote(note.id, { archived: true, pinned: false });
    toast('Habitude archivée', { label: 'Annuler', run: () => void updateNote(note.id, { archived: false }) });
    onClose();
  };

  return (
    <Dialog title={note.title.trim() || note.content.trim() || 'Habitude'} onClose={onClose} className="habit-sheet">
      <p className="habit-meta">
        {[c.avoid ? 'À éviter' : '', rhythmLabel(c), c.moment ? MOMENT_LABEL[c.moment] : '', c.target ? `Objectif : ${c.target}` : '']
          .filter(Boolean)
          .join(' · ')}
      </p>

      <div className="sheet-stats">
        {p.scale !== 'day' && (
          <div>
            <strong>{Math.min(p.count, p.goal)} / {p.goal}</strong>
            <span>{PERIOD[p.scale]}</span>
          </div>
        )}
        {rate && (
          <div>
            <strong>{rate.rate} %</strong>
            <span>réussite sur {rate.periods} {rate.periods > 1 ? SCALE_WORD[rate.scale] : ONE_WORD[rate.scale]}</span>
          </div>
        )}
      </div>
      {p.scale !== 'day' && <p className="habit-msg">{encouragement(note, p)}</p>}

      <p className="section-label">Historique</p>
      <div className="history" role="img" aria-label="Historique">
        {hist.map((h, i) => (
          <div key={i} className={`history-col ${h.count >= h.goal ? 'ok' : ''} ${h.paused ? 'paused' : ''}`}>
            <span className="history-bar" style={{ height: `${(Math.min(h.count, max) / max) * 100}%` }} />
            {h.goal > 1 && <span className="history-goal" style={{ bottom: `${(h.goal / max) * 100}%` }} />}
            <small>{h.label}</small>
          </div>
        ))}
      </div>

      <p className="section-label">Corriger un jour</p>
      <div className="row day-fix">
        <input
          className="text-input"
          type="date"
          value={day}
          max={todayIso}
          onChange={(e) => e.target.value && setDay(e.target.value)}
          aria-label="Jour à corriger"
        />
        <div className="stepper" role="group" aria-label={`Fois faites le ${formatDate(parse(day).getTime())}`}>
          <button type="button" className="btn" aria-label="Retirer une fois" disabled={!dayCount} onClick={() => void logHabit(note.id, day, -1)}>−</button>
          <span aria-live="polite">{dayCount} fois</span>
          <button type="button" className="btn" aria-label="Ajouter une fois" onClick={() => void logHabit(note.id, day, 1)}>+</button>
        </div>
      </div>

      {logged.length > 0 && (
        <>
          <p className="section-label">Jours cochés</p>
          <ul className="logged-days">
            {shown.map(([d, n]) => (
              <li key={d}>
                <button type="button" className="logged-day" onClick={() => setDay(d)}>
                  {formatDate(parse(d).getTime())}{n > 1 ? ` · ${n} fois` : ''}
                </button>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    void logHabit(note.id, d, -1);
                    toast(`Une fois retirée le ${formatDate(parse(d).getTime())}`, { label: 'Annuler', run: () => void logHabit(note.id, d, 1) });
                  }}
                >
                  Retirer une fois
                </button>
              </li>
            ))}
          </ul>
          {logged.length > shown.length && (
            <button type="button" className="link-btn" onClick={() => setShowAll(true)}>
              Voir les {logged.length - shown.length} autres jours
            </button>
          )}
        </>
      )}

      <p className="section-label">Pause (vacances, maladie)</p>
      {pause ? (
        <div className="row wrap">
          <span className="row"><Icon name="pause" size={16} /> En pause jusqu’au {formatDate(parse(pause.to).getTime())}</span>
          <button type="button" className="btn" onClick={() => void resumeHabit(note.id, todayIso, iso(addDays(today, -1)))}>Reprendre</button>
        </div>
      ) : (
        <div className="row">
          <input className="text-input" type="date" value={pauseUntil} min={todayIso} onChange={(e) => setPauseUntil(e.target.value)} aria-label="Jusqu'au" />
          <button type="button" className="btn" onClick={() => pauseUntil && void pauseHabits([note.id], todayIso, pauseUntil).then(() => toast('Habitude en pause : ces jours ne compteront pas'))}>
            Mettre en pause
          </button>
        </div>
      )}

      <div className="row wrap sheet-actions">
        <button type="button" className="btn primary" onClick={onEdit}><Icon name="edit" size={18} /> Modifier</button>
        <button type="button" className="btn" onClick={remove}><Icon name="archive" size={18} /> Archiver</button>
      </div>
    </Dialog>
  );
}
