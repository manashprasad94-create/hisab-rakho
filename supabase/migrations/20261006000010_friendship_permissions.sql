create or replace function public.send_friend_request(p_friend_id uuid)
returns public.friendships
language plpgsql security definer set search_path = ''
as $$
declare
  v_caller_id uuid := auth.uid();
  v_friendship public.friendships%rowtype;
begin
  if v_caller_id is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if p_friend_id is null or p_friend_id = v_caller_id or not exists (
    select 1 from public.profiles where id = p_friend_id
  ) then raise exception 'Choose another registered user'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    least(v_caller_id, p_friend_id)::text || ':' || greatest(v_caller_id, p_friend_id)::text, 0
  ));
  if exists (
    select 1 from public.friendships
    where (user_a = v_caller_id and user_b = p_friend_id) or
          (user_a = p_friend_id and user_b = v_caller_id)
  ) then raise exception 'Friend request or friendship already exists'; end if;

  insert into public.friendships (user_a, user_b, status)
  values (v_caller_id, p_friend_id, 'pending')
  returning * into v_friendship;
  return v_friendship;
end;
$$;

create or replace function public.accept_friend_request(p_friendship_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.friendships set status = 'accepted'
  where id = p_friendship_id and user_b = auth.uid() and status = 'pending';
  if not found then raise exception 'You cannot accept this request' using errcode = '42501'; end if;
end;
$$;

create or replace function public.remove_friendship(p_friendship_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.friendships
  where id = p_friendship_id and (user_a = auth.uid() or user_b = auth.uid());
  if not found then raise exception 'You cannot remove this friendship' using errcode = '42501'; end if;
end;
$$;

create or replace function public.create_pending_invite(p_email text)
returns public.pending_invites
language plpgsql security definer set search_path = ''
as $$
declare v_invite public.pending_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if p_email is null or length(btrim(p_email)) > 254 or
     position('@' in p_email) < 2 then raise exception 'Enter a valid email'; end if;
  insert into public.pending_invites (invited_by, invited_email)
  values (auth.uid(), lower(btrim(p_email)))
  returning * into v_invite;
  return v_invite;
end;
$$;

revoke all on function public.send_friend_request(uuid) from public, anon;
revoke all on function public.accept_friend_request(uuid) from public, anon;
revoke all on function public.remove_friendship(uuid) from public, anon;
revoke all on function public.create_pending_invite(text) from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.remove_friendship(uuid) to authenticated;
grant execute on function public.create_pending_invite(text) to authenticated;
revoke insert, update, delete on public.friendships from anon, authenticated;
revoke insert, update, delete on public.pending_invites from anon, authenticated;
notify pgrst, 'reload schema';
