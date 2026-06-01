export const POSTGRES_SCHEMA_SQL = `
create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('parent', 'doctor', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'care_request_status') then
    create type care_request_status as enum (
      'parent_requested',
      'doctor_accepted',
      'first_consult_done',
      'full_access',
      'declined'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'audit_action') then
    create type audit_action as enum (
      'request_created',
      'booking_created',
      'doctor_accepted',
      'first_consult_done',
      'parent_confirmed_access',
      'request_declined',
      'document_viewed'
    );
  end if;
end $$;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  role app_role not null,
  full_name text not null,
  city text,
  created_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role app_role not null default 'parent',
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists user_profile_state (
  user_id uuid primary key references app_users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references profiles(id) on delete cascade,
  local_child_id text unique,
  name text not null,
  age_years int not null default 0 check (age_years between 0 and 18),
  diagnostic_status text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  external_id bigint unique,
  display_name text not null,
  title text,
  city text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists sensory_passports (
  child_id uuid primary key references children(id) on delete cascade,
  sound_sensitivity jsonb not null default '[]'::jsonb,
  light_sensitivity jsonb not null default '[]'::jsonb,
  tactile_sensitivity jsonb not null default '[]'::jsonb,
  communication_style text,
  comfort_triggers text,
  favorite_reward text,
  updated_at timestamptz not null default now()
);

create table if not exists doctor_care_requests (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  child_name text not null,
  child_age int not null default 0,
  parent_id uuid references profiles(id) on delete set null,
  doctor_id uuid references doctors(id) on delete set null,
  doctor_external_id bigint,
  doctor_name text not null,
  doctor_title text,
  doctor_city text,
  status care_request_status not null default 'parent_requested',
  parent_note text,
  requested_at timestamptz not null default now(),
  doctor_accepted_at timestamptz,
  first_consult_at timestamptz,
  parent_confirmed_at timestamptz
);

create table if not exists access_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  actor_role app_role not null,
  actor_name text not null,
  action audit_action not null,
  child_id text not null,
  doctor_id uuid references doctors(id) on delete set null,
  doctor_external_id bigint,
  request_id uuid references doctor_care_requests(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists child_progress_entries (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  entry_type text not null,
  title text not null,
  details text,
  tags jsonb not null default '[]'::jsonb,
  energy int check (energy between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists diary_entries (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  content text not null,
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists kz_directory_places (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  city text not null,
  title text,
  description text,
  address text,
  phone text,
  website text,
  source_url text,
  source_label text not null default 'Google Places · требует проверки родителей',
  verification_status text not null default 'needs_review',
  tags jsonb not null default '[]'::jsonb,
  place_type text not null default 'center',
  rating numeric,
  rating_count int not null default 0,
  confidence_score numeric not null default 0.45,
  parent_confirmed_count int not null default 0,
  complaint_count int not null default 0,
  last_checked_at timestamptz not null default now(),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doctor_care_requests_child_status_idx
  on doctor_care_requests(child_id, status);

create index if not exists doctor_care_requests_requested_idx
  on doctor_care_requests(requested_at desc);

create index if not exists access_audit_logs_child_created_idx
  on access_audit_logs(child_id, created_at desc);

create index if not exists auth_sessions_user_expires_idx
  on auth_sessions(user_id, expires_at desc);

create index if not exists auth_sessions_token_hash_idx
  on auth_sessions(token_hash);

create index if not exists kz_directory_places_city_status_idx
  on kz_directory_places(city, verification_status);

create index if not exists kz_directory_places_tags_gin_idx
  on kz_directory_places using gin(tags);

create index if not exists kz_directory_places_search_idx
  on kz_directory_places using gin(
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(city, '') || ' ' || coalesce(address, '') || ' ' || coalesce(description, ''))
  );

alter table if exists public.app_users enable row level security;
alter table if exists public.auth_sessions enable row level security;
alter table if exists public.user_profile_state enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.children enable row level security;
alter table if exists public.doctors enable row level security;
alter table if exists public.sensory_passports enable row level security;
alter table if exists public.doctor_care_requests enable row level security;
alter table if exists public.access_audit_logs enable row level security;
alter table if exists public.child_progress_entries enable row level security;
alter table if exists public.diary_entries enable row level security;
alter table if exists public.kz_directory_places enable row level security;
`;
