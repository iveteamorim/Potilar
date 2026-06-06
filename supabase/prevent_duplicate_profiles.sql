alter table public.profiles
add column if not exists email text;

create unique index if not exists profiles_email_unique_idx
on public.profiles (lower(email))
where email is not null and length(trim(email)) > 0;

create unique index if not exists profiles_phone_unique_idx
on public.profiles (regexp_replace(phone, '\D', '', 'g'))
where phone is not null and length(regexp_replace(phone, '\D', '', 'g')) > 0;

create unique index if not exists profiles_advertiser_document_unique_idx
on public.profiles (regexp_replace(advertiser_document, '\D', '', 'g'))
where advertiser_document is not null and length(regexp_replace(advertiser_document, '\D', '', 'g')) > 0;

create or replace function public.profile_contact_exists(
  candidate_email text,
  candidate_phone text,
  candidate_document text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where (
      candidate_email is not null
      and length(trim(candidate_email)) > 0
      and email is not null
      and lower(email) = lower(trim(candidate_email))
    )
    or (
      candidate_phone is not null
      and length(regexp_replace(candidate_phone, '\D', '', 'g')) > 0
      and regexp_replace(phone, '\D', '', 'g') = regexp_replace(candidate_phone, '\D', '', 'g')
    )
    or (
      candidate_document is not null
      and length(regexp_replace(candidate_document, '\D', '', 'g')) > 0
      and regexp_replace(advertiser_document, '\D', '', 'g') = regexp_replace(candidate_document, '\D', '', 'g')
    )
  );
$$;

grant execute on function public.profile_contact_exists(text, text, text) to anon, authenticated;
