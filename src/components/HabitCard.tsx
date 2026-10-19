import { StarIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { encouragement, habitConfig, iso, isPaused, MOMENT_LABEL, periodKey, progress, rhythmLabel, type Scale } from '../lib/habits';
import { logHabit, toggleHabitStep } from '../lib/store';
import type { Note } from '../lib/types';
import { CheckBox, Icon } from './Icon';
import { LinkedText } from './LinkedText';
import { toast } from './Toast';

interface Props {
  note: Note;
  onOpen: () => void;
}

const PERIOD: Record<Scale, string> = { day: "aujourd'hui", week: 'cette semaine', month: 'ce mois-ci', year: 'cette année' };
/** Au-delà, une barre de progression remplace les étoiles (décision 52). */
const MAX_STARS = 7;

/**
 * Carte d'habitude (décisions 28, 52, 53) : rond à cocher pour une habitude quotidienne,
 * bouton « + » puis étoile pour une habitude comptée, une étoile par fois prévue.
 * Corriger une erreur : « Annuler » dans la notification, ou « Retirer » dans la fiche.
 */
export function HabitCard({ note, onOpen }: Props) {
  // Rebond de l'étoile au moment où l'habitude est faite.
  const [pop, setPop] = useState(0);
  const today = new Date();
  const day = iso(today);
  const c = habitConfig(note);
  const p = progress(note, today);
  const paused = isPaused(note, today);
  const steps = note.type === 'list' ? note.items.filter((i) => i.text.trim()) : [];
  const period = periodKey(p.scale, today);
  const stepsDone = note.habitSteps?.period === period ? note.habitSteps.done : [];
  const text = note.title.trim() || (note.type === 'text' ? note.content.trim() : '') || 'Habitude sans titre';

  const check = async () => {
    if (p.scale === 'day') {
      // Quotidien : toucher le rond coche, toucher l'étoile décoche.
      await logHabit(note.id, day, p.count > 0 ? -1 : 1);
      if (!p.count) setPop(Date.now());
      return;
    }
    await logHabit(note.id, day, 1);
    setPop(Date.now());
    toast(c.avoid ? 'Période tenue, bravo !' : `+1 ${PERIOD[p.scale]}`, {
      label: 'Annuler',
      run: () => void logHabit(note.id, day, -1),
    });
  };

  const toggleStep = async (itemId: string) => {
    const completed = await toggleHabitStep(note.id, itemId, period, day);
    if (completed) {
      setPop(Date.now());
      toast('Routine terminée');
    }
  };

  const meta = [rhythmLabel(c), c.moment ? MOMENT_LABEL[c.moment] : '', c.target ? `Objectif : ${c.target}` : ''].filter(Boolean);
  const done = p.done;
  const star = <span key={pop} className={`habit-star ${pop ? 'pop' : ''}`}><StarIcon size={22} weight="fill" /></span>;

  return (
    <article className={`habit-card ${done ? 'done' : ''} ${paused ? 'paused' : ''}`} data-color={note.color}>
      <div className="habit-main" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
        <h3 className="habit-title">
          {c.avoid && <span className="avoid-badge">À éviter</span>}
          <LinkedText text={text} />
        </h3>
        <p className="habit-meta">{meta.join(' · ')}</p>
        {paused ? (
          <p className="habit-msg"><Icon name="pause" size={14} /> En pause</p>
        ) : p.scale !== 'day' ? (
          <>
            {p.goal <= MAX_STARS ? (
              <div className="habit-stars" role="img" aria-label={`${Math.min(p.count, p.goal)} sur ${p.goal}`}>
                {Array.from({ length: p.goal }, (_, i) => (
                  <StarIcon key={i} size={22} weight={i < p.count ? 'fill' : 'regular'} className={i < p.count ? 'on' : ''} />
                ))}
              </div>
            ) : (
              <div className="habit-bar" aria-label={`${p.count} sur ${p.goal}`}>
                <span style={{ width: `${Math.min(100, Math.round((p.count / p.goal) * 100))}%` }} />
              </div>
            )}
            <p className="habit-msg">
              <strong>{p.count} / {p.goal}</strong> · {encouragement(note, p)}
            </p>
          </>
        ) : null}
        {steps.length > 0 && !paused && (
          <ul className="habit-steps" onClick={(e) => e.stopPropagation()}>
            {steps.map((s) => {
              const checked = stepsDone.includes(s.id);
              return (
                <li key={s.id}>
                  <button type="button" className={checked ? 'on' : ''} aria-pressed={checked} onClick={() => void toggleStep(s.id)}>
                    <CheckBox checked={checked} /> <span>{s.text}</span>
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
          className={`habit-round ${done ? 'on' : ''}`}
          aria-label={
            p.scale === 'day' ? (done ? 'Décocher' : "Fait aujourd'hui")
            : done ? `Objectif atteint ${PERIOD[p.scale]} (ajouter une fois)` : c.avoid ? 'Période tenue' : 'Ajouter une fois'
          }
          onClick={() => void check()}
        >
          {done ? star : p.scale !== 'day' && <Icon name="add" size={22} />}
        </button>
      )}
      {!paused && steps.length > 0 && done && <span className="habit-round on" aria-label="Routine faite">{star}</span>}
    </article>
  );
}
