-- =========================================
-- Frenvio: Chat upgrade (Inbox, Groups, Reactions, Presence helpers)
-- Safe to run multiple times (no data loss)
-- =========================================

create extension if not exists pgcrypto;

-- Ensure base direct message columns exist (older DBs may miss these)
alter table public.messages add column if not exists room_id text;
alter table public.messages add column if not exists sender_id uuid;
alter table public.messages add column if not exists receiver_id uuid;
alter table public.messages add column if not exists content text;
alter table public.messages add column if not exists created_at timestamptz default now();

-- Profile last seen
alter table public.profiles add column if not exists last_seen_at timestamptz;

-- Direct messages upgrades
alter table public.messages add column if not exists message_type text default 'text';
alter table public.messages add column if not exists media_url text;
alter table public.messages add column if not exists read_at timestamptz;

create index if not exists messages_room_idx on public.messages(room_id);
create index if not exists messages_receiver_read_idx on public.messages(receiver_id, read_at);

-- Blocks (for DM + general safety)
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

-- Message reactions (DM)
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

drop policy if exists "mr_delete_own" on public.message_reactions;
create policy "mr_delete_own"
on public.message_reactions for delete
to authenticated
using (auth.uid() = user_id);

-- Groups: last read for unread badges
alter table public.group_members add column if not exists last_read_at timestamptz;

-- Group messages
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

-- Group message reactions
create table if not exists public.group_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.group_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

alter table public.group_message_reactions enable row level security;

drop policy if exists "gmr_read" on public.group_message_reactions;
create policy "gmr_read"
on public.group_message_reactions for select
to authenticated
using (true);

drop policy if exists "gmr_insert_own" on public.group_message_reactions;
create policy "gmr_insert_own"
on public.group_message_reactions for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "gmr_delete_own" on public.group_message_reactions;
create policy "gmr_delete_own"
on public.group_message_reactions for delete
to authenticated
using (auth.uid() = user_id);

-- Storage reminder:
-- Create a public bucket named: chat-media
-- and allow authenticated users to upload (or keep public for MVP).
