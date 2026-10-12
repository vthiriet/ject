export type Kind = 'note' | 'label' | 'background';

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
