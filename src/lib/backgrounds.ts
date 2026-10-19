import type { CardColor } from './colors';

/**
 * Illustrations de fond (décisions 16, 17, 23) : un aplat d'une des 7 couleurs de cartes et
 * un grand emoji incliné qui déborde du bord. Pas d'image importée.
 * Valeurs enregistrées : `preset:<id>` (galerie) ou `ill:<couleur>:<emoji>` (créée par l'utilisateur).
 */
export interface Illustration {
  emoji: string;
  color: CardColor;
}

export interface PresetBackground extends Illustration {
  id: string;
  name: string;
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

export const illustrationValue = (i: Illustration) => `ill:${i.color}:${i.emoji}`;

/** Illustration d'une valeur enregistrée (galerie ou création), ou null pour une image importée. */
export function illustrationOf(value: string | null): Illustration | null {
  if (!value) return null;
  if (value.startsWith('preset:')) return findPreset(value.slice(7)) ?? null;
  if (value.startsWith('ill:')) {
    const [, color, ...rest] = value.split(':');
    const emoji = rest.join(':');
    return emoji ? { color: color as CardColor, emoji } : null;
  }
  return null;
}
