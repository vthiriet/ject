export type Kind = 'note' | 'label' | 'background';

/** Type d'une carte : l'onglet où elle vit. */
export type Category = 'action' | 'habit' | 'project' | 'resource';
/** État d'une action (carte seule ou élément de liste). « Fait » = case cochée pour un élément. */
export type ActionStatus = 'todo' | 'waiting' | 'someday' | 'done';
export type ProjectStatus = 'active' | 'someday' | 'done';

export type NoteColor =
  | 'default' | 'coral' | 'peach' | 'sand' | 'mint' | 'sage'
  | 'fog' | 'storm' | 'dusk' | 'blossom' | 'clay' | 'chalk';

export interface NotionMention {
  at: number;
  pageTitle: string;
  pageUrl?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  /** Renseigné quand l'élément a été envoyé vers Notion. */
  exported?: NotionMention;
  /** Actions et étapes de projet : en attente ou un jour (sinon à faire / fait selon la case). */
  status?: 'waiting' | 'someday';
  waitingFor?: string;
  /** Habitudes : régularité (voir lib/gtd.ts). */
  frequency?: string;
}

export interface Note {
  id: string;
  type: 'text' | 'list';
  title: string;
  content: string;
  items: ChecklistItem[];
  color: NoteColor;
  /** `preset:<id>` (galerie intégrée), `img:<id>` (image importée) ou null. */
  background: string | null;
  pinned: boolean;
  archived: boolean;
  trashedAt: number | null;
  /** Plus grand = plus haut dans la liste. */
  position: number;
  labelIds: string[];
  /** Renseigné quand la note entière a été envoyée vers Notion. */
  exported?: NotionMention;
  /** Élément brut de l'onglet Inbox, en attente d'être rangé. */
  inbox?: boolean;
  /** Type de la carte (onglet). Absent = Ressource. Dans l'Inbox : type pressenti. */
  category?: Category;
  /** Carte « action » seule. */
  status?: ActionStatus;
  waitingFor?: string;
  /** Carte « projet ». */
  projectStatus?: ProjectStatus;
  /** Carte « habitude » seule. */
  frequency?: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface Label {
  id: string;
  name: string;
  emoji: string;
  position: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface BackgroundImage {
  id: string;
  dataUrl: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  fetchedAt: number;
  failed?: boolean;
}
