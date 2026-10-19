import type { NoteColor } from './types';

/** Les 7 couleurs de cartes de la charte : [nom, couleur claire, couleur sombre]. */
export const NOTE_COLORS = {
  default: ['Papier', '#FFFFFF', '#332C28'],
  sun: ['Soleil', '#FFE27A', '#4A3D12'],
  peach: ['Pêche', '#FFC9B8', '#4E2A22'],
  pistachio: ['Pistache', '#D2EC8F', '#33421A'],
  lagoon: ['Lagon', '#A5E6DC', '#163F3A'],
  sky: ['Ciel', '#BDD6FF', '#1F3152'],
  lilac: ['Lilas', '#DCC8FF', '#352A52'],
} as const satisfies Partial<Record<NoteColor, readonly [string, string, string]>>;

export type CardColor = keyof typeof NOTE_COLORS;
export const COLOR_IDS = Object.keys(NOTE_COLORS) as CardColor[];

/** Anciennes couleurs (Keep) → couleur la plus proche de la charte. */
const LEGACY: Partial<Record<NoteColor, CardColor>> = {
  coral: 'peach', sand: 'sun', mint: 'pistachio', sage: 'lagoon', fog: 'sky', storm: 'sky',
  dusk: 'lilac', blossom: 'peach', clay: 'default', chalk: 'default',
};

export const cardColor = (c: NoteColor): CardColor => (c in NOTE_COLORS ? (c as CardColor) : LEGACY[c] ?? 'default');
