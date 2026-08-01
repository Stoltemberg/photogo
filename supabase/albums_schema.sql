-- =============================================================================
-- PhotoGo — Albums Schema
-- =============================================================================
-- Album = collection of photos curated by a photographer
-- Can be shared via unique share_token
-- Run this in Supabase SQL Editor

-- =============================================================================
-- 1. photos table — update to include photographer_id, name hidden from public
-- =============================================================================
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references auth.users(id) on delete cascade,
  title text,                          -- private, never exposed publicly
  description text,                    -- private
  price numeric(10,2) not null check (price >= 0),
  category text,
  image_url text not null,
  thumbnail_url text,                  -- optimized thumbnail for galleries
  width integer,
  height integer,
  file_size_mb numeric(8,2),
  exif jsonb,                          -- camera, lens, iso, etc.
  location jsonb,                      -- {name, lat, lng}
  status text default 'active' check (status in ('active', 'archived', 'sold_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_photos_photographer on public.photos(photographer_id);
create index idx_photos_status on public.photos(status);

-- =============================================================================
-- 2. albums table
-- =============================================================================
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  cover_photo_id uuid references public.photos(id) on delete set null,
  share_token text unique default encode(gen_random_bytes(16), 'hex'),
  is_public boolean default false,      -- if true, accessible via share_token
  price_per_photo numeric(10,2),       -- optional: override per-album pricing
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_albums_photographer on public.albums(photographer_id);
create index idx_albums_share_token on public.albums(share_token);

-- =============================================================================
-- 3. album_photos join table
-- =============================================================================
create table if not exists public.album_photos (
  album_id uuid not null references public.albums(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  position integer not null default 0,  -- ordering within album
  added_at timestamptz not null default now(),
  primary key (album_id, photo_id)
);

create index idx_album_photos_album on public.album_photos(album_id);
create index idx_album_photos_photo on public.album_photos(photo_id);

-- =============================================================================
-- 4. RLS Policies
-- =============================================================================

-- Enable RLS
alter table public.photos enable row level security;
alter table public.albums enable row level security;
alter table public.album_photos enable row level security;

-- PHOTOS POLICIES
-- Photographer can CRUD their own photos
create policy "photos_select_own" on public.photos
  for select using (auth.uid() = photographer_id);

-- Public can view photos IF they're in a shared public album
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

-- ALBUMS POLICIES
create policy "albums_select_own" on public.albums
  for select using (auth.uid() = photographer_id);

-- Public can view albums by share_token (we'll use a function for this)
create policy "albums_select_public" on public.albums
  for select using (is_public = true);

create policy "albums_insert_own" on public.albums
  for insert with check (auth.uid() = photographer_id);

create policy "albums_update_own" on public.albums
  for update using (auth.uid() = photographer_id);

create policy "albums_delete_own" on public.albums
  for delete using (auth.uid() = photographer_id);

-- ALBUM_PHOTOS POLICIES
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

-- =============================================================================
-- 5. Storage buckets
-- =============================================================================
-- Run in Supabase Storage UI:
-- - Create bucket 'photos' (private)
-- - Create bucket 'avatars' (public)
--   Path: {user_id}/{filename}
-- =============================================================================

-- =============================================================================
-- 6. Trigger: updated_at
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger photos_updated_at before update on public.photos
  for each row execute function public.set_updated_at();

create trigger albums_updated_at before update on public.albums
  for each row execute function public.set_updated_at();
