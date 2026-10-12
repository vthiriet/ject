import type { APIRoute } from 'astro';
import { json, requireUser, unauthorized } from '../../lib/server';

export const prerender = false;

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?$|\[?f[cd])/i;

function meta(html: string, ...names: string[]) {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`,
      'i',
    );
    const m = html.match(re);
    if (m) return decode(m[1] ?? m[2]);
  }
  return undefined;
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

/** Récupère le titre, l'image et le site d'une page web, pour l'aperçu d'un lien. */
export const GET: APIRoute = async ({ request, url }) => {
  if (!(await requireUser(request))) return unauthorized();
  let target: URL;
  try {
    target = new URL(url.searchParams.get('url') ?? '');
  } catch {
    return json({ error: 'Lien invalide.' }, 400);
  }
  if (!/^https?:$/.test(target.protocol) || PRIVATE_HOST.test(target.hostname)) {
    return json({ error: 'Lien non autorisé.' }, 400);
  }
  try {
    const res = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JectBot/1.0)', Accept: 'text/html' },
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    });
    const html = (await res.text()).slice(0, 400_000);
    const title = meta(html, 'og:title', 'twitter:title') ?? decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '');
    let image = meta(html, 'og:image', 'twitter:image');
    if (image) image = new URL(image, res.url).toString();
    return json({
      title: title || undefined,
      description: meta(html, 'og:description', 'description', 'twitter:description'),
      image,
      siteName: meta(html, 'og:site_name') ?? new URL(res.url).hostname.replace(/^www\./, ''),
    });
  } catch {
    return json({ error: 'Page inaccessible.' }, 502);
  }
};
