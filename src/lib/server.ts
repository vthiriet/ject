import { createClient } from '@supabase/supabase-js';

/** Lit une variable d'environnement côté serveur (Vercel ou fichier .env). */
export function env(name: string): string | undefined {
  return process.env[name] ?? (import.meta.env as Record<string, string | undefined>)[name];
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Vérifie que la requête vient de l'utilisateur connecté et autorisé. */
export async function requireUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const url = env('PUBLIC_SUPABASE_URL');
  const key = env('PUBLIC_SUPABASE_ANON_KEY');
  if (!token || !url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const allowed = env('ALLOWED_EMAIL')?.trim().toLowerCase();
  if (allowed && data.user.email?.toLowerCase() !== allowed) return null;
  return data.user;
}

export const unauthorized = () => json({ error: 'Connecte-toi dans les Paramètres de Ject.' }, 401);
