-- Backfill seguro para anuncios antigos sem data de vencimento.
-- Execute depois de green_block_migrations.sql / add_payment_lifecycle_fields.sql.
--
-- Regra Potilar:
-- - Temporada: 60 dias
-- - Compra / Aluguel / outros: 90 dias
-- A contagem usa payment_confirmed_at quando existe; caso contrario, updated_at;
-- se updated_at tambem estiver vazio, usa created_at.

begin;

update public.listings
set
  listing_expires_at =
    coalesce(payment_confirmed_at, updated_at, created_at, now())
    + case
      when transaction = 'Temporada' then interval '60 days'
      else interval '90 days'
    end,
  updated_at = now()
where status = 'approved'
  and listing_expires_at is null;

-- Backfill para destaques antigos confirmados que ficaram sem datas.
-- Mantem compatibilidade com os destaques ja vendidos:
-- - 7_days: 7 dias
-- - 30_days / super_30_days / outros: 30 dias
update public.listings
set
  featured_starts_at = coalesce(featured_starts_at, payment_confirmed_at, updated_at, created_at, now()),
  featured_expires_at =
    coalesce(featured_starts_at, payment_confirmed_at, updated_at, created_at, now())
    + case
      when featured_plan = '7_days' then interval '7 days'
      else interval '30 days'
    end,
  updated_at = now()
where featured_payment_status = 'confirmed'
  and featured_plan is not null
  and (featured_starts_at is null or featured_expires_at is null);

commit;

-- Conferencia rapida:
-- select id, title, transaction, status, listing_expires_at, featured_plan, featured_payment_status, featured_expires_at
-- from public.listings
-- order by created_at desc
-- limit 20;
