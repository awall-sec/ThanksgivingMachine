-- Chore times are stored as minutes relative to dinner, so changing dinner time shifts everything.
alter table tasks drop column starts_at;
alter table tasks add column offset_min int not null default 0;
alter table tasks add column notes text;
