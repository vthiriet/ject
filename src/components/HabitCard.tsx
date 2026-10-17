import { useState } from 'react';
import { encouragement, habitConfig, iso, isPaused, MOMENT_LABEL, periodKey, POINTS, progress, rhythmLabel } from '../lib/habits';
import { logHabit, toggleHabitStep } from '../lib/store';
import type { Note } from '../lib/types';
import { Icon } from './Icon';
import { LinkedText } from './LinkedText';
import { toast } from './Toast';

interface Props {
  note: Note;
  onOpen: () => void;
  /** Appelé après une fois faite (pour fêter un éventuel passage de niveau). */
  onDone: (points: number) => void;
}

/** Carte d'habitude : rappel du jour, ou progression de la semaine / du mois avec bouton « fait ». */
export function HabitCard({ note, onOpen, onDone }: Props) {
  const [burst, setBurst] = useState(0);
  const today = new Date();
  const day = iso(today);
  const c = habitConfig(note);
  const p = progress(note, today);
  const paused = isPaused(note, today);
  const steps = note.type === 'list' ? note.items.filter((i) => i.text.trim()) : [];
  const period = periodKey(p.scale, today);
  const stepsDone = note.habitSteps?.period === period ? note.habitSteps.done : [];
  const text = note.title.trim() || (note.type === 'text' ? note.content.trim() : '') || 'Habitude sans titre';
  const points = POINTS[p.scale];

  const celebrate = () => {
    setBurst(Date.now());
    if (points) onDone(points);
  };

  const check = async () => {
    if (p.scale === 'day') {
      // Quotidien : simple case « fait aujourd'hui », sans pression.
      await logHabit(note.id, day, p.count > 0 ? -1 : 1);
      if (!p.count) setBurst(Date.now());
      return;
    }
    await logHabit(note.id, day, 1);
    celebrate();
    toast(c.avoid ? 'Période tenue, bravo !' : `+1 ${p.scale === 'week' ? 'cette semaine' : 'ce mois-ci'}`, {
      label: 'Annuler',
      run: () => void logHabit(note.id, day, -1),
    });
  };

  const toggleStep = async (itemId: string) => {
    const completed = await toggleHabitStep(note.id, itemId, period, day);
    if (completed) {
      if (p.scale === 'day') setBurst(Date.now());
      else celebrate();
      toast('Routine terminée 🎉');
    }
  };

  const meta = [rhythmLabel(c), c.moment ? MOMENT_LABEL[c.moment] : '', c.target ? `Objectif : ${c.target}` : ''].filter(Boolean);
  const pct = Math.min(100, Math.round((p.count / p.goal) * 100));

  return (
    <article className={`habit-card ${p.done ? 'done' : ''} ${paused ? 'paused' : ''}`} data-color={note.color}>
      <div className="habit-main" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
        <h3 className="habit-title">
          {c.avoid && <span className="avoid-badge">À éviter</span>}
          <LinkedText text={text} />
        </h3>
        <p className="habit-meta">{meta.join(' · ')}</p>
        {paused ? (
          <p className="habit-msg">⏸ En pause</p>
        ) : p.scale !== 'day' ? (
          <>
            <div className="habit-bar" aria-label={`${p.count} sur ${p.goal}`}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <p className="habit-msg">
              <strong>{Math.min(p.count, p.goal)} / {p.goal}</strong> · {encouragement(note, p)}
            </p>
          </>
        ) : null}
        {steps.length > 0 && !paused && (
          <ul className="habit-steps" onClick={(e) => e.stopPropagation()}>
            {steps.map((s) => {
              const checked = stepsDone.includes(s.id);
              return (
                <li key={s.id}>
                  <button type="button" className={checked ? 'on' : ''} onClick={() => void toggleStep(s.id)}>
                    <Icon name={checked ? 'checked' : 'unchecked'} size={20} /> <span>{s.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {!paused && steps.length === 0 && (
        <button
          type="button"
          className={`habit-check ${p.scale === 'day' && p.count > 0 ? 'on' : ''}`}
          aria-label={p.scale === 'day' ? (p.count > 0 ? 'Décocher' : "Fait aujourd'hui") : c.avoid ? 'Période tenue' : 'Fait (+1)'}
          onClick={() => void check()}
        >
          <Icon name={p.scale === 'day' ? (p.count > 0 ? 'checked' : 'unchecked') : 'check'} size={26} />
          {p.scale !== 'day' && <small>+1</small>}
        </button>
      )}
      {burst > 0 && (
        <span key={burst} className="habit-burst" aria-hidden="true">
          {points && p.scale !== 'day' ? `+${points} pts` : '✓'} <span>✨</span><span>🎉</span><span>✨</span>
        </span>
      )}
    </article>
  );
}
