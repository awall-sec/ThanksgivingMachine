-- Steps on the plan can be removed (and put back) without deleting the recipe.
alter table task_state add column if not exists hidden boolean not null default false;
