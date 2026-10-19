import { Icon } from './Icon';

/** Bouton + : un appui ouvre directement une carte texte (bascule en liste dans l'éditeur). */
export function Fab({ onNew }: { onNew: () => void }) {
  return (
    <div className="fab-wrap">
      <button type="button" className="fab" aria-label="Nouvelle carte" onClick={onNew}>
        <Icon name="add" size={30} />
      </button>
    </div>
  );
}
