-- Opora MVP database shape for Supabase/Postgres.
-- The app must not expose child medical data to a doctor until parent confirmation.

create type app_role as enum ('parent', 'doctor', 'admin');
create type care_request_status as enum (
  'parent_requested',
  'doctor_accepted',
  'first_consult_done',
  'full_access',
  'declined'
);
create type audit_action as enum (
  'request_created',
  'booking_created',
  'doctor_accepted',
  'first_consult_done',
  'parent_confirmed_access',
  'request_declined',
  'document_viewed'
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  role app_role not null,
  full_name text not null,
  city text,
  created_at timestamptz not null default now()
);

create table children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  age_years int not null check (age_years between 0 and 18),
  diagnostic_status text not null,
  city text,
  created_at timestamptz not null default now()
);

create table doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  display_name text not null,
  title text,
  city text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table sensory_passports (
  child_id uuid primary key references children(id) on delete cascade,
  sound_sensitivity jsonb not null default '[]'::jsonb,
  light_sensitivity jsonb not null default '[]'::jsonb,
  tactile_sensitivity jsonb not null default '[]'::jsonb,
  communication_style text,
  comfort_triggers text,
  favorite_reward text,
  updated_at timestamptz not null default now()
);

create table doctor_care_requests (
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

create table child_progress_entries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  entry_type text not null,
  title text not null,
  details text,
  tags jsonb not null default '[]'::jsonb,
  energy int check (energy between 1 and 5),
  created_at timestamptz not null default now()
);

create table diary_entries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table access_audit_logs (
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

-- Core access rule for app code and RLS policies:
-- A doctor can read full child documentation only when an active request exists
-- with status = 'full_access'. Before that, the doctor can read only the request
-- envelope needed for the first consultation.
create index doctor_care_requests_child_status_idx
  on doctor_care_requests(child_id, status);

create index access_audit_logs_child_created_idx
  on access_audit_logs(child_id, created_at desc);
