-- Recipes added from a link keep the original page URL.
alter table recipes add column if not exists source_url text;
