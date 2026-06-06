-- Permite que o anunciante pause, reative ou exclua os proprios anuncios.
-- Execute no Supabase SQL Editor (projeto Potilar).

grant usage on schema public to authenticated;

create or replace function public.owner_pause_listing(listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set
    status = 'paused',
    updated_at = now()
  where id = listing_id
    and owner_id = auth.uid();

  if not found then
    raise exception 'Anuncio nao encontrado ou sem permissao';
  end if;
end;
$$;

create or replace function public.owner_reactivate_listing(listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_row record;
  next_status text;
begin
  select id, is_paid, payment_status
  into listing_row
  from public.listings
  where id = listing_id
    and owner_id = auth.uid();

  if not found then
    raise exception 'Anuncio nao encontrado ou sem permissao';
  end if;

  next_status := case
    when listing_row.is_paid and listing_row.payment_status <> 'confirmed' then 'pending'
    else 'approved'
  end;

  update public.listings
  set
    status = next_status,
    updated_at = now()
  where id = listing_id
    and owner_id = auth.uid();
end;
$$;

create or replace function public.owner_delete_listing(listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.listings
  where id = listing_id
    and owner_id = auth.uid();

  if not found then
    raise exception 'Anuncio nao encontrado ou sem permissao';
  end if;
end;
$$;

grant execute on function public.owner_pause_listing(uuid) to authenticated;
grant execute on function public.owner_reactivate_listing(uuid) to authenticated;
grant execute on function public.owner_delete_listing(uuid) to authenticated;
