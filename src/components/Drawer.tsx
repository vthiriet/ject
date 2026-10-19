import type { SyncStatus } from '../lib/sync';
import type { Category, Label } from '../lib/types';
import { Icon } from './Icon';
import { Logo } from './Logo';

export type Section = 'inbox' | Category | 'archive' | 'trash';

const SYNC_TEXT: Record<SyncStatus, string> = {
  local: 'Cartes sur cet appareil uniquement',
  syncing: 'Synchronisation…',
  synced: 'Synchronisé',
  offline: 'Hors ligne',
  error: 'Synchronisation en échec',
};

interface Props {
  open: boolean;
  section: Section;
  labelId: string | null;
  labels: Label[];
  counts: Record<string, number>;
  layout: 'grid' | 'list';
  onToggleLayout: () => void;
  syncStatus: SyncStatus;
  onNavigate: (section: Section, labelId?: string | null) => void;
  onEditLabels: () => void;
  onSettings: () => void;
  onClose: () => void;
}

/** Tiroir : Archives, Corbeille, Aires, Réglages, affichage et état de la synchro (les onglets sont en bas). */
export function Drawer(props: Props) {
  const { open, section, labelId, labels, counts, layout, onToggleLayout, syncStatus, onNavigate, onEditLabels, onSettings, onClose } = props;
  const item = (active: boolean, icon: React.ReactNode, text: string, onClick: () => void, count?: number, key?: string) => (
    <button key={key} type="button" className={`drawer-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="drawer-icon">{icon}</span>
      <span className="drawer-text">{text}</span>
      {!!count && <span className="drawer-count">{count}</span>}
    </button>
  );
  const isCategory = section !== 'inbox' && section !== 'archive' && section !== 'trash';
  // Une aire filtre l'onglet en cours (ou les Actions depuis l'Inbox).
  const aireTarget: Section = isCategory || section === 'archive' ? section : 'action';
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <nav className={`drawer ${open ? 'open' : ''}`} aria-label="Menu">
        <div className="drawer-brand"><Logo /></div>
        {item(section === 'archive', <Icon name="archive" fill={section === 'archive'} />, 'Archives', () => onNavigate('archive', null))}
        {item(section === 'trash', <Icon name="trash" fill={section === 'trash'} />, 'Corbeille', () => onNavigate('trash', null))}
        <p className="drawer-heading">Aires</p>
        {labels.map((l) => item(labelId === l.id, <span className="drawer-emoji">{l.emoji}</span>, l.name, () => onNavigate(aireTarget, l.id), counts[l.id], l.id))}
        {item(false, <Icon name="edit" />, 'Modifier les aires', onEditLabels)}
        <hr />
        {item(false, <Icon name="settings" />, 'Réglages', onSettings)}
        {item(false, <Icon name={layout === 'grid' ? 'list' : 'grid'} />, layout === 'grid' ? 'Afficher en liste' : 'Afficher en grille', onToggleLayout)}
        <button type="button" className={`drawer-item sync-line ${syncStatus}`} onClick={onSettings}>
          <span className="drawer-icon"><Icon name="cloud" /></span>
          <span className="drawer-text">{SYNC_TEXT[syncStatus]}</span>
          <span className="dot" aria-hidden="true" />
        </button>
      </nav>
    </>
  );
}
