-- Read-only inspection for the live Supabase SQL Editor.
-- Review every exposed table's RLS state, grants, and policies before deployment.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       has_table_privilege('anon', c.oid, 'SELECT') as anon_select,
       has_table_privilege('anon', c.oid, 'INSERT') as anon_insert,
       has_table_privilege('anon', c.oid, 'UPDATE') as anon_update,
       has_table_privilege('authenticated', c.oid, 'SELECT') as user_select,
       has_table_privilege('authenticated', c.oid, 'INSERT') as user_insert,
       has_table_privilege('authenticated', c.oid, 'UPDATE') as user_update,
       has_table_privilege('authenticated', c.oid, 'DELETE') as user_delete
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relname;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in (
  'profiles', 'friendships', 'friend_transactions', 'payment_records',
  'group_expenses', 'group_funds', 'group_fund_members',
  'group_fund_balances', 'group_fund_transactions', 'personal_expenses',
  'external_transactions', 'notifications'
)
order by table_name, ordinal_position;
