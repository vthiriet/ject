import { DAY_NAMES } from '../lib/habits';
import type { HabitConfig, HabitRhythm } from '../lib/types';
import { Segmented } from './Segmented';

const RHYTHMS: [HabitRhythm, string][] = [
  ['daily', 'Chaque jour'],
  ['days', 'Certains jours'],
  ['perWeek', 'X fois par semaine'],
  ['weekly', 'Chaque semaine'],
  ['perMonth', 'X fois par mois'],
  ['monthly', 'Chaque mois'],
  ['perYear', 'X fois par an'],
  ['yearly', 'Chaque année'],
];

/** Réglages d'une habitude : rythme, objectif, sens, moment. */
export function HabitConfigForm({ value, onChange }: { value: HabitConfig; onChange: (c: HabitConfig) => void }) {
  const set = (patch: Partial<HabitConfig>) => onChange({ ...value, ...patch });
  const days = value.days ?? [];
  return (
    <div className="habit-form">
      <label className="field">
        <span>Rythme</span>
        <select className="text-input" value={value.rhythm} onChange={(e) => set({ rhythm: e.target.value as HabitRhythm })}>
          {RHYTHMS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>

      {(value.rhythm === 'perWeek' || value.rhythm === 'perMonth' || value.rhythm === 'perYear') && (
        <label className="field">
          <span>Nombre de fois</span>
          <input
            className="text-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={value.rhythm === 'perWeek' ? 7 : value.rhythm === 'perMonth' ? 31 : 365}
            value={value.times ?? 1}
            onChange={(e) => set({ times: Math.max(1, Number(e.target.value) || 1) })}
          />
        </label>
      )}

      {value.rhythm === 'days' && (
        <div className="day-chips" role="group" aria-label="Jours">
          {DAY_NAMES.map((d, i) => (
            <button
              key={d}
              type="button"
              className={`chip ${days.includes(i) ? 'on' : ''}`}
              onClick={() => set({ days: days.includes(i) ? days.filter((x) => x !== i) : [...days, i] })}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {value.rhythm === 'monthly' && (
        <label className="field">
          <span>Jour du mois (facultatif)</span>
          <input
            className="text-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={value.monthDay ?? ''}
            onChange={(e) => set({ monthDay: e.target.value ? Math.min(31, Math.max(1, Number(e.target.value))) : undefined })}
          />
        </label>
      )}

      <label className="field">
        <span>Objectif (facultatif)</span>
        <input className="text-input" value={value.target ?? ''} placeholder="ex. 160 g, 7 000 pas, 30 min" onChange={(e) => set({ target: e.target.value || undefined })} />
      </label>

      <span className="field-label">Moment (facultatif)</span>
      <Segmented
        value={value.moment ?? 'none'}
        options={[['none', 'Aucun'], ['morning', 'Matin'], ['day', 'Journée'], ['evening', 'Soir']]}
        onChange={(v) => set({ moment: v === 'none' ? undefined : (v as HabitConfig['moment']) })}
      />

      <label className="switch-row">
        <input type="checkbox" checked={!!value.avoid} onChange={(e) => set({ avoid: e.target.checked || undefined })} />
        À éviter (cocher = période tenue)
      </label>
      {value.rhythm === 'daily' && (
        <label className="switch-row">
          <input type="checkbox" checked={!!value.noWeekend} onChange={(e) => set({ noWeekend: e.target.checked || undefined })} />
          Pas le week-end
        </label>
      )}
    </div>
  );
}
