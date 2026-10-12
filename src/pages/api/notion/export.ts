import type { APIRoute } from 'astro';
import { notion, richText } from '../../../lib/notion';
import { json, requireUser, unauthorized } from '../../../lib/server';

export const prerender = false;

interface Payload {
  pageId: string;
  heading?: string;
  todos?: { text: string; checked: boolean }[];
  paragraphs?: string[];
}

/** Ajoute des cases à cocher (ou des paragraphes) à la fin d'une page Notion. */
export const POST: APIRoute = async ({ request }) => {
  if (!(await requireUser(request))) return unauthorized();
  const body = (await request.json().catch(() => null)) as Payload | null;
  if (!body?.pageId || !/^[0-9a-f-]{32,36}$/i.test(body.pageId)) return json({ error: 'Page Notion invalide.' }, 400);

  const blocks: unknown[] = [];
  if (body.heading?.trim()) {
    blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: richText(body.heading.trim()) } });
  }
  for (const t of body.todos ?? []) {
    if (!t.text?.trim()) continue;
    blocks.push({ object: 'block', type: 'to_do', to_do: { rich_text: richText(t.text.trim()), checked: !!t.checked } });
  }
  for (const p of body.paragraphs ?? []) {
    blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(p) } });
  }
  if (!blocks.length) return json({ error: 'Rien à exporter.' }, 400);

  try {
    for (let i = 0; i < blocks.length; i += 100) {
      await notion(`blocks/${body.pageId}/children`, { method: 'PATCH', body: { children: blocks.slice(i, i + 100) } });
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur Notion' }, 502);
  }
};
