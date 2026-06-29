insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'stylist-photos',
  'stylist-photos',
  true,
  10485760,
  null
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload stylist photos" on storage.objects;
drop policy if exists "Admins can update stylist photos" on storage.objects;
drop policy if exists "Admins can delete stylist photos" on storage.objects;

create policy "Admins can upload stylist photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'stylist-photos' and private.is_admin());

create policy "Admins can update stylist photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'stylist-photos' and private.is_admin())
with check (bucket_id = 'stylist-photos' and private.is_admin());

create policy "Admins can delete stylist photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'stylist-photos' and private.is_admin());
