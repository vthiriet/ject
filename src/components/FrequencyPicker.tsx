import { useState } from 'react';
import { FREQUENCIES } from '../lib/gtd';

/** Régularité d'une habitude : un choix courant, ou un texte libre (« Autre… »). */
export function FrequencyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const known = !value || FREQUENCIES.some(([id]) => id === value);
  const [custom, setCustom] = useState(!known);
  return (
    <div className="frequency">
      <span aria-hidden="true">🔁</span>
      <select
        className="text-input"
        aria-label="Régularité"
        value={custom ? '__custom' : value}
        onChange={(e) => {
          if (e.target.value === '__custom') {
            setCustom(true);
            onChange('');
          } else {
            setCustom(false);
            onChange(e.target.value);
          }
        }}
      >
        <option value="">Régularité…</option>
        {FREQUENCIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        <option value="__custom">Autre…</option>
      </select>
      {custom && (
        <input
          className="text-input"
          value={value}
          placeholder="ex. le week-end"
          aria-label="Régularité personnalisée"
          autoFocus
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
