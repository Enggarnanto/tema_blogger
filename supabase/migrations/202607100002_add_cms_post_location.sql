alter table public.cms_posts
add column if not exists location_name text,
add column if not exists location_lat double precision,
add column if not exists location_lng double precision,
add column if not exists location_span text;
