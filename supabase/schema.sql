-- Ject : base de données de synchronisation.
-- À coller une seule fois dans Supabase > SQL Editor > New query, puis "Run".
--
-- Toutes les données (notes, libellés, images de fond) sont rangées dans une
-- seule table. Chaque ligne appartient à un utilisateur, qui ne voit que les
-- siennes (règles « RLS »).

create table if not exists public.ject_records (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('note', 'label', 'background')),
  data jsonb not null,
  -- Date de modification côté appareil (millisecondes) : la plus récente gagne.
  updated_at bigint not null,
  deleted boolean not null default false,
  -- Date d'arrivée sur le serveur : sert à ne télécharger que les nouveautés.
  server_updated_at timestamptz not null default clock_timestamp()
);

create index if not exists ject_records_sync_idx
  on public.ject_records (user_id, server_updated_at);

-- Refuse d'écraser une version plus récente, et horodate chaque arrivée.
create or replace function public.ject_records_touch()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.updated_at < old.updated_at then
      return null;
    end if;
    new.user_id := old.user_id;
  end if;
  new.server_updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists ject_records_touch on public.ject_records;
create trigger ject_records_touch
  before insert or update on public.ject_records
  for each row execute function public.ject_records_touch();

alter table public.ject_records enable row level security;

drop policy if exists "lecture de ses données" on public.ject_records;
create policy "lecture de ses données" on public.ject_records
  for select using (auth.uid() = user_id);

drop policy if exists "ajout de ses données" on public.ject_records;
create policy "ajout de ses données" on public.ject_records
  for insert with check (auth.uid() = user_id);

drop policy if exists "modification de ses données" on public.ject_records;
create policy "modification de ses données" on public.ject_records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
