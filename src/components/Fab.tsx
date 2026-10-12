import { useEffect, useState } from 'react';
import { CATEGORIES } from '../lib/gtd';
import type { Category } from '../lib/types';
import { Icon, type IconName } from './Icon';

export type FabChoice = 'inbox' | Category;

const CHOICES: { id: FabChoice; label: string; icon: IconName }[] = [
  { id: 'inbox', label: 'Inbox', icon: 'inbox' },
  ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
];

/** Bouton rond « + » : Inbox (capture rapide) ou un type de carte. */
export function Fab({ onPick }: { onPick: (choice: FabChoice) => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const pick = (choice: FabChoice) => {
    setOpen(false);
    onPick(choice);
  };

  return (
    <>
      {open && <div className="fab-backdrop" onClick={() => setOpen(false)} />}
      <div className={`fab-wrap ${open ? 'open' : ''}`}>
        {open && (
          <div className="fab-menu" role="menu">
            {CHOICES.map((c) => (
              <button key={c.id} type="button" role="menuitem" onClick={() => pick(c.id)}>
                <span>{c.label}</span>
                <span className="fab-mini"><Icon name={c.icon} size={22} /></span>
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="fab"
          aria-label={open ? 'Fermer' : 'Ajouter'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? 'close' : 'add'} size={30} />
        </button>
      </div>
    </>
  );
}
