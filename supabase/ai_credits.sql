create table if not exists public.ai_credit_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits integer not null default 0 check (credits >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('purchase', 'usage', 'bonus', 'refund')),
  amount integer not null,
  description text not null,
  payment_provider text,
  payment_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists ai_credit_transactions_payment_unique_idx
  on public.ai_credit_transactions (payment_provider, payment_id)
  where payment_provider is not null and payment_id is not null and type = 'purchase';

alter table public.ai_credit_balances enable row level security;
alter table public.ai_credit_transactions enable row level security;

drop policy if exists "Users can read own AI credit balance" on public.ai_credit_balances;
create policy "Users can read own AI credit balance"
  on public.ai_credit_balances for select
  using (auth.uid() = user_id);

drop policy if exists "Users can read own AI credit transactions" on public.ai_credit_transactions;
create policy "Users can read own AI credit transactions"
  on public.ai_credit_transactions for select
  using (auth.uid() = user_id);

create or replace function public.get_ai_credit_balance()
returns integer
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select credits from public.ai_credit_balances where user_id = auth.uid()),
    0
  );
$$;

create or replace function public.grant_ai_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text,
  p_payment_provider text default null,
  p_payment_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'Credit amount must be positive';
  end if;

  if p_payment_provider is not null and p_payment_id is not null then
    insert into public.ai_credit_transactions (
      user_id,
      type,
      amount,
      description,
      payment_provider,
      payment_id,
      metadata
    )
    values (
      p_user_id,
      'purchase',
      p_amount,
      p_description,
      p_payment_provider,
      p_payment_id,
      coalesce(p_metadata, '{}'::jsonb)
    )
    on conflict do nothing;

    if not found then
      select credits into next_balance from public.ai_credit_balances where user_id = p_user_id;
      return coalesce(next_balance, 0);
    end if;
  else
    insert into public.ai_credit_transactions (user_id, type, amount, description, metadata)
    values (p_user_id, 'bonus', p_amount, p_description, coalesce(p_metadata, '{}'::jsonb));
  end if;

  insert into public.ai_credit_balances (user_id, credits, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id)
  do update set
    credits = public.ai_credit_balances.credits + excluded.credits,
    updated_at = now()
  returning credits into next_balance;

  return next_balance;
end;
$$;

create or replace function public.consume_ai_credits(
  p_amount integer,
  p_description text,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  next_balance integer;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount <= 0 then
    raise exception 'Credit amount must be positive';
  end if;

  insert into public.ai_credit_balances (user_id, credits, updated_at)
  values (current_user_id, 0, now())
  on conflict (user_id) do nothing;

  update public.ai_credit_balances
  set credits = credits - p_amount,
      updated_at = now()
  where user_id = current_user_id
    and credits >= p_amount
  returning credits into next_balance;

  if next_balance is null then
    raise exception 'INSUFFICIENT_AI_CREDITS';
  end if;

  insert into public.ai_credit_transactions (user_id, type, amount, description, metadata)
  values (current_user_id, 'usage', -p_amount, p_description, coalesce(p_metadata, '{}'::jsonb));

  return next_balance;
end;
$$;

grant select on public.ai_credit_balances to authenticated;
grant select on public.ai_credit_transactions to authenticated;
grant execute on function public.get_ai_credit_balance() to authenticated;
grant execute on function public.consume_ai_credits(integer, text, jsonb) to authenticated;
grant execute on function public.grant_ai_credits(uuid, integer, text, text, text, jsonb) to service_role;

notify pgrst, 'reload schema';
