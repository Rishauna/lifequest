-- Run this in Supabase Dashboard > SQL Editor.
-- Each signed-in user can access only their own saved LifeQuest profile.
create table if not exists public.lifequest_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lifequest_saves enable row level security;

create policy "Users can read their own LifeQuest save"
on public.lifequest_saves for select
using (auth.uid() = user_id);

create policy "Users can insert their own LifeQuest save"
on public.lifequest_saves for insert
with check (auth.uid() = user_id);

create policy "Users can update their own LifeQuest save"
on public.lifequest_saves for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
