import { env } from './server';

const NOTION_VERSION = '2022-06-28';

export async function notion(path: string, init: { method?: string; body?: unknown } = {}) {
  const token = env('NOTION_TOKEN');
  if (!token) throw new Error("La clé Notion (NOTION_TOKEN) n'est pas configurée sur Vercel.");
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Notion : ${data.message ?? res.status}`);
  return data;
}

/** Notion limite chaque texte à 2000 caractères. */
export function richText(text: string) {
  const parts = [];
  for (let i = 0; i < text.length; i += 2000) parts.push({ type: 'text', text: { content: text.slice(i, i + 2000) } });
  return parts.length ? parts : [{ type: 'text', text: { content: '' } }];
}
