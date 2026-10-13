create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  prompt text not null default '' check (char_length(prompt) <= 1000),
  code text not null check (char_length(code) between 1 and 50000),
  thumbnail text check (thumbnail is null or char_length(thumbnail) <= 150000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index generations_user_updated_idx
  on public.generations (user_id, updated_at desc);

-- Keep updated_at honest on every update
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger generations_set_updated_at
  before update on public.generations
  for each row execute function public.set_updated_at();

-- Row-level security: each user can only touch their own rows
alter table public.generations enable row level security;

grant select, insert, update, delete on public.generations to authenticated;

create policy "Users can read their own generations"
  on public.generations for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own generations"
  on public.generations for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own generations"
  on public.generations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own generations"
  on public.generations for delete to authenticated
  using ((select auth.uid()) = user_id);