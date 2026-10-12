import type { APIRoute } from 'astro';
import { notion } from '../../../lib/notion';
import { json, requireUser, unauthorized } from '../../../lib/server';

export const prerender = false;

/** Liste les pages Notion partagées avec l'intégration (pour choisir la destination). */
export const GET: APIRoute = async ({ request, url }) => {
  if (!(await requireUser(request))) return unauthorized();
  try {
    const data = await notion('search', {
      method: 'POST',
      body: {
        query: url.searchParams.get('q') ?? '',
        filter: { property: 'object', value: 'page' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 50,
      },
    });
    const pages = (data.results ?? [])
      .filter((p: any) => !p.archived && !p.in_trash)
      .map((p: any) => {
        const titleProp = Object.values(p.properties ?? {}).find((prop: any) => prop.type === 'title') as any;
        const title = titleProp?.title?.map((t: any) => t.plain_text).join('') || 'Sans titre';
        return { id: p.id, title, icon: p.icon?.type === 'emoji' ? p.icon.emoji : undefined, url: p.url };
      });
    return json({ pages });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur Notion' }, 502);
  }
};
