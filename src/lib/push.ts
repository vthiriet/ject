import { authHeaders, getSession, supabase } from './supabase';
import { VAPID_PUBLIC_KEY } from './vapid';

/**
 * Notifications des habitudes (Web Push) : l'appareil s'abonne auprès du navigateur, puis
 * l'abonnement est enregistré dans Supabase (table `ject_push`). Le serveur (/api/notify)
 * envoie les rappels toutes les heures.
 */

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function keyBytes(base64: string) {
  const s = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function registration() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) throw new Error('L’application n’est pas encore prête hors ligne : recharge la page puis réessaie.');
  return reg;
}

/** Abonnement actuel de cet appareil (null si les rappels sont coupés). */
export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Active les rappels sur cet appareil. Renvoie un message d'erreur lisible, ou null. */
export async function enableReminders(): Promise<string | null> {
  if (!pushSupported()) return 'Ce navigateur ne permet pas les notifications.';
  if (!supabase || !(await getSession())) return 'Connecte-toi d’abord à ton compte (ci-dessus).';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'Notifications refusées : autorise-les dans les réglages du téléphone (Applications › Ject › Notifications).';
  try {
    const reg = await registration();
    const sub = (await reg.pushManager.getSubscription())
      ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
    const json = sub.toJSON();
    const { error } = await supabase.from('ject_push').upsert({
      endpoint: sub.endpoint,
      subscription: json,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      origin: location.origin,
    }, { onConflict: 'endpoint' });
    if (error) return `Enregistrement impossible : ${error.message}`;
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

/** Coupe les rappels sur cet appareil. */
export async function disableReminders() {
  const sub = await currentSubscription();
  if (!sub) return;
  await supabase?.from('ject_push').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}

/** Demande au serveur d'envoyer tout de suite une notification d'essai. */
export async function sendTest(): Promise<string | null> {
  const res = await fetch('/api/notify?test=1', { method: 'POST', headers: await authHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return body.error ?? `Erreur ${res.status}`;
  return body.sent ? null : 'Aucun appareil abonné : active d’abord les rappels.';
}
