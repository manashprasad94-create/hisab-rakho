create or replace function public.create_friend_transaction(
  p_friend_id uuid, p_amount numeric, p_reason text, p_category text, p_direction text
)
returns public.friend_transactions
language plpgsql security definer set search_path = ''
as $$
declare
  v_caller_id uuid := auth.uid();
  v_transaction public.friend_transactions%rowtype;
begin
  if v_caller_id is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if p_friend_id is null or p_friend_id = v_caller_id or not exists (
    select 1 from public.profiles where id = p_friend_id
  ) then raise exception 'Choose another registered user'; end if;
  if p_direction is null or p_direction not in ('i_paid', 'they_paid') then raise exception 'Choose who paid'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'Enter a valid amount with at most two decimal places';
  end if;

  insert into public.friend_transactions
    (created_by, payer_id, payee_id, amount, remaining_amount, reason, category, status)
  values
    (v_caller_id,
     case when p_direction = 'i_paid' then v_caller_id else p_friend_id end,
     case when p_direction = 'i_paid' then p_friend_id else v_caller_id end,
     p_amount, p_amount, p_reason, p_category, 'pending_acceptance')
  returning * into v_transaction;
  return v_transaction;
end;
$$;

create or replace function public.edit_pending_friend_transaction(
  p_transaction_id uuid, p_amount numeric, p_reason text, p_category text
)
returns public.friend_transactions
language plpgsql security definer set search_path = ''
as $$
declare v_transaction public.friend_transactions%rowtype;
begin
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'Enter a valid amount with at most two decimal places';
  end if;
  update public.friend_transactions
  set amount = p_amount, remaining_amount = p_amount, reason = p_reason,
      category = p_category, updated_at = now()
  where id = p_transaction_id and created_by = auth.uid() and status = 'pending_acceptance'
  returning * into v_transaction;
  if not found then raise exception 'Only the creator can edit a pending request' using errcode = '42501'; end if;
  return v_transaction;
end;
$$;

create or replace function public.accept_friend_transaction(p_transaction_id uuid)
returns public.friend_transactions
language plpgsql security definer set search_path = ''
as $$
declare v_transaction public.friend_transactions%rowtype;
begin
  update public.friend_transactions
  set status = 'pending', updated_at = now()
  where id = p_transaction_id and status = 'pending_acceptance'
    and created_by <> auth.uid()
    and (payer_id = auth.uid() or payee_id = auth.uid())
  returning * into v_transaction;
  if not found then raise exception 'You cannot accept this request' using errcode = '42501'; end if;
  return v_transaction;
end;
$$;

create or replace function public.reject_friend_transaction(p_transaction_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_transaction public.friend_transactions%rowtype;
begin
  delete from public.friend_transactions
  where id = p_transaction_id and status = 'pending_acceptance'
    and created_by <> auth.uid()
    and (payer_id = auth.uid() or payee_id = auth.uid())
  returning * into v_transaction;
  if not found then raise exception 'You cannot reject this request' using errcode = '42501'; end if;
  return jsonb_build_object('created_by', v_transaction.created_by, 'amount', v_transaction.amount);
end;
$$;

create or replace function public.claim_friend_payment(p_transaction_id uuid, p_amount numeric)
returns public.payment_records
language plpgsql security definer set search_path = ''
as $$
declare
  v_transaction public.friend_transactions%rowtype;
  v_pending numeric;
  v_payment public.payment_records%rowtype;
begin
  select * into v_transaction from public.friend_transactions
  where id = p_transaction_id for update;
  if not found or v_transaction.payee_id <> auth.uid() or
     v_transaction.status not in ('pending', 'partially_paid') then
    raise exception 'You cannot claim payment for this transaction' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'Enter a valid payment amount';
  end if;
  select coalesce(sum(amount), 0) into v_pending from public.payment_records
  where transaction_id = p_transaction_id and confirmed = false and rejected = false;
  if p_amount > v_transaction.remaining_amount - v_pending then
    raise exception 'Payment exceeds the unclaimed balance';
  end if;

  insert into public.payment_records (transaction_id, paid_by, amount)
  values (p_transaction_id, auth.uid(), p_amount)
  returning * into v_payment;
  return v_payment;
end;
$$;

create or replace function public.reject_friend_payment(p_payment_record_id uuid)
returns public.payment_records
language plpgsql security definer set search_path = ''
as $$
declare
  v_payment public.payment_records%rowtype;
  v_transaction public.friend_transactions%rowtype;
begin
  select * into v_payment from public.payment_records
  where id = p_payment_record_id for update;
  if not found or coalesce(v_payment.confirmed, false) or coalesce(v_payment.rejected, false) then
    raise exception 'Payment is missing or already handled';
  end if;
  select * into v_transaction from public.friend_transactions
  where id = v_payment.transaction_id for update;
  if not found or v_transaction.payer_id <> auth.uid() then
    raise exception 'You cannot reject this payment' using errcode = '42501';
  end if;
  update public.payment_records
  set rejected = true, rejected_at = now()
  where id = p_payment_record_id
  returning * into v_payment;
  return v_payment;
end;
$$;

revoke all on function public.create_friend_transaction(uuid, numeric, text, text, text) from public, anon;
revoke all on function public.edit_pending_friend_transaction(uuid, numeric, text, text) from public, anon;
revoke all on function public.accept_friend_transaction(uuid) from public, anon;
revoke all on function public.reject_friend_transaction(uuid) from public, anon;
revoke all on function public.claim_friend_payment(uuid, numeric) from public, anon;
revoke all on function public.reject_friend_payment(uuid) from public, anon;
grant execute on function public.create_friend_transaction(uuid, numeric, text, text, text) to authenticated;
grant execute on function public.edit_pending_friend_transaction(uuid, numeric, text, text) to authenticated;
grant execute on function public.accept_friend_transaction(uuid) to authenticated;
grant execute on function public.reject_friend_transaction(uuid) to authenticated;
grant execute on function public.claim_friend_payment(uuid, numeric) to authenticated;
grant execute on function public.reject_friend_payment(uuid) to authenticated;

revoke insert, update, delete on public.friend_transactions from anon, authenticated;
revoke insert, update, delete on public.payment_records from anon, authenticated;
revoke insert, update, delete on public.group_expenses from anon, authenticated;
notify pgrst, 'reload schema';
