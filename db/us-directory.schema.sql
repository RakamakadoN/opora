-- Opora US live directory schema.
-- Works for Railway Postgres / Neon / vanilla Postgres.

create table if not exists us_directory_sources (
  id text primary key,
  label text not null,
  url text not null,
  update_policy text not null,
  last_synced_at timestamptz
);

create table if not exists us_directory_providers (
  id bigint primary key,
  npi text unique,
  name text not null,
  category text,
  type text not null check (type in ('doctor', 'center', 'org', 'gov', 'friendly')),
  title text,
  description text not null,
  country text not null default 'US',
  state text,
  city text,
  address text,
  phone text,
  website text,
  source_kind text not null default 'npi',
  source_label text not null,
  source_url text not null,
  last_verified date,
  verification_status text not null default 'needs_review' check (verification_status in ('verified', 'needs_review')),
  parent_confirmed boolean not null default false,
  needs_review boolean not null default true,
  confidence_score numeric(4, 3) not null default 0.680,
  tags text[] not null default '{}',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists us_directory_providers_state_idx on us_directory_providers (state);
create index if not exists us_directory_providers_status_idx on us_directory_providers (verification_status);
create index if not exists us_directory_providers_tags_gin_idx on us_directory_providers using gin (tags);
create index if not exists us_directory_providers_search_idx
  on us_directory_providers using gin (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(city, '') || ' ' || coalesce(address, ''))
  );

create table if not exists us_clinical_trials (
  id text primary key,
  title text not null,
  status text,
  phases text[] not null default '{}',
  conditions text[] not null default '{}',
  country text,
  state text,
  city text,
  source_label text not null,
  source_url text not null,
  last_verified date,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists us_treatment_approaches (
  id text primary key,
  title text not null,
  summary text not null,
  caveat text not null,
  source text not null,
  source_url text not null,
  last_verified date,
  updated_at timestamptz not null default now()
);
