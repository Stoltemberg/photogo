-- =============================================================================
-- PhotoGo — Complete Database Schema
-- =============================================================================
-- Run this in Supabase SQL Editor (after creating the project)
-- Idempotent — safe to re-run

-- =============================================================================
-- 1. user_profiles
-- =============================================================================
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  public_display_name text,
  avatar_url text,
  phone text,
  location text,
  bio text,
  account_type text default 'pf' check (account_type in ('pf', 'mei', 'pj')),
  tax_id text,
  business_name text,
  payout_provider text default 'mercado_pago' check (payout_provider in ('system', 'stripe_connect', 'mercado_pago')),
  mercado_pago_account_id text,

  -- Notification preferences
  email_new_sales boolean default true,
  email_new_reviews boolean default true,
  email_marketing boolean default false,
  push_notifications boolean default true,

  -- Privacy
  profile_public boolean default true,
  show_sales_stats boolean default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_account_type on public.user_profiles(account_type);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    id,
    full_name,
    account_type,
    tax_id
  )
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'account_type', 'pf'),
    new.raw_user_meta_data->>'tax_id'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- 2. subscription_plans
-- =============================================================================
create table if not exists public.subscription_plans (
  id text primary key, -- 'free' | 'pro' | 'studio'
  name text not null,
  description text,
  price_monthly_cents integer not null default 0,
  commission_rate numeric(5,2) not null default 6.00,
  max_photos integer default 50,
  features jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

insert into public.subscription_plans (id, name, description, price_monthly_cents, commission_rate, max_photos, features) values
  ('free', 'Free', 'Para começar a vender sem custo', 0, 6.00, 50,
   '["Até 50 fotos no portfólio", "Comissão de 6% por venda", "Painel de vendas", "Pagamento via Pix"]'::jsonb),
  ('pro', 'Pro', 'Para fotógrafos em crescimento', 1690, 4.50, 500,
   '["Até 500 fotos no portfólio", "Comissão reduzida de 4,5%", "Página de fotógrafo personalizada", "Estatísticas avançadas", "Pagamento via Pix e cartão", "Suporte prioritário"]'::jsonb),
  ('studio', 'Studio', 'Para estúdios e profissionais', 4990, 2.00, -1,
   '["Fotos ilimitadas no portfólio", "Comissão mínima de 2%", "Página personalizada + domínio próprio", "Estatísticas em tempo real", "Múltiplos usuários da equipe", "API de integração", "Suporte dedicado 24/7"]'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_monthly_cents = excluded.price_monthly_cents,
  commission_rate = excluded.commission_rate,
  max_photos = excluded.max_photos,
  features = excluded.features;

-- =============================================================================
-- 3. user_subscriptions
-- =============================================================================
create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id) default 'free',
  status text default 'active' check (status in ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start timestamptz default now(),
  current_period_end timestamptz default now() + interval '30 days',
  cancel_at_period_end boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_subscriptions_status on public.user_subscriptions(status);

-- Auto-create subscription for new users
create or replace function public.handle_new_user_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_subscriptions (user_id, plan_id, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sub on auth.users;
create trigger on_auth_user_created_sub
  after insert on auth.users
  for each row execute function public.handle_new_user_subscription();

-- =============================================================================
-- 4. photos
-- =============================================================================
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references auth.users(id) on delete cascade,
  title text,                          -- private, never exposed publicly
  description text,                    -- private
  price numeric(10,2) not null check (price >= 0),
  category text,
  image_url text not null,
  thumbnail_url text,
  width integer,
  height integer,
  file_size_mb numeric(8,2),
  exif jsonb,
  location jsonb,
  status text default 'active' check (status in ('active', 'archived', 'sold_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_photos_photographer on public.photos(photographer_id);
create index if not exists idx_photos_status on public.photos(status);
create index if not exists idx_photos_category on public.photos(category);

-- =============================================================================
-- 5. albums
-- =============================================================================
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  cover_photo_id uuid references public.photos(id) on delete set null,
  share_token text unique default encode(gen_random_bytes(16), 'hex'),
  is_public boolean default false,
  price_per_photo numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_albums_photographer on public.albums(photographer_id);
create index if not exists idx_albums_share_token on public.albums(share_token);
create index if not exists idx_albums_is_public on public.albums(is_public) where is_public = true;

-- =============================================================================
-- 6. album_photos
-- =============================================================================
create table if not exists public.album_photos (
  album_id uuid not null references public.albums(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (album_id, photo_id)
);

create index if not exists idx_album_photos_album on public.album_photos(album_id);
create index if not exists idx_album_photos_photo on public.album_photos(photo_id);

-- =============================================================================
-- 7. sales (lightweight version — full ledger lives in Spree backend)
-- =============================================================================
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references auth.users(id) on delete cascade,
  photo_id uuid references public.photos(id) on delete set null,
  photo_title text,                    -- denormalized snapshot
  buyer_email text,
  amount numeric(10,2) not null,
  license_type text default 'personal' check (license_type in ('personal', 'editorial', 'commercial', 'extended', 'exclusive')),
  status text default 'pending' check (status in ('pending', 'paid', 'refunded', 'cancelled')),
  spree_order_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_photographer on public.sales(photographer_id);
create index if not exists idx_sales_status on public.sales(status);

-- =============================================================================
-- 8. RLS Policies
-- =============================================================================

-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.photos enable row level security;
alter table public.albums enable row level security;
alter table public.album_photos enable row level security;
alter table public.sales enable row level security;

-- USER PROFILES
drop policy if exists "profiles_select_own" on public.user_profiles;
drop policy if exists "profiles_select_public" on public.user_profiles;
drop policy if exists "profiles_insert_own" on public.user_profiles;
drop policy if exists "profiles_update_own" on public.user_profiles;
drop policy if exists "profiles_delete_own" on public.user_profiles;

create policy "profiles_select_own" on public.user_profiles
  for select using (auth.uid() = id);

create policy "profiles_select_public" on public.user_profiles
  for select using (profile_public = true);

create policy "profiles_insert_own" on public.user_profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.user_profiles
  for update using (auth.uid() = id);

create policy "profiles_delete_own" on public.user_profiles
  for delete using (auth.uid() = id);

-- SUBSCRIPTION PLANS (public read, no writes from client)
drop policy if exists "plans_select_all" on public.subscription_plans;
create policy "plans_select_all" on public.subscription_plans
  for select using (true);

-- USER SUBSCRIPTIONS
drop policy if exists "subs_select_own" on public.user_subscriptions;
drop policy if exists "subs_insert_own" on public.user_subscriptions;
drop policy if exists "subs_update_own" on public.user_subscriptions;

create policy "subs_select_own" on public.user_subscriptions
  for select using (auth.uid() = user_id);

create policy "subs_insert_own" on public.user_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "subs_update_own" on public.user_subscriptions
  for update using (auth.uid() = user_id);

-- PHOTOS
drop policy if exists "photos_select_own" on public.photos;
drop policy if exists "photos_select_via_album" on public.photos;
drop policy if exists "photos_insert_own" on public.photos;
drop policy if exists "photos_update_own" on public.photos;
drop policy if exists "photos_delete_own" on public.photos;

create policy "photos_select_own" on public.photos
  for select using (auth.uid() = photographer_id);

create policy "photos_select_via_album" on public.photos
  for select using (
    exists (
      select 1 from public.album_photos ap
      join public.albums a on a.id = ap.album_id
      where ap.photo_id = photos.id
        and a.is_public = true
    )
  );

create policy "photos_insert_own" on public.photos
  for insert with check (auth.uid() = photographer_id);

create policy "photos_update_own" on public.photos
  for update using (auth.uid() = photographer_id);

create policy "photos_delete_own" on public.photos
  for delete using (auth.uid() = photographer_id);

-- ALBUMS
drop policy if exists "albums_select_own" on public.albums;
drop policy if exists "albums_select_public" on public.albums;
drop policy if exists "albums_insert_own" on public.albums;
drop policy if exists "albums_update_own" on public.albums;
drop policy if exists "albums_delete_own" on public.albums;

create policy "albums_select_own" on public.albums
  for select using (auth.uid() = photographer_id);

create policy "albums_select_public" on public.albums
  for select using (is_public = true);

create policy "albums_insert_own" on public.albums
  for insert with check (auth.uid() = photographer_id);

create policy "albums_update_own" on public.albums
  for update using (auth.uid() = photographer_id);

create policy "albums_delete_own" on public.albums
  for delete using (auth.uid() = photographer_id);

-- ALBUM_PHOTOS
drop policy if exists "album_photos_select" on public.album_photos;
drop policy if exists "album_photos_insert_own" on public.album_photos;
drop policy if exists "album_photos_delete_own" on public.album_photos;

create policy "album_photos_select" on public.album_photos
  for select using (
    exists (
      select 1 from public.albums a
      where a.id = album_photos.album_id
        and (a.photographer_id = auth.uid() or a.is_public = true)
    )
  );

create policy "album_photos_insert_own" on public.album_photos
  for insert with check (
    exists (
      select 1 from public.albums a
      where a.id = album_photos.album_id
        and a.photographer_id = auth.uid()
    )
  );

create policy "album_photos_delete_own" on public.album_photos
  for delete using (
    exists (
      select 1 from public.albums a
      where a.id = album_photos.album_id
        and a.photographer_id = auth.uid()
    )
  );

-- SALES (photographer can read own; inserts via service_role only)
drop policy if exists "sales_select_own" on public.sales;
create policy "sales_select_own" on public.sales
  for select using (auth.uid() = photographer_id);

-- =============================================================================
-- 9. updated_at trigger
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_profiles_updated_at on public.user_profiles;
create trigger user_profiles_updated_at before update on public.user_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists photos_updated_at on public.photos;
create trigger photos_updated_at before update on public.photos
  for each row execute function public.set_updated_at();

drop trigger if exists albums_updated_at on public.albums;
create trigger albums_updated_at before update on public.albums
  for each row execute function public.set_updated_at();

drop trigger if exists user_subscriptions_updated_at on public.user_subscriptions;
create trigger user_subscriptions_updated_at before update on public.user_subscriptions
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 10. Storage buckets
-- =============================================================================
-- Run these in Supabase Storage UI (Database > Storage > Create bucket):
--
-- Bucket 1: "photos" (private)
--   - Used for photo uploads
--   - Path: {user_id}/{filename}
--   - Allowed MIME: image/*
--   - Max size: 50 MB
--
-- Bucket 2: "avatars" (public)
--   - Used for profile avatars
--   - Path: {user_id}/{filename}
--   - Allowed MIME: image/*
--   - Max size: 5 MB
--
-- Or via SQL:
-- insert into storage.buckets (id, name, public) values ('photos', 'photos', false);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
--
-- Storage policies (for bucket 'photos', private):
-- create policy "photos_select_own" on storage.objects for select using (
--   bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
-- );
-- create policy "photos_insert_own" on storage.objects for insert with check (
--   bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
-- );
-- create policy "photos_delete_own" on storage.objects for delete using (
--   bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
-- );
--
-- For bucket 'avatars' (public read):
-- create policy "avatars_select_public" on storage.objects for select using (bucket_id = 'avatars');
-- create policy "avatars_insert_own" on storage.objects for insert with check (
--   bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
-- );
-- create policy "avatars_update_own" on storage.objects for update using (
--   bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
-- );
-- create policy "avatars_delete_own" on storage.objects for delete using (
--   bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
-- );

-- =============================================================================
-- 11. Helper views
-- =============================================================================

-- Waitlist (early access signups from landing)
create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text default 'landing',
  user_agent text,
  ip_hash text,                          -- SHA-256 of IP for privacy
  converted_to_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_waitlist_created_at on public.waitlist_entries(created_at);

alter table public.waitlist_entries enable row level security;

drop policy if exists "waitlist_insert_anon" on public.waitlist_entries;
create policy "waitlist_insert_anon" on public.waitlist_entries
  for insert with check (true);

-- Photographer stats (for dashboard)
create or replace view public.v_photographer_stats
with (security_invoker = true) as
select
  p.photographer_id,
  count(distinct p.id) filter (where p.status = 'active') as total_photos,
  count(distinct a.id) as total_albums,
  count(distinct a.id) filter (where a.is_public) as public_albums,
  coalesce(sum(s.amount) filter (where s.status = 'paid'), 0) as total_revenue,
  count(s.id) filter (where s.status = 'paid') as total_sales
from public.photos p
left join public.albums a on a.photographer_id = p.photographer_id
left join public.sales s on s.photographer_id = p.photographer_id
group by p.photographer_id;

-- =============================================================================
-- DONE — verify with:
-- =============================================================================
-- select table_name from information_schema.tables
--   where table_schema = 'public'
--   order by table_name;
