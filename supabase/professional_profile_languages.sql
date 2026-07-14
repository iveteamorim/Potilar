alter table public.profiles
add column if not exists languages text[] not null default array['Português']::text[];

notify pgrst, 'reload schema';
