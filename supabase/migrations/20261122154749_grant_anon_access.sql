-- New projects don't auto-grant table privileges to the API roles.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on app_settings, dishes, recipes, tasks, task_state, grocery_state, grocery_extras, timers to anon, authenticated;
