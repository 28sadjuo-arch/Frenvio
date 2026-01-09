-- ==========================================================
-- FREN VIO DM FIX (ALL-IN-ONE)
-- Creates/updates public.messages for Direct Messages (DM)
-- Safe to run multiple times. Does NOT delete data.
-- ==========================================================

create extension if not exists pgcrypto;

-- 1) Create messages table if missing
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  sender_id uuid not null,
  receiver_id uuid not null,
  content text,
  message_type text default 'text', -- text | voice
  media_url text,
  reply_to_id uuid,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  read_at timestamptz
);

-- 2) Add any missing columns (in case table already existed)
alter table public.messages add column if not exists room_id text;
alter table public.messages add column if not exists sender_id uuid;
alter table public.messages add column if not exists receiver_id uuid;
alter table public.messages add column if not exists content text;
alter table public.messages add column if not exists message_type text default 'text';
alter table public.messages add column if not exists media_url text;
alter table public.messages add column if not exists reply_to_id uuid;
alter table public.messages add column if not exists deleted_at timestamptz;
alter table public.messages add column if not exists created_at timestamptz default now();
alter table public.messages add column if not exists read_at timestamptz;

-- 3) Helpful indexes
create index if not exists messages_room_id_idx on public.messages(room_id);
create index if not exists messages_created_at_idx on public.messages(created_at);
create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists messages_receiver_idx on public.messages(receiver_id);

-- 4) RLS policies
alter table public.messages enable row level security;

drop policy if exists "dm_select_own" on public.messages;
create policy "dm_select_own"
on public.messages for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "dm_insert_own" on public.messages;
create policy "dm_insert_own"
on public.messages for insert
to authenticated
with check (auth.uid() = sender_id);

drop policy if exists "dm_update_read" on public.messages;
create policy "dm_update_read"
on public.messages for update
to authenticated
using (auth.uid() = receiver_id)
with check (auth.uid() = receiver_id);

drop policy if exists "dm_delete_own" on public.messages;
create policy "dm_delete_own"
on public.messages for delete
to authenticated
using (auth.uid() = sender_id);

-- If you want "soft delete" (recommended), use update to set deleted_at instead of delete.
