-- Ject : rappels des habitudes par notification.
-- À coller une seule fois dans Supabase > SQL Editor > New query, puis "Run",
-- APRÈS avoir remplacé COLLE_ICI_LE_SECRET par la valeur de CRON_SECRET (voir docs/INSTALLATION.md).

-- 1. Appareils abonnés aux notifications (un par téléphone ou navigateur).
create table if not exists public.ject_push (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subscription jsonb not null,
  -- Fuseau horaire de l'appareil (ex. Europe/Paris) : les rappels partent à l'heure locale.
  tz text not null default 'Europe/Paris',
  origin text,
  created_at timestamptz not null default now()
);

alter table public.ject_push enable row level security;

drop policy if exists "lecture de ses appareils" on public.ject_push;
create policy "lecture de ses appareils" on public.ject_push
  for select using (auth.uid() = user_id);

drop policy if exists "ajout de ses appareils" on public.ject_push;
create policy "ajout de ses appareils" on public.ject_push
  for insert with check (auth.uid() = user_id);

drop policy if exists "modification de ses appareils" on public.ject_push;
create policy "modification de ses appareils" on public.ject_push
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "retrait de ses appareils" on public.ject_push;
create policy "retrait de ses appareils" on public.ject_push
  for delete using (auth.uid() = user_id);

-- 2. Rappels déjà envoyés (un par jour et par heure), pour ne jamais envoyer deux fois.
--    Accessible seulement au serveur (aucune règle d'accès pour les utilisateurs).
create table if not exists public.ject_push_sent (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.ject_push_sent enable row level security;

-- 3. Tâche automatique : toutes les heures (à la 7e minute), demande au serveur d'envoyer les rappels dus.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('ject-rappels') where exists (select 1 from cron.job where jobname = 'ject-rappels');

select cron.schedule(
  'ject-rappels',
  '7 * * * *',
  $$
  select net.http_post(
    url := 'https://ject-preview-vthiriets-projects.vercel.app/api/notify',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer COLLE_ICI_LE_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 4. Fait prendre en compte les nouvelles tables tout de suite.
notify pgrst, 'reload schema';
