-- Execute no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key,
  email text not null,
  clerk_user_id text unique,
  is_premium boolean not null default false,
  referral_code text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro','vip')),
  active boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(user_id)
);
create table if not exists public.tweak_states (
  user_id text primary key references public.users(id) on delete cascade,
  applied text[] not null default '{}',
  rip_mode_active boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.tweak_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  kind text not null,
  label text not null,
  detail text default '',
  applied_after text[] not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id text not null references public.users(id) on delete cascade,
  referred_user_id text unique references public.users(id) on delete set null,
  referral_code text not null,
  status text not null default 'registered' check (status in ('clicked','registered','qualified')),
  created_at timestamptz not null default now()
);
create index if not exists referrals_referrer_idx on public.referrals(referrer_id);

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.tweak_states enable row level security;
alter table public.tweak_events enable row level security;
alter table public.referrals enable row level security;
-- O backend usa a service role; nenhuma tabela fica exposta ao anon por padrão.
