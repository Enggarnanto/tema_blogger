create table if not exists public.cms_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  slug text,
  content_html text not null default '',
  excerpt text,
  labels text[] not null default '{}',
  meta_keyword text,
  location_name text,
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  publish_at timestamptz,
  blogger_post_id text,
  blogger_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cms_posts enable row level security;

create policy "cms_posts_select_own"
on public.cms_posts
for select
to authenticated
using (auth.uid() = user_id);

create policy "cms_posts_insert_own"
on public.cms_posts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "cms_posts_update_own"
on public.cms_posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "cms_posts_delete_own"
on public.cms_posts
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cms_posts_set_updated_at on public.cms_posts;
create trigger cms_posts_set_updated_at
before update on public.cms_posts
for each row
execute function public.set_updated_at();
