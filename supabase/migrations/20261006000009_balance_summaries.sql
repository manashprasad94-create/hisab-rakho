create or replace function public.get_friend_balance_totals()
returns table(to_receive numeric, to_pay numeric)
language sql security definer set search_path = ''
as $$
  select coalesce(sum(t.remaining_amount) filter (where t.payer_id = auth.uid()), 0),
         coalesce(sum(t.remaining_amount) filter (where t.payee_id = auth.uid()), 0)
  from public.friend_transactions t
  where auth.uid() is not null and
    (t.payer_id = auth.uid() or t.payee_id = auth.uid()) and
    t.status in ('pending', 'partially_paid');
$$;

create or replace function public.list_friend_balances()
returns table(friend_id uuid, full_name text, amount numeric, direction text)
language sql security definer set search_path = ''
as $$
  select person.friend_id, p.full_name::text,
         sum(t.remaining_amount)::numeric as amount, person.direction
  from public.friend_transactions t
  cross join lateral (
    select case when t.payer_id = auth.uid() then t.payee_id else t.payer_id end as friend_id,
           case when t.payer_id = auth.uid() then 'receive' else 'pay' end as direction
  ) person
  left join public.profiles p on p.id = person.friend_id
  where auth.uid() is not null and
    (t.payer_id = auth.uid() or t.payee_id = auth.uid()) and
    t.status in ('pending', 'partially_paid')
  group by person.friend_id, p.full_name, person.direction
  order by amount desc;
$$;

revoke all on function public.get_friend_balance_totals() from public, anon;
revoke all on function public.list_friend_balances() from public, anon;
grant execute on function public.get_friend_balance_totals() to authenticated;
grant execute on function public.list_friend_balances() to authenticated;
notify pgrst, 'reload schema';
