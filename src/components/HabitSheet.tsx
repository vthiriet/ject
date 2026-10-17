import { useState } from 'react';
import {
  addDays, currentPause, encouragement, habitConfig, history, iso, MOMENT_LABEL, parse, periodRange,
  pointsOf, progress, rhythmLabel, successRate,
} from '../lib/habits';
import { logHabit, pauseHabits, restoreNote, resumeHabit, trashNote } from '../lib/store';
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

const SCALE_WORD = { day: 'jours', week: 'semaines', month: 'mois' } as const;

/** Fiche détaillée : avancement, réussite, historique, rattrapage et pause. */
export function HabitSheet({ note, onClose, onEdit }: Props) {
  const today = new Date();
  const todayIso = iso(today);
  const c = habitConfig(note);
  const p = progress(note, today);
  const rate = successRate(note, today);
  const hist = history(note, p.scale === 'day' ? 14 : p.scale === 'week' ? 8 : 6, today);
  const max = Math.max(1, ...hist.map((h) => Math.max(h.count, h.goal)));
  const [from] = periodRange(p.scale, today);
  const [catchUp, setCatchUp] = useState(iso(addDays(today, -1)) >= iso(from) ? iso(addDays(today, -1)) : todayIso);
  const [pauseUntil, setPauseUntil] = useState(iso(addDays(today, 7)));
  const pause = currentPause(note, today);

  // Jours cochés dans la période en cours (pour corriger un oubli ou une erreur).
  const logged = Object.entries(note.habitLog ?? {})
    .filter(([d]) => d >= iso(from) && d <= todayIso)
    .sort(([a], [b]) => (a < b ? 1 : -1));

  const remove = () => {
    void trashNote(note.id);
    toast('Habitude placée dans la corbeille', { label: 'Annuler', run: () => void restoreNote(note.id) });
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
            <span>{p.scale === 'week' ? 'cette semaine' : 'ce mois-ci'}</span>
          </div>
        )}
        {rate && (
          <div>
            <strong>{rate.rate} %</strong>
            <span>réussite sur {rate.periods} {rate.periods > 1 ? SCALE_WORD[rate.scale] : rate.scale === 'week' ? 'semaine' : 'mois'}</span>
          </div>
        )}
        {p.scale !== 'day' && (
          <div>
            <strong>{pointsOf(note)}</strong>
            <span>points gagnés</span>
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

      <p className="section-label">Rattraper un oubli</p>
      <div className="row">
        <input
          className="text-input"
          type="date"
          value={catchUp}
          min={iso(from)}
          max={todayIso}
          onChange={(e) => setCatchUp(e.target.value)}
          aria-label="Jour"
        />
        <button type="button" className="btn" onClick={() => catchUp && void logHabit(note.id, catchUp, 1).then(() => toast(`Ajouté pour le ${formatDate(parse(catchUp).getTime())}`))}>
          <Icon name="add" size={18} /> Fait ce jour-là
        </button>
      </div>
      {logged.length > 0 && (
        <ul className="logged-days">
          {logged.map(([d, n]) => (
            <li key={d}>
              <span>{formatDate(parse(d).getTime())}{n > 1 ? ` · ${n} fois` : ''}</span>
              <button type="button" className="link-btn" onClick={() => void logHabit(note.id, d, -1)}>Retirer</button>
            </li>
          ))}
        </ul>
      )}

      <p className="section-label">Pause (vacances, maladie)</p>
      {pause ? (
        <div className="row wrap">
          <span>⏸ En pause jusqu’au {formatDate(parse(pause.to).getTime())}</span>
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
        <button type="button" className="btn" onClick={remove}><Icon name="trash" size={18} /> Supprimer</button>
      </div>
    </Dialog>
  );
}
