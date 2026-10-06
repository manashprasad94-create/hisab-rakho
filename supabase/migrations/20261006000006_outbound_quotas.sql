create table if not exists public.outbound_rate_limits (
  user_id uuid not null,
  channel text not null,
  window_start timestamptz not null,
  sent_count integer not null default 0,
  primary key (user_id, channel, window_start)
);

alter table public.outbound_rate_limits enable row level security;
revoke all on public.outbound_rate_limits from anon, authenticated;

create or replace function public.claim_outbound_quota(
  p_user_id uuid,
  p_channel text,
  p_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_user_id is null or p_channel not in ('notification', 'reminder', 'ocr') or
     p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'Invalid quota request';
  end if;

  insert into public.outbound_rate_limits (user_id, channel, window_start, sent_count)
  values (p_user_id, p_channel, date_trunc('hour', now()), 1)
  on conflict (user_id, channel, window_start)
  do update set sent_count = public.outbound_rate_limits.sent_count + 1
  where public.outbound_rate_limits.sent_count < p_limit
  returning sent_count into v_count;

  return v_count is not null;
end;
$$;

revoke all on function public.claim_outbound_quota(uuid, text, integer) from public;
revoke all on function public.claim_outbound_quota(uuid, text, integer) from anon, authenticated;
grant execute on function public.claim_outbound_quota(uuid, text, integer) to service_role;
