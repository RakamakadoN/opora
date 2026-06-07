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
  family_id uuid,
  local_child_id text unique,
  name text not null,
  age_years int not null check (age_years between 0 and 18),
  diagnostic_status text not null,
  city text,
  color_token text,
  created_at timestamptz not null default now()
);

create table families (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references app_users(id) on delete cascade,
  display_name text not null default 'Семья',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table children
  add constraint children_family_id_fkey foreign key (family_id) references families(id) on delete cascade;

create table family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  role text not null check (role in ('owner', 'parent', 'caregiver', 'doctor_viewer')),
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table family_calendar_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  description text,
  event_type text not null check (event_type in ('medicine', 'appointment', 'queue', 'therapy', 'school', 'documents', 'home', 'family', 'other')),
  source text not null default 'manual' check (source in ('manual', 'medication_plan', 'medical_booking', 'government_queue', 'parent_task')),
  source_id text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_by_user_id uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table family_event_assignments (
  event_id uuid not null references family_calendar_events(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  primary key (event_id, child_id)
);

create table family_recurrence_rules (
  event_id uuid primary key references family_calendar_events(id) on delete cascade,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  interval_count int not null default 1 check (interval_count between 1 and 365),
  weekdays jsonb not null default '[]'::jsonb,
  month_day int check (month_day between 1 and 31),
  starts_on date not null,
  ends_on date
);

create table family_recurrence_exceptions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references family_calendar_events(id) on delete cascade,
  occurrence_date date not null,
  action text not null check (action in ('skip', 'move')),
  moved_starts_at timestamptz,
  moved_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table family_event_occurrence_states (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references family_calendar_events(id) on delete cascade,
  occurrence_date date not null,
  status text not null check (status in ('completed', 'cancelled')),
  completed_by_user_id uuid references app_users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, occurrence_date)
);

create table family_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid references children(id) on delete cascade,
  channel text not null check (channel in ('web_push', 'email', 'sms', 'in_app')),
  enabled boolean not null default true,
  minutes_before int not null default 30 check (minutes_before between 0 and 10080),
  quiet_hours_start time,
  quiet_hours_end time,
  recipient_user_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table family_notification_jobs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  event_id uuid not null references family_calendar_events(id) on delete cascade,
  occurrence_starts_at timestamptz not null,
  deliver_at timestamptz not null,
  channel text not null check (channel in ('web_push', 'email', 'sms', 'in_app')),
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'failed', 'cancelled')),
  attempt_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create index family_members_user_idx on family_members(user_id);
create index families_owner_user_idx on families(owner_user_id);
create index children_family_idx on children(family_id);
create index family_calendar_events_family_starts_idx on family_calendar_events(family_id, starts_at);
create index family_calendar_events_created_by_idx on family_calendar_events(created_by_user_id);
create index family_event_assignments_child_idx on family_event_assignments(child_id);
create index family_recurrence_exceptions_event_idx on family_recurrence_exceptions(event_id);
create index family_event_occurrence_states_completed_by_idx on family_event_occurrence_states(completed_by_user_id);
create index family_notification_preferences_family_idx on family_notification_preferences(family_id);
create index family_notification_preferences_child_idx on family_notification_preferences(child_id);
create index family_notification_preferences_recipient_idx on family_notification_preferences(recipient_user_id);
create index family_notification_jobs_family_idx on family_notification_jobs(family_id);
create index family_notification_jobs_event_idx on family_notification_jobs(event_id);
create index family_notification_jobs_due_idx on family_notification_jobs(status, deliver_at);
