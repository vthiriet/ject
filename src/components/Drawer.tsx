import type { Label } from '../lib/types';
import { Icon } from './Icon';

export type Section = 'inbox' | 'archive' | 'trash';

interface Props {
  open: boolean;
  section: Section;
  labelId: string | null;
  labels: Label[];
  counts: Record<string, number>;
  onNavigate: (section: Section, labelId?: string | null) => void;
  onEditLabels: () => void;
  onSettings: () => void;
  onClose: () => void;
}

/** Menu latéral : inbox, libellés, archives, corbeille, paramètres. */
export function Drawer({ open, section, labelId, labels, counts, onNavigate, onEditLabels, onSettings, onClose }: Props) {
  const item = (active: boolean, icon: React.ReactNode, text: string, onClick: () => void, count?: number, key?: string) => (
    <button key={key} type="button" className={`drawer-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="drawer-icon">{icon}</span>
      <span className="drawer-text">{text}</span>
      {!!count && <span className="drawer-count">{count}</span>}
    </button>
  );
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <nav className={`drawer ${open ? 'open' : ''}`} aria-label="Menu">
        <div className="drawer-brand"><img src="/icons/icon.svg" alt="" width={32} height={32} /> Ject</div>
        {item(section === 'inbox' && !labelId, <Icon name="inbox" />, 'Inbox', () => onNavigate('inbox', null), counts.inbox)}
        <p className="drawer-heading">Libellés</p>
        {labels.map((l) => item(section === 'inbox' && labelId === l.id, <span>{l.emoji}</span>, l.name, () => onNavigate('inbox', l.id), counts[l.id], l.id))}
        {item(false, <Icon name="edit" />, 'Modifier les libellés', onEditLabels)}
        <hr />
        {item(section === 'archive', <Icon name="archive" />, 'Archives', () => onNavigate('archive', null))}
        {item(section === 'trash', <Icon name="trash" />, 'Corbeille', () => onNavigate('trash', null))}
        {item(false, <Icon name="settings" />, 'Paramètres', onSettings)}
      </nav>
    </>
  );
}
