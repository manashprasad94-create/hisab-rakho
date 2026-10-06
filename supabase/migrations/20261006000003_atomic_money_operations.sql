-- Apply this migration with the app changes that call these functions.
create or replace function public.spend_group_fund(
  p_fund_id uuid,
  p_amount numeric,
  p_reason text,
  p_category text,
  p_payment_mode text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid := auth.uid();
begin
  if v_caller_id is null or not exists (
    select 1 from public.group_fund_members
    where fund_id = p_fund_id and user_id = v_caller_id and role in ('owner', 'admin')
  ) then
    raise exception 'Only a fund holder can add an expense' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'Amount must be positive with at most two decimal places';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'Enter what the money was spent on';
  end if;
  if p_payment_mode is null or p_payment_mode not in ('cash', 'online') then
    raise exception 'Choose cash or online';
  end if;

  -- Deposit uses the same fund lock. This keeps deposits and expenses ordered.
  perform 1 from public.group_funds where id = p_fund_id for update;
  if not found then
    raise exception 'Fund not found';
  end if;

  if p_payment_mode = 'cash' then
    update public.group_fund_balances
    set cash_balance = cash_balance - p_amount, updated_at = now()
    where fund_id = p_fund_id and user_id = v_caller_id
      and cash_balance >= p_amount;
  else
    update public.group_fund_balances
    set online_balance = online_balance - p_amount, updated_at = now()
    where fund_id = p_fund_id and user_id = v_caller_id
      and online_balance >= p_amount;
  end if;
  if not found then
    raise exception 'Insufficient balance for this payment type';
  end if;

  insert into public.group_fund_transactions
    (fund_id, type, amount, reason, category, added_by, holder_id, payment_mode)
  values
    (p_fund_id, 'expense', p_amount, btrim(p_reason), p_category,
     v_caller_id, v_caller_id, p_payment_mode);
end;
$$;

revoke all on function public.spend_group_fund(uuid, numeric, text, text, text) from public;
revoke all on function public.spend_group_fund(uuid, numeric, text, text, text) from anon;
grant execute on function public.spend_group_fund(uuid, numeric, text, text, text) to authenticated;

create or replace function public.confirm_friend_payment(p_payment_record_id uuid)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid := auth.uid();
  v_payment public.payment_records%rowtype;
  v_transaction public.friend_transactions%rowtype;
  v_remaining numeric;
begin
  if v_caller_id is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into v_payment from public.payment_records
  where id = p_payment_record_id for update;
  if not found or coalesce(v_payment.confirmed, false) or coalesce(v_payment.rejected, false) then
    raise exception 'Payment is missing or already handled';
  end if;

  select * into v_transaction from public.friend_transactions
  where id = v_payment.transaction_id for update;
  if not found or v_transaction.payer_id <> v_caller_id
     or v_payment.paid_by <> v_transaction.payee_id then
    raise exception 'You cannot confirm this payment' using errcode = '42501';
  end if;
  if v_payment.amount is null or v_payment.amount <= 0
     or v_payment.amount > v_transaction.remaining_amount
     or v_transaction.status not in ('pending', 'partially_paid') then
    raise exception 'Payment exceeds the remaining balance or transaction is closed';
  end if;

  v_remaining := v_transaction.remaining_amount - v_payment.amount;
  update public.friend_transactions
  set remaining_amount = v_remaining,
      status = case when v_remaining = 0 then 'settled' else 'partially_paid' end,
      updated_at = now()
  where id = v_transaction.id;

  update public.payment_records
  set confirmed = true, confirmed_at = now()
  where id = p_payment_record_id;

  return v_payment.amount;
end;
$$;

revoke all on function public.confirm_friend_payment(uuid) from public;
revoke all on function public.confirm_friend_payment(uuid) from anon;
grant execute on function public.confirm_friend_payment(uuid) to authenticated;
notify pgrst, 'reload schema';
