alter table public.profiles
add column if not exists profile_image_url text,
add column if not exists banner_image_url text;

insert into storage.buckets (id, name, public)
values ('professional-profile-images', 'professional-profile-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Professional profile images are public" on storage.objects;
create policy "Professional profile images are public"
on storage.objects for select
using (bucket_id = 'professional-profile-images');

drop policy if exists "Users can upload own professional profile images" on storage.objects;
create policy "Users can upload own professional profile images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'professional-profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update own professional profile images" on storage.objects;
create policy "Users can update own professional profile images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'professional-profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'professional-profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own professional profile images" on storage.objects;
create policy "Users can delete own professional profile images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'professional-profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

notify pgrst, 'reload schema';
