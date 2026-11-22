-- Dishes removed from the menu with the X (restorable).
alter table dishes add column if not exists removed boolean not null default false;
