import type { NoteColor } from './types';

/** Palette inspirée de Google Keep : [nom, couleur claire, couleur sombre]. */
export const NOTE_COLORS: Record<NoteColor, [string, string, string]> = {
  default: ['Par défaut', 'transparent', 'transparent'],
  coral: ['Corail', '#faafa8', '#77172e'],
  peach: ['Pêche', '#f39f76', '#692b17'],
  sand: ['Sable', '#fff8b8', '#7c4a03'],
  mint: ['Menthe', '#e2f6d3', '#264d3b'],
  sage: ['Sauge', '#b4ddd3', '#0c625d'],
  fog: ['Brume', '#d4e4ed', '#256377'],
  storm: ['Orage', '#aeccdc', '#284255'],
  dusk: ['Crépuscule', '#d3bfdb', '#472e5b'],
  blossom: ['Fleur', '#f6e2dd', '#6c394f'],
  clay: ['Argile', '#e9e3d4', '#4b443a'],
  chalk: ['Craie', '#efeff1', '#232427'],
};

export const COLOR_IDS = Object.keys(NOTE_COLORS) as NoteColor[];
