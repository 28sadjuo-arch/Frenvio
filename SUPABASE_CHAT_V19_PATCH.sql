-- =========================================================
-- Frenvio Chat Patch (Replies + Reactions)
-- Run in Supabase SQL Editor
-- Safe to run multiple times
-- =========================================================

-- Replies
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid;

ALTER TABLE public.group_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid;

-- Reactions tables
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_message_reactions (
  id uuid primary key default gen_random_uuid(),
  group_message_id uuid not null references public.group_messages(id) on delete cascade,
  user_id uuid not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique (group_message_id, user_id)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_message_reactions ENABLE ROW LEVEL SECURITY;

-- Policies: reactions are visible to authenticated users
DROP POLICY IF EXISTS message_reactions_select ON public.message_reactions;
CREATE POLICY message_reactions_select
ON public.message_reactions FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS message_reactions_upsert ON public.message_reactions;
CREATE POLICY message_reactions_upsert
ON public.message_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS message_reactions_delete ON public.message_reactions;
CREATE POLICY message_reactions_delete
ON public.message_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS group_message_reactions_select ON public.group_message_reactions;
CREATE POLICY group_message_reactions_select
ON public.group_message_reactions FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS group_message_reactions_insert ON public.group_message_reactions;
CREATE POLICY group_message_reactions_insert
ON public.group_message_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS group_message_reactions_delete ON public.group_message_reactions;
CREATE POLICY group_message_reactions_delete
ON public.group_message_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
