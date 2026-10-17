import type { ActionStatus, Category, Note, ProjectStatus } from './types';
import type { IconName } from '../components/Icon';

/** Les quatre types de cartes, dans l'ordre des onglets. */
export const CATEGORIES: { id: Category; label: string; plural: string; icon: IconName }[] = [
  { id: 'action', label: 'Action', plural: 'Actions', icon: 'task' },
  { id: 'habit', label: 'Habitude', plural: 'Habitudes', icon: 'repeat' },
  { id: 'project', label: 'Projet', plural: 'Projets', icon: 'flag' },
  { id: 'resource', label: 'Ressource', plural: 'Ressources', icon: 'bookmark' },
];

export const categoryOf = (n: Note): Category => n.category ?? 'resource';
export const categoryMeta = (c: Category) => CATEGORIES.find((x) => x.id === c)!;

export const ACTION_STATUS: Record<ActionStatus, string> = {
  todo: 'À faire',
  waiting: 'En attente',
  someday: 'Un jour',
  done: 'Fait',
};

export const PROJECT_STATUS: Record<ProjectStatus, string> = {
  active: 'Actif',
  someday: 'Un jour',
  done: 'Terminé',
};
