-- Optional cleanup migration.
-- Run only if an earlier local version created location_lat/location_lng/location_span.

alter table public.cms_posts
drop column if exists location_lat,
drop column if exists location_lng,
drop column if exists location_span;
