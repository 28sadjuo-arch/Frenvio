-- Frenvio: Chat tables/columns/policies (safe to run multiple times)
-- Paste into Supabase SQL Editor and RUN.

-- This script focuses on chat so that:
-- - You can send text/images/voice in DMs + groups
-- - Typing/online works from the frontend
-- - Group members (even non-admin) can invite others

-- ---------------------------------
-- 1) Direct messages: messages
-- ---------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='messages' AND column_name='message_type'
    ) THEN
      ALTER TABLE public.messages ADD COLUMN message_type text DEFAULT 'text';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='messages' AND column_name='media_url'
    ) THEN
      ALTER TABLE public.messages ADD COLUMN media_url text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='messages' AND column_name='read_at'
    ) THEN
      ALTER TABLE public.messages ADD COLUMN read_at timestamptz;
    END IF;
  END IF;
END $$;

-- ---------------------------------
-- 2) Groups + group messaging
-- ---------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  last_read_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text',
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_message_reactions (
  message_id uuid NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- ---------------------------------
-- 3) RLS + policies (enable and make chat work)
-- ---------------------------------
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_message_reactions ENABLE ROW LEVEL SECURITY;

-- groups
DROP POLICY IF EXISTS "groups_select" ON public.groups;
CREATE POLICY "groups_select" ON public.groups
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "groups_insert" ON public.groups;
CREATE POLICY "groups_insert" ON public.groups
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "groups_update_owner" ON public.groups;
CREATE POLICY "groups_update_owner" ON public.groups
FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- group_members
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
CREATE POLICY "group_members_select" ON public.group_members
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
  )
);

-- allow any existing member to invite/add another member
DROP POLICY IF EXISTS "group_members_insert_by_member" ON public.group_members;
CREATE POLICY "group_members_insert_by_member" ON public.group_members
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
  )
);

-- allow member to leave (delete their own row)
DROP POLICY IF EXISTS "group_members_delete_self" ON public.group_members;
CREATE POLICY "group_members_delete_self" ON public.group_members
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- allow members to update their own last_read_at
DROP POLICY IF EXISTS "group_members_update_self" ON public.group_members;
CREATE POLICY "group_members_update_self" ON public.group_members
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- allow admins to promote others
DROP POLICY IF EXISTS "group_members_update_admin" ON public.group_members;
CREATE POLICY "group_members_update_admin" ON public.group_members
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  )
);

-- group_messages
DROP POLICY IF EXISTS "group_messages_select" ON public.group_messages;
CREATE POLICY "group_messages_select" ON public.group_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "group_messages_insert" ON public.group_messages;
CREATE POLICY "group_messages_insert" ON public.group_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid()
  )
);

-- group_message_reactions
DROP POLICY IF EXISTS "group_reactions_select" ON public.group_message_reactions;
CREATE POLICY "group_reactions_select" ON public.group_message_reactions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_messages m
    JOIN public.group_members gm ON gm.group_id = m.group_id
    WHERE m.id = group_message_reactions.message_id AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "group_reactions_upsert" ON public.group_message_reactions;
CREATE POLICY "group_reactions_upsert" ON public.group_message_reactions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- ---------------------------------
-- 4) (Optional) blocks table
-- ---------------------------------
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blocks_select" ON public.blocks;
CREATE POLICY "blocks_select" ON public.blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
DROP POLICY IF EXISTS "blocks_insert" ON public.blocks;
CREATE POLICY "blocks_insert" ON public.blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
DROP POLICY IF EXISTS "blocks_delete" ON public.blocks;
CREATE POLICY "blocks_delete" ON public.blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

-- ---------------------------------
-- Storage note (manual):
-- Create a public bucket named: chat-media
-- Then allow authenticated users to upload.
-- Supabase Dashboard -> Storage -> Create bucket "chat-media" -> Public.
