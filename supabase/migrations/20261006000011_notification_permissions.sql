create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.notifications set read = true
  where id = p_notification_id and user_id = auth.uid();
  if not found then
    raise exception 'Notification not found' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;
revoke update on public.notifications from anon, authenticated;
notify pgrst, 'reload schema';
