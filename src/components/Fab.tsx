import { useEffect, useState } from 'react';
import { useBackClose } from '../lib/history';
import { Icon } from './Icon';

/** Bouton rond « + » (comme Google Keep) : on choisit Texte ou Liste. */
export function Fab({ onPick }: { onPick: (type: 'text' | 'list') => void }) {
  const [open, setOpen] = useState(false);
  useBackClose(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const pick = (type: 'text' | 'list') => {
    setOpen(false);
    onPick(type);
  };

  return (
    <>
      {open && <div className="fab-backdrop" onClick={() => setOpen(false)} />}
      <div className={`fab-wrap ${open ? 'open' : ''}`}>
        {open && (
          <div className="fab-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => pick('text')}>
              <span>Texte</span>
              <span className="fab-mini"><Icon name="notes" size={22} /></span>
            </button>
            <button type="button" role="menuitem" onClick={() => pick('list')}>
              <span>Liste</span>
              <span className="fab-mini"><Icon name="checked" size={22} /></span>
            </button>
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
