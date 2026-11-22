-- Thanksgiving Machine schema
-- No logins: the shared link is the key. RLS is on, with open policies for the anon role.

create table if not exists app_settings (
  id int primary key default 1 check (id = 1),
  dinner_at timestamptz not null,
  headcount int not null default 9,
  turkey_lb numeric not null default 13.5,
  updated_at timestamptz not null default now()
);

create table if not exists dishes (
  id text primary key,
  name text not null,
  who text,
  category text not null default 'side',
  sort int not null default 0,
  chosen_recipe_id text,
  notes text
);

create table if not exists recipes (
  id text primary key,
  dish_id text not null references dishes(id) on delete cascade,
  title text not null,
  badge text,
  description text,
  serves text,
  prep_min int,
  cook_min int,
  equipment text,
  temp_f int,
  ingredients jsonb not null default '[]',
  steps jsonb not null default '[]',
  tasks jsonb not null default '[]',
  sort int not null default 0
);

create table if not exists tasks (
  id text primary key default gen_random_uuid()::text,
  label text not null,
  starts_at timestamptz not null,
  duration_min int not null default 15,
  equipment text not null default 'counter',
  temp_f int,
  sort int not null default 0
);

create table if not exists task_state (
  task_key text primary key,
  done boolean not null default false,
  shift_min int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists grocery_state (
  item_key text primary key,
  checked boolean not null default false,
  store text,
  updated_at timestamptz not null default now()
);

create table if not exists grocery_extras (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  qty text,
  store text not null default 'Meijer',
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists timers (
  id text primary key default gen_random_uuid()::text,
  label text not null,
  duration_sec int not null,
  ends_at timestamptz,
  remaining_sec int,
  status text not null default 'running' check (status in ('running','paused','ringing','dismissed')),
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['app_settings','dishes','recipes','tasks','task_state','grocery_state','grocery_extras','timers'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "family link full access" on %I', t);
    execute format('create policy "family link full access" on %I for all to anon, authenticated using (true) with check (true)', t);
    execute format('alter table %I replica identity full', t);
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
