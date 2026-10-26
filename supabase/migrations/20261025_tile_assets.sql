-- Apply manually in a NEW/dedicated Supabase project after review.
-- Creates one single-operator table; no Supabase Auth/users/ownership fields.
begin;
create table public.tile_assets (
  id uuid primary key,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  storage_path text not null unique check (storage_path ~ '^tiles/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  source_filename text check (char_length(source_filename) <= 255),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size integer not null check (file_size > 0 and file_size <= 5000000),
  width_mm numeric(10,3) not null check (width_mm > 0 and width_mm <= 100000),
  height_mm numeric(10,3) not null check (height_mm > 0 and height_mm <= 100000),
  material_type text check (material_type in ('Ceramic','Porcelain','Marble','Natural Stone','Decorative')),
  finish text not null check (finish in ('polished','matte','satin','honed')),
  image_rotation integer not null default 0 check (image_rotation in (0,90,180,270)),
  crop_data jsonb check (crop_data is null or jsonb_typeof(crop_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tile_assets enable row level security;
revoke all on table public.tile_assets from public, anon, authenticated;
grant select, insert, delete on table public.tile_assets to service_role;
-- No anon/authenticated policies. Elevated secret/service_role is server-only.
-- This milestone exposes no update endpoint: immutable rows keep updated_at equal
-- to creation time; add an update trigger if a later milestone allows editing.
commit;
