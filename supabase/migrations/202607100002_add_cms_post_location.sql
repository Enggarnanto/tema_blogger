-- Incremental migration for existing CMS databases.
-- Adds the Blogger location name used by the CMS metadata panel.

alter table public.cms_posts
add column if not exists location_name text;
