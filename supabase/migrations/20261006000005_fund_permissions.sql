create or replace function public.create_group_fund_atomic(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid := auth.uid();
  v_fund_id uuid;
begin
  if v_caller_id is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if nullif(btrim(p_name), '') is null or length(p_name) > 100 then
    raise exception 'Enter a fund name of 100 characters or fewer';
  end if;

  insert into public.group_funds (name, created_by)
  values (btrim(p_name), v_caller_id)
  returning id into v_fund_id;

  insert into public.group_fund_members (fund_id, user_id, role)
  values (v_fund_id, v_caller_id, 'owner');
  return v_fund_id;
end;
$$;

create or replace function public.add_group_fund_member(
  p_fund_id uuid,
  p_email text,
  p_role text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid := auth.uid();
  v_target_id uuid;
  v_member_id uuid;
begin
  if v_caller_id is null or not exists (
    select 1 from public.group_fund_members
    where fund_id = p_fund_id and user_id = v_caller_id and role = 'owner'
  ) then
    raise exception 'Only the fund owner can add members' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('admin', 'member') then
    raise exception 'Choose co-owner or member';
  end if;
  if nullif(btrim(p_email), '') is null then
    raise exception 'Enter a member email';
  end if;

  perform 1 from public.group_funds where id = p_fund_id for update;
  if not found then
    raise exception 'Fund not found';
  end if;
  select id into v_target_id from public.profiles
  where lower(email) = lower(btrim(p_email));
  if v_target_id is null then
    raise exception 'No registered user found with this email';
  end if;
  if exists (
    select 1 from public.group_fund_members
    where fund_id = p_fund_id and user_id = v_target_id
  ) then
    raise exception 'This user is already a member';
  end if;

  insert into public.group_fund_members (fund_id, user_id, role)
  values (p_fund_id, v_target_id, p_role)
  returning id into v_member_id;
  return v_member_id;
end;
$$;

revoke all on function public.create_group_fund_atomic(text) from public;
revoke all on function public.create_group_fund_atomic(text) from anon;
grant execute on function public.create_group_fund_atomic(text) to authenticated;
revoke all on function public.add_group_fund_member(uuid, text, text) from public;
revoke all on function public.add_group_fund_member(uuid, text, text) from anon;
grant execute on function public.add_group_fund_member(uuid, text, text) to authenticated;

-- Browser clients can read according to RLS, but cannot alter the fund ledger
-- or membership tables directly. The checked functions above and in the prior
-- migrations make those changes with the caller's auth.uid().
revoke insert, update, delete on public.group_funds from anon, authenticated;
revoke insert, update, delete on public.group_fund_members from anon, authenticated;
revoke insert, update, delete on public.group_fund_balances from anon, authenticated;
revoke insert, update, delete on public.group_fund_transactions from anon, authenticated;
revoke insert, delete on public.notifications from anon, authenticated;
notify pgrst, 'reload schema';
