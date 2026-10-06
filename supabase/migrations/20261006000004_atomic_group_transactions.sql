create or replace function public.create_group_expense_atomic(
  p_participant_ids uuid[],
  p_total_amount numeric,
  p_reason text,
  p_category text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid := auth.uid();
  v_count integer := cardinality(p_participant_ids);
  v_total_cents bigint;
  v_base_cents bigint;
  v_extra_cents bigint;
  v_group_id public.group_expenses.id%type;
  v_participant_id uuid;
  v_index integer;
  v_share numeric;
begin
  if v_caller_id is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if v_count is null or v_count < 1 or v_count > 100 or
     (select count(distinct id) from unnest(p_participant_ids) as id) <> v_count or
     v_caller_id = any(p_participant_ids) then
    raise exception 'Choose each friend once';
  end if;
  if p_total_amount is null or p_total_amount <= 0 or
     p_total_amount <> round(p_total_amount, 2) then
    raise exception 'Enter a valid amount with at most two decimal places';
  end if;
  v_total_cents := (p_total_amount * 100)::bigint;
  if v_total_cents < v_count + 1 then
    raise exception 'Amount is too small to split';
  end if;
  if exists (
    select 1 from unnest(p_participant_ids) as participant(id)
    where not exists (
      select 1 from public.friendships f
      where f.status = 'accepted' and
        ((f.user_a = v_caller_id and f.user_b = participant.id) or
         (f.user_b = v_caller_id and f.user_a = participant.id))
    )
  ) then
    raise exception 'All participants must be accepted friends' using errcode = '42501';
  end if;

  v_base_cents := v_total_cents / (v_count + 1);
  v_extra_cents := v_total_cents % (v_count + 1);
  insert into public.group_expenses (created_by, total_amount, reason, category)
  values (v_caller_id, p_total_amount, p_reason, p_category)
  returning id into v_group_id;

  for v_participant_id, v_index in
    select id, ordinality::integer - 1
    from unnest(p_participant_ids) with ordinality as participant(id, ordinality)
  loop
    v_share := (v_base_cents + case when v_index < v_extra_cents then 1 else 0 end) / 100.0;
    insert into public.friend_transactions
      (created_by, payer_id, payee_id, amount, remaining_amount,
       reason, category, status, group_expense_id)
    values
      (v_caller_id, v_caller_id, v_participant_id, v_share, v_share,
       p_reason, p_category, 'pending', v_group_id);
  end loop;
end;
$$;

revoke all on function public.create_group_expense_atomic(uuid[], numeric, text, text) from public;
revoke all on function public.create_group_expense_atomic(uuid[], numeric, text, text) from anon;
grant execute on function public.create_group_expense_atomic(uuid[], numeric, text, text) to authenticated;

create or replace function public.create_bulk_transactions_atomic(
  p_friend_ids uuid[],
  p_amount numeric,
  p_reason text,
  p_category text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid := auth.uid();
  v_count integer := cardinality(p_friend_ids);
begin
  if v_caller_id is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if v_count is null or v_count < 1 or v_count > 100 or
     (select count(distinct id) from unnest(p_friend_ids) as id) <> v_count or
     v_caller_id = any(p_friend_ids) then
    raise exception 'Choose each friend once';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'Enter a valid amount with at most two decimal places';
  end if;
  if exists (
    select 1 from unnest(p_friend_ids) as friend(id)
    where not exists (
      select 1 from public.friendships f
      where f.status = 'accepted' and
        ((f.user_a = v_caller_id and f.user_b = friend.id) or
         (f.user_b = v_caller_id and f.user_a = friend.id))
    )
  ) then
    raise exception 'All recipients must be accepted friends' using errcode = '42501';
  end if;

  insert into public.friend_transactions
    (created_by, payer_id, payee_id, amount, remaining_amount, reason, category, status)
  select v_caller_id, v_caller_id, friend.id, p_amount, p_amount,
         p_reason, p_category, 'pending_acceptance'
  from unnest(p_friend_ids) as friend(id);
end;
$$;

revoke all on function public.create_bulk_transactions_atomic(uuid[], numeric, text, text) from public;
revoke all on function public.create_bulk_transactions_atomic(uuid[], numeric, text, text) from anon;
grant execute on function public.create_bulk_transactions_atomic(uuid[], numeric, text, text) to authenticated;
notify pgrst, 'reload schema';
