alter table public.cms_posts
drop column if exists location_lat,
drop column if exists location_lng,
drop column if exists location_span;
