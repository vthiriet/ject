import { useEffect, type ReactNode } from 'react';
import { IconButton } from './Icon';

/** Fenêtre par-dessus l'app : plein écran sur téléphone, centrée sur ordinateur. */
export function Dialog({
  title, onClose, children, footer, className = '',
}: { title?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; className?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`dialog ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        {title && (
          <header className="dialog-head">
            <h2>{title}</h2>
            <IconButton name="close" label="Fermer" onClick={onClose} />
          </header>
        )}
        <div className="dialog-body">{children}</div>
        {footer && <footer className="dialog-foot">{footer}</footer>}
      </div>
    </div>
  );
}
