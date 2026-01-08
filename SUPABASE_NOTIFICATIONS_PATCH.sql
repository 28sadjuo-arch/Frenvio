-- =====================================================
-- Frenvio Notifications Patch
-- Adds message column (if missing) and sends a notification when a user is verified.
-- Safe to run multiple times.
-- =====================================================

-- 1) Add columns (idempotent)
alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists comment_id uuid;

-- 2) Verified notification trigger
create or replace function public.notify_profile_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only fire when verified switches from false/null -> true
  if (coalesce(old.verified, false) = false) and (new.verified = true) then
    insert into public.notifications (user_id, type, message, actor_id, post_id, read, created_at)
    values (new.id, 'verified', 'Your account has been verified ✅', null, null, false, now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_profile_verified on public.profiles;
create trigger trg_notify_profile_verified
after update of verified on public.profiles
for each row
execute function public.notify_profile_verified();
