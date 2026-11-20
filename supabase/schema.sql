-- Киноурна: run once in Supabase → SQL Editor → New query → Run.

-- Public room state. Clients may read it (and receive it over Realtime),
-- but every write goes through the Next.js API with the secret key.
create table if not exists public.rooms (
  code        text primary key,
  state       jsonb not null,
  version     integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Hidden data: each player's picks and ballots, plus who proposed what.
-- No RLS policies → unreachable with the publishable/anon key.
create table if not exists public.room_secrets (
  code       text not null references public.rooms(code) on delete cascade,
  player_id  text not null,
  kind       text not null,
  data       jsonb not null,
  primary key (code, player_id, kind)
);

alter table public.rooms enable row level security;
alter table public.room_secrets enable row level security;

drop policy if exists "rooms are readable" on public.rooms;
create policy "rooms are readable" on public.rooms
  for select to anon, authenticated using (true);

grant select on public.rooms to anon, authenticated;
revoke all on public.room_secrets from anon, authenticated;

-- Newer Supabase projects don't auto-grant table privileges, not even to the
-- server role, so the API (secret key = service_role) needs explicit grants.
grant select, insert, update, delete on public.rooms, public.room_secrets to service_role;

-- Push row updates to subscribed browsers.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end $$;
