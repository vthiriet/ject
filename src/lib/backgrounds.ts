/** Galerie intégrée d'illustrations de fond (sans fichier image). */
export interface PresetBackground {
  id: string;
  name: string;
  emoji: string;
  light: string;
  dark: string;
}

export const PRESET_BACKGROUNDS: PresetBackground[] = [
  { id: 'courses', name: 'Courses', emoji: '🛒', light: 'linear-gradient(135deg,#d9f2d0,#a8dba8)', dark: 'linear-gradient(135deg,#1f3b2a,#2e5a3c)' },
  { id: 'recettes', name: 'Recettes', emoji: '🍲', light: 'linear-gradient(135deg,#ffe3c2,#f7b98b)', dark: 'linear-gradient(135deg,#4a2a14,#6b3b1c)' },
  { id: 'idees', name: 'Idées', emoji: '💡', light: 'linear-gradient(135deg,#fff6bf,#ffd966)', dark: 'linear-gradient(135deg,#4a3e0e,#6b5512)' },
  { id: 'projets', name: 'Projets', emoji: '🚀', light: 'linear-gradient(135deg,#d6e4ff,#a9c1f5)', dark: 'linear-gradient(135deg,#1c2a4a,#2b3f6e)' },
  { id: 'musique', name: 'Musique', emoji: '🎵', light: 'linear-gradient(135deg,#f0d9ff,#cfa8f0)', dark: 'linear-gradient(135deg,#36204a,#4f2e6b)' },
  { id: 'films', name: 'Films', emoji: '🎬', light: 'linear-gradient(135deg,#ffd6d6,#f2a0a0)', dark: 'linear-gradient(135deg,#4a1c1c,#6b2a2a)' },
  { id: 'lecture', name: 'Lecture', emoji: '📚', light: 'linear-gradient(135deg,#efe3d0,#d6bf99)', dark: 'linear-gradient(135deg,#3b3020,#55442c)' },
  { id: 'voyage', name: 'Voyage', emoji: '✈️', light: 'linear-gradient(135deg,#d2f1f7,#9fd8e6)', dark: 'linear-gradient(135deg,#123c45,#1d5966)' },
  { id: 'fete', name: 'Fête', emoji: '🎉', light: 'linear-gradient(135deg,#ffe0f0,#f7a8cf)', dark: 'linear-gradient(135deg,#4a1d36,#6b2b4f)' },
  { id: 'nature', name: 'Nature', emoji: '🌿', light: 'linear-gradient(135deg,#e0f5e9,#b4e0c4)', dark: 'linear-gradient(135deg,#173d2a,#225a3d)' },
];

export function findPreset(id: string) {
  return PRESET_BACKGROUNDS.find((p) => p.id === id);
}
