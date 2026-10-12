import { db } from './db';
import { authHeaders } from './supabase';
import type { LinkPreview } from './types';

export interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  url: string;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()), ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Erreur ${res.status}`);
  return body as T;
}

export const searchNotionPages = (q: string) =>
  call<{ pages: NotionPage[] }>(`/api/notion/pages?q=${encodeURIComponent(q)}`).then((r) => r.pages);

export const exportToNotion = (payload: {
  pageId: string;
  heading?: string;
  todos?: { text: string; checked: boolean }[];
  paragraphs?: string[];
}) => call<{ ok: true }>('/api/notion/export', { method: 'POST', body: JSON.stringify(payload) });

const inflight = new Map<string, Promise<void>>();

/** Récupère (une seule fois, puis garde en cache) l'aperçu d'un lien. */
export function loadPreview(url: string) {
  if (inflight.has(url)) return inflight.get(url)!;
  const p = (async () => {
    const cached = await db.previews.get(url);
    const week = 7 * 24 * 3600 * 1000;
    if (cached && (!cached.failed || Date.now() - cached.fetchedAt < week)) return;
    const headers = await authHeaders();
    if (!headers.Authorization) return; // aperçus réservés à l'utilisateur connecté
    try {
      const data = await call<Omit<LinkPreview, 'url' | 'fetchedAt'>>(`/api/link-preview?url=${encodeURIComponent(url)}`);
      await db.previews.put({ url, ...data, fetchedAt: Date.now() });
    } catch {
      await db.previews.put({ url, fetchedAt: Date.now(), failed: true });
    }
  })();
  inflight.set(url, p);
  return p;
}
