import type { CardColor } from './colors';

/**
 * Illustrations de fond (décisions 56, 57) : un emoji en filigrane, sur la couleur de la carte.
 * Valeur enregistrée : `emoji:<emoji>`. Anciennes valeurs, migrées au démarrage :
 * `preset:<id>` (galerie) et `ill:<couleur>:<emoji>` (créée par l'utilisateur).
 */
export interface Illustration {
  emoji: string;
  /** Couleur des anciennes valeurs (`preset:`, `ill:`), reportée une fois sur la carte (décision 57). */
  color?: CardColor;
}

export interface PresetBackground {
  id: string;
  name: string;
  emoji: string;
  color: CardColor;
}

export const PRESET_BACKGROUNDS: PresetBackground[] = [
  { id: 'courses', name: 'Courses', emoji: '🛒', color: 'pistachio' },
  { id: 'recettes', name: 'Recettes', emoji: '🍲', color: 'peach' },
  { id: 'idees', name: 'Idées', emoji: '💡', color: 'sun' },
  { id: 'projets', name: 'Projets', emoji: '🚀', color: 'sky' },
  { id: 'voyage', name: 'Voyage', emoji: '✈️', color: 'lagoon' },
  { id: 'musique', name: 'Musique', emoji: '🎵', color: 'lilac' },
  { id: 'films', name: 'Films', emoji: '🎬', color: 'peach' },
  { id: 'lecture', name: 'Lecture', emoji: '📚', color: 'sun' },
  { id: 'fete', name: 'Fête', emoji: '🎉', color: 'lilac' },
  { id: 'nature', name: 'Nature', emoji: '🌿', color: 'pistachio' },
];

export function findPreset(id: string) {
  return PRESET_BACKGROUNDS.find((p) => p.id === id);
}

/** Une illustration n'est plus qu'un emoji : la couleur est celle de la carte (décision 57). */
export const illustrationValue = (emoji: string) => `emoji:${emoji}`;

/** Illustration d'une valeur enregistrée (galerie ou création), ou null pour une image importée. */
export function illustrationOf(value: string | null): Illustration | null {
  if (!value) return null;
  if (value.startsWith('emoji:')) return value.length > 6 ? { emoji: value.slice(6) } : null;
  // Anciennes valeurs, converties au démarrage par migrateIllustrations().
  if (value.startsWith('preset:')) return findPreset(value.slice(7)) ?? null;
  if (value.startsWith('ill:')) {
    const [, color, ...rest] = value.split(':');
    const emoji = rest.join(':');
    return emoji ? { color: color as CardColor, emoji } : null;
  }
  return null;
}
