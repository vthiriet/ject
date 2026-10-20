import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';
import webpush from 'web-push';
import { VAPID_PUBLIC_KEY } from '../../lib/vapid';
import { categoryOf } from '../../lib/gtd';
import { digest, remindersFor } from '../../lib/reminders';
import { env, json, requireUser, unauthorized } from '../../lib/server';
import type { Note } from '../../lib/types';

export const prerender = false;

/** Après l'heure prévue, on rattrape un appel manqué pendant 3 heures (pas après 21 h). */
const CATCH_UP_HOURS = 3;

interface PushRow {
  endpoint: string;
  user_id: string;
  subscription: webpush.PushSubscription;
  tz: string;
}

function admin() {
  const url = env('PUBLIC_SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

/** Date (à minuit) et heure locales dans le fuseau de l'appareil. */
function localNow(tz: string, now = new Date()) {
  let parts: Record<string, string>;
  try {
    parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
        .formatToParts(now).map((p) => [p.type, p.value]),
    );
  } catch {
    return localNow('Europe/Paris', now);
  }
  return { day: new Date(+parts.year, +parts.month - 1, +parts.day), date: `${parts.year}-${parts.month}-${parts.day}`, hour: +parts.hour };
}

/** Envoie à tous les appareils d'un utilisateur ; oublie ceux qui n'existent plus. */
async function sendAll(db: NonNullable<ReturnType<typeof admin>>, subs: PushRow[], payload: object) {
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(s.subscription, JSON.stringify(payload), { TTL: 6 * 3600, urgency: 'normal' });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from('ject_push').delete().eq('endpoint', s.endpoint);
    }
  }
  return sent;
}

/**
 * Rappels des habitudes.
 * - Appel horaire (tâche Supabase) : en-tête « Authorization: Bearer <CRON_SECRET> ».
 * - Essai depuis les Réglages : utilisateur connecté + `?test=1`.
 */
export const POST: APIRoute = async ({ request, url }) => {
  const db = admin();
  const privateKey = env('VAPID_PRIVATE_KEY');
  if (!db || !privateKey) return json({ error: 'Notifications pas encore configurées (variables Vercel manquantes).' }, 503);
  webpush.setVapidDetails('https://ject-delta.vercel.app', VAPID_PUBLIC_KEY, privateKey);

  // Essai : une notification tout de suite, sur les appareils de l'utilisateur connecté.
  if (url.searchParams.get('test')) {
    const user = await requireUser(request);
    if (!user) return unauthorized();
    const { data } = await db.from('ject_push').select('endpoint, user_id, subscription, tz').eq('user_id', user.id);
    const sent = await sendAll(db, (data ?? []) as PushRow[], {
      title: 'Ject', body: 'Les rappels des habitudes sont activés.', url: '/?tab=habit', tag: 'ject-test',
    });
    return json({ sent });
  }

  const secret = env('CRON_SECRET');
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || token !== secret) return unauthorized();

  const { data: rows, error } = await db.from('ject_push').select('endpoint, user_id, subscription, tz');
  if (error) return json({ error: error.message }, 500);
  const byUser = new Map<string, PushRow[]>();
  for (const r of (rows ?? []) as PushRow[]) byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r]);

  let sent = 0;
  for (const [userId, subs] of byUser) {
    const { day, date, hour } = localNow(subs[0].tz);
    const { data: records } = await db
      .from('ject_records')
      .select('data')
      .eq('user_id', userId)
      .eq('kind', 'note')
      .eq('deleted', false);
    const habits = (records ?? []).map((r) => r.data as Note).filter((n) => categoryOf(n) === 'habit');
    // Rappels dont l'heure est passée depuis peu, regroupés par heure.
    const due = remindersFor(habits, day).filter((r) => hour >= r.hour && hour < r.hour + CATCH_UP_HOURS && hour < 21);
    for (const h of [...new Set(due.map((r) => r.hour))]) {
      const key = `${date}:${h}`;
      // Une seule fois par jour et par heure, même si la tâche est appelée plusieurs fois.
      const { error: dup } = await db.from('ject_push_sent').insert({ user_id: userId, key });
      if (dup) continue;
      const d = digest(due.filter((r) => r.hour === h));
      sent += await sendAll(db, subs, { ...d, url: '/?tab=habit', tag: `ject-${key}` });
    }
  }
  return json({ sent });
};

export const GET = POST;
