-- Stores are now Costco, HEB, Other.
update grocery_extras set store = case store when 'Sam''s' then 'Costco' when 'Meijer' then 'HEB' when 'Fruit Mkt' then 'HEB' when 'On hand' then 'Other' else store end;
update grocery_state set store = case store when 'Sam''s' then 'Costco' when 'Meijer' then 'HEB' when 'Fruit Mkt' then 'HEB' when 'On hand' then 'Other' else store end where store is not null;
update tasks set label = 'Shop Costco' where id = 'sams';
update tasks set label = 'Shop HEB' where id = 'meijer';
delete from task_state where task_key = 'chore:fruitmkt';
delete from tasks where id = 'fruitmkt';
alter table grocery_extras alter column store set default 'HEB';
