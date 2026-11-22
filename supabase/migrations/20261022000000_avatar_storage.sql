-- Create the avatars bucket (public so URLs work without signed tokens)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,   -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop old policies if they exist so we can recreate cleanly
drop policy if exists "Avatar upload: owner only"      on storage.objects;
drop policy if exists "Avatar update: owner only"      on storage.objects;
drop policy if exists "Avatar delete: owner only"      on storage.objects;
drop policy if exists "Avatar read: public"            on storage.objects;

-- Allow any authenticated user to INSERT into the avatars bucket
-- but only under their own user-id folder  (path starts with auth.uid()/)
create policy "Avatar upload: owner only"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow the owner to UPDATE (overwrite) their own avatar
create policy "Avatar update: owner only"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow the owner to DELETE their own avatar
create policy "Avatar delete: owner only"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone (including anonymous) to read/view avatars
-- (bucket is public, so URLs work without auth headers)
create policy "Avatar read: public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');
