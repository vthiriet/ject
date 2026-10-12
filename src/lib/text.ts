import type { Label, Note } from './types';

const URL_RE = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/gi;

export function extractLinks(note: Pick<Note, 'title' | 'content' | 'items'>): string[] {
  const text = [note.title, note.content, ...note.items.map((i) => i.text)].join('\n');
  return [...new Set(text.match(URL_RE) ?? [])];
}

/** Découpe un texte en morceaux texte / lien pour rendre les liens cliquables. */
export function splitLinks(text: string): { text: string; href?: string }[] {
  const parts: { text: string; href?: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    if (m.index! > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[0], href: m[0] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** Version texte d'une note, pour copier ou partager. */
export function noteToText(note: Note): string {
  const lines: string[] = [];
  if (note.title.trim()) lines.push(note.title.trim());
  if (note.type === 'text') {
    if (note.content.trim()) lines.push(note.content.trim());
  } else {
    for (const i of note.items) if (i.text.trim()) lines.push(`${i.checked ? '☑' : '☐'} ${i.text.trim()}`);
  }
  return lines.join('\n');
}

export function noteToMarkdown(note: Note, labels: Label[]): string {
  const out: string[] = [`## ${note.title.trim() || 'Sans titre'}`];
  const names = note.labelIds.map((id) => labels.find((l) => l.id === id)?.name).filter(Boolean);
  if (names.length) out.push(`*Libellés : ${names.join(', ')}*`);
  out.push('');
  if (note.type === 'text') out.push(note.content.trim());
  else for (const i of note.items) if (i.text.trim()) out.push(`- [${i.checked ? 'x' : ' '}] ${i.text.trim()}`);
  return out.join('\n');
}

export function matchesQuery(note: Note, q: string): boolean {
  const query = normalize(q);
  if (!query) return true;
  return normalize([note.title, note.content, ...note.items.map((i) => i.text)].join(' ')).includes(query);
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
