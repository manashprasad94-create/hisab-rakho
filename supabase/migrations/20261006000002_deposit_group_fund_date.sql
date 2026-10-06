-- This is self-contained and can be run in the Supabase SQL Editor
-- even if the earlier deposit functions were never installed.
create or replace function public.deposit_group_fund(
  p_fund_id uuid,
  p_holder_id uuid,
  p_amount numeric,
  p_payment_mode text,
  p_reason text,
  p_deposit_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid := auth.uid();
  v_holder_name text;
  v_reason text := nullif(btrim(p_reason), '');
  v_created_at timestamptz;
begin
  if v_caller_id is null or not exists (
    select 1 from public.group_fund_members
    where fund_id = p_fund_id and user_id = v_caller_id and role = 'owner'
  ) then
    raise exception 'Only the fund owner can add money' using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'Amount must be positive with at most two decimal places';
  end if;
  if p_payment_mode is null or p_payment_mode not in ('cash', 'online') then
    raise exception 'Choose cash or online';
  end if;
  if length(v_reason) > 200 then
    raise exception 'Reason must be 200 characters or fewer';
  end if;
  if p_deposit_date is null or p_deposit_date > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Choose today or an earlier date';
  end if;

  -- Keep today's actual time. For earlier dates, use noon UTC so the entry
  -- appears on the selected calendar day in the app's Indian time zone.
  v_created_at := case
    when p_deposit_date = (now() at time zone 'Asia/Kolkata')::date then now()
    else (p_deposit_date + time '12:00') at time zone 'UTC'
  end;

  -- Serialize deposits to the same fund, including the first deposit for a holder.
  perform 1 from public.group_funds where id = p_fund_id for update;
  if not found then
    raise exception 'Fund not found';
  end if;

  if not exists (
    select 1 from public.group_fund_members
    where fund_id = p_fund_id and user_id = p_holder_id and role in ('owner', 'admin')
  ) then
    raise exception 'Choose the fund owner or a co-owner';
  end if;

  select full_name into v_holder_name from public.profiles where id = p_holder_id;

  if p_payment_mode = 'cash' then
    update public.group_fund_balances
    set cash_balance = coalesce(cash_balance, 0) + p_amount, updated_at = now()
    where fund_id = p_fund_id and user_id = p_holder_id;
  else
    update public.group_fund_balances
    set online_balance = coalesce(online_balance, 0) + p_amount, updated_at = now()
    where fund_id = p_fund_id and user_id = p_holder_id;
  end if;

  if not found then
    insert into public.group_fund_balances
      (fund_id, user_id, cash_balance, online_balance, updated_at)
    values
      (p_fund_id, p_holder_id,
       case when p_payment_mode = 'cash' then p_amount else 0 end,
       case when p_payment_mode = 'online' then p_amount else 0 end,
       now());
  end if;

  insert into public.group_fund_transactions
    (fund_id, type, amount, reason, category, added_by, holder_id, payment_mode, created_at)
  values
    (p_fund_id, 'deposit', p_amount,
     'Deposit to ' || coalesce(nullif(v_holder_name, ''), 'holder') ||
       case when v_reason is null then '' else ': ' || v_reason end,
     'other', v_caller_id, p_holder_id, p_payment_mode, v_created_at);
end;
$$;

revoke all on function public.deposit_group_fund(uuid, uuid, numeric, text, text, date) from public;
revoke all on function public.deposit_group_fund(uuid, uuid, numeric, text, text, date) from anon;
grant execute on function public.deposit_group_fund(uuid, uuid, numeric, text, text, date) to authenticated;
notify pgrst, 'reload schema';
