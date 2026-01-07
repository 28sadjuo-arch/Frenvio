-- =========================================
-- Frenvio Chat FINAL (DM + Groups)
-- Paste this ENTIRE file into Supabase SQL Editor and Run.
-- Safe to run multiple times.
-- =========================================

create extension if not exists pgcrypto;

-- ---------- Direct messages (public.messages) ----------
alter table public.messages add column if not exists room_id text;
alter table public.messages add column if not exists sender_id uuid;
alter table public.messages add column if not exists receiver_id uuid;
alter table public.messages add column if not exists content text;
alter table public.messages add column if not exists created_at timestamptz default now();
alter table public.messages add column if not exists message_type text default 'text';
alter table public.messages add column if not exists media_url text;
alter table public.messages add column if not exists read_at timestamptz;
alter table public.messages add column if not exists reply_to_id uuid;

create index if not exists messages_room_idx on public.messages(room_id);
create index if not exists messages_receiver_read_idx on public.messages(receiver_id, read_at);

-- Enable RLS if not already
alter table public.messages enable row level security;

-- DM policies (read your conversations)
drop policy if exists "messages_read_own_convos" on public.messages;
create policy "messages_read_own_convos"
on public.messages for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- DM insert (send as yourself)
drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
on public.messages for insert
to authenticated
with check (auth.uid() = sender_id);

-- Mark read (receiver can update read_at only)
drop policy if exists "messages_update_read" on public.messages;
create policy "messages_update_read"
on public.messages for update
to authenticated
using (auth.uid() = receiver_id or auth.uid() = sender_id)
with check (auth.uid() = receiver_id or auth.uid() = sender_id);

-- Delete your own message
drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own"
on public.messages for delete
to authenticated
using (auth.uid() = sender_id);

-- ---------- Presence ----------
alter table public.profiles add column if not exists last_seen_at timestamptz;

-- ---------- Blocks ----------
create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "blocks_read_own" on public.blocks;
create policy "blocks_read_own"
on public.blocks for select
to authenticated
using (auth.uid() = blocker_id);

drop policy if exists "blocks_insert_own" on public.blocks;
create policy "blocks_insert_own"
on public.blocks for insert
to authenticated
with check (auth.uid() = blocker_id);

drop policy if exists "blocks_delete_own" on public.blocks;
create policy "blocks_delete_own"
on public.blocks for delete
to authenticated
using (auth.uid() = blocker_id);

-- ---------- DM Reactions ----------
create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

alter table public.message_reactions enable row level security;

drop policy if exists "mr_read_room" on public.message_reactions;
create policy "mr_read_room"
on public.message_reactions for select
to authenticated
using (true);

drop policy if exists "mr_upsert_own" on public.message_reactions;
create policy "mr_upsert_own"
on public.message_reactions for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "mr_update_own" on public.message_reactions;
create policy "mr_update_own"
on public.message_reactions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "mr_delete_own" on public.message_reactions;
create policy "mr_delete_own"
on public.message_reactions for delete
to authenticated
using (auth.uid() = user_id);

-- ---------- Groups ----------
alter table public.group_members add column if not exists last_read_at timestamptz;

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  message_type text default 'text',
  media_url text,
  created_at timestamptz not null default now()
);

create index if not exists group_messages_group_idx on public.group_messages(group_id);
create index if not exists group_messages_created_idx on public.group_messages(created_at);

alter table public.group_messages enable row level security;

drop policy if exists "gm_read_members" on public.group_messages;
create policy "gm_read_members"
on public.group_messages for select
to authenticated
using (
  exists(select 1 from public.group_members m where m.group_id = group_id and m.user_id = auth.uid())
);

drop policy if exists "gm_insert_members" on public.group_messages;
create policy "gm_insert_members"
on public.group_messages for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists(select 1 from public.group_members m where m.group_id = group_id and m.user_id = auth.uid())
);

drop policy if exists "gm_delete_own" on public.group_messages;
create policy "gm_delete_own"
on public.group_messages for delete
to authenticated
using (auth.uid() = sender_id);

-- ---------- Storage reminder ----------
-- For voice notes, create a storage bucket named: chat-media
-- Recommended: make it PUBLIC for MVP, OR create an authenticated upload policy.
