-- Incremental migration for existing CMS databases.
-- Adds meta keywords that are inserted into Blogger content at publish time.

alter table public.cms_posts
add column if not exists meta_keyword text;
