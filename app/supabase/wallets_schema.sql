-- ============================================================
-- CrossRemit: Wallet + Savings + Deposits Schema
-- ============================================================

-- INR Wallet
create table if not exists wallets_inr (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique not null references profiles(id) on delete cascade,
  balance    numeric(18,2) not null default 0 check (balance >= 0),
  updated_at timestamptz default now()
);

-- USD Wallet
create table if not exists wallets_usd (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique not null references profiles(id) on delete cascade,
  balance    numeric(18,6) not null default 0 check (balance >= 0),
  updated_at timestamptz default now()
);

-- Auto-create both wallets when profile is created
create or replace function create_wallets_for_profile() returns trigger language plpgsql as $$
begin
  insert into wallets_inr (user_id) values (new.id) on conflict do nothing;
  insert into wallets_usd (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_create_wallets on profiles;
create trigger trg_create_wallets
  after insert on profiles
  for each row execute function create_wallets_for_profile();

-- Backfill wallets for existing profiles
insert into wallets_inr (user_id)
  select id from profiles
  on conflict do nothing;

insert into wallets_usd (user_id)
  select id from profiles
  on conflict do nothing;

-- Deposits table
create table if not exists deposits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  amount         numeric(18,2) not null check (amount > 0),
  currency       text not null default 'INR',
  method         text not null check (method in ('upi','qr')),
  razorpay_ref   text,
  status         text not null default 'completed' check (status in ('pending','completed','failed')),
  created_at     timestamptz default now()
);

-- Savings table
create table if not exists savings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique not null references profiles(id) on delete cascade,
  balance      numeric(18,2) not null default 0 check (balance >= 0),
  updated_at   timestamptz default now()
);

-- Backfill savings for existing profiles
insert into savings (user_id)
  select id from profiles
  on conflict do nothing;

-- Auto-create savings when profile is created
create or replace function create_savings_for_profile() returns trigger language plpgsql as $$
begin
  insert into savings (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_create_savings on profiles;
create trigger trg_create_savings
  after insert on profiles
  for each row execute function create_savings_for_profile();

-- RLS
alter table wallets_inr enable row level security;
alter table wallets_usd enable row level security;
alter table deposits     enable row level security;
alter table savings      enable row level security;

create policy "wallets_inr_own" on wallets_inr for all using (user_id = auth.uid());
create policy "wallets_usd_own" on wallets_usd for all using (user_id = auth.uid());
create policy "deposits_own"    on deposits    for all using (user_id = auth.uid());
create policy "savings_own"     on savings     for all using (user_id = auth.uid());
