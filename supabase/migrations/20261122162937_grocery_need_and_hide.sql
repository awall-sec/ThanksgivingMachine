-- Per-recipe 'already have it' list, and grocery items removed with the X.
alter table recipes add column if not exists skip_keys jsonb not null default '[]';
alter table grocery_state add column if not exists hidden boolean not null default false;
