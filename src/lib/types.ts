export type Kind = 'note' | 'label' | 'background';

/** Type d'une carte : l'onglet où elle vit. */
export type Category = 'action' | 'habit' | 'project' | 'resource';
/** État d'une action (carte seule ou élément de liste). « Fait » = case cochée pour un élément. */
export type ActionStatus = 'todo' | 'waiting' | 'someday' | 'done';
export type ProjectStatus = 'active' | 'someday' | 'done';

/** Rythme d'une habitude. */
export type HabitRhythm = 'daily' | 'days' | 'perWeek' | 'weekly' | 'perMonth' | 'monthly' | 'perYear' | 'yearly';

export interface HabitConfig {
  rhythm: HabitRhythm;
  /** « Certains jours » : 0 = lundi … 6 = dimanche. */
  days?: number[];
  /** « X fois par semaine / par mois ». */
  times?: number;
  /** « Chaque mois » : jour du mois conseillé (facultatif). */
  monthDay?: number;
  /** Objectif affiché (ex. « 160 g », « 7 000 pas »). */
  target?: string;
  /** Habitude à éviter : cocher = période tenue. */
  avoid?: boolean;
  moment?: 'morning' | 'day' | 'evening';
  /** Quotidienne : pas le samedi ni le dimanche. */
  noWeekend?: boolean;
}

export type NoteColor =
  // Charte Ject : Papier (default), Soleil, Pêche, Pistache, Lagon, Ciel, Lilas.
  | 'default' | 'sun' | 'peach' | 'pistachio' | 'lagoon' | 'sky' | 'lilac'
  // Anciennes couleurs (Keep), affichées avec la couleur la plus proche.
  | 'coral' | 'sand' | 'mint' | 'sage' | 'fog' | 'storm' | 'dusk' | 'blossom' | 'clay' | 'chalk';

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
  /** Action : priorité 1 (rouge, la plus haute), 2 (orange), 3 (jaune). */
  priority?: 1 | 2 | 3;
  /** Carte « projet ». */
  projectStatus?: ProjectStatus;
  /** Ancienne régularité d'habitude (texte), remplacée par `habit`. */
  frequency?: string;
  /** Réglages d'une habitude. */
  habit?: HabitConfig;
  /** Fois où l'habitude a été faite, par jour (« 2026-10-17 » → 1). */
  habitLog?: Record<string, number>;
  /** Pauses (vacances, maladie) : ces jours ne comptent pas. */
  habitPauses?: { from: string; to: string }[];
  /** Étapes cochées d'une routine pour la période en cours. */
  habitSteps?: { period: string; done: string[] };
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
