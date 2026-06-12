create extension if not exists pgcrypto;

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references app_users(id) on delete cascade,
  display_name text not null default 'Семья',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists children add column if not exists family_id uuid;
alter table if exists children add column if not exists color_token text;
alter table if exists children alter column age_years set default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'children_family_id_fkey'
  ) then
    alter table children
      add constraint children_family_id_fkey
      foreign key (family_id) references families(id) on delete cascade;
  end if;
end $$;

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  role text not null check (role in ('owner', 'parent', 'caregiver', 'doctor_viewer')),
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table if not exists family_calendar_events (
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

create table if not exists family_event_assignments (
  event_id uuid not null references family_calendar_events(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  primary key (event_id, child_id)
);

create table if not exists family_recurrence_rules (
  event_id uuid primary key references family_calendar_events(id) on delete cascade,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  interval_count int not null default 1 check (interval_count between 1 and 365),
  weekdays jsonb not null default '[]'::jsonb,
  month_day int check (month_day between 1 and 31),
  starts_on date not null,
  ends_on date
);

create table if not exists family_recurrence_exceptions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references family_calendar_events(id) on delete cascade,
  occurrence_date date not null,
  action text not null check (action in ('skip', 'move')),
  moved_starts_at timestamptz,
  moved_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists family_event_occurrence_states (
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

create table if not exists family_notification_preferences (
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

create table if not exists family_notification_jobs (
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

create table if not exists institution_guides (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('pmpk', 'mse', 'social_protection', 'egov_csc', 'education_department', 'clinic_vkk')),
  region_code text not null,
  city text not null,
  district text,
  address text,
  phone text,
  website text,
  source_url text,
  source_label text not null default 'Источник требует проверки',
  verified_at timestamptz,
  service_area_population int check (service_area_population is null or service_area_population >= 0),
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists institution_guide_documents (
  id text primary key,
  institution_id text references institution_guides(id) on delete cascade,
  institution_kind text not null check (institution_kind in ('pmpk', 'mse', 'social_protection', 'egov_csc', 'education_department', 'clinic_vkk')),
  stage text not null check (stage in ('medical_preparation', 'pmpk_route', 'mse_review', 'benefits_services', 'education_route', 'appeals')),
  title text not null,
  description text not null,
  required boolean not null default true,
  source text not null,
  sort_order int not null default 0,
  applies_to_diagnostic_statuses jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists institution_checklist_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete cascade,
  local_child_id text not null,
  institution_id text not null references institution_guides(id) on delete cascade,
  document_id text not null references institution_guide_documents(id) on delete cascade,
  checked boolean not null default false,
  note text,
  updated_at timestamptz not null default now(),
  unique (user_id, local_child_id, institution_id, document_id)
);

create index if not exists family_members_user_idx on family_members(user_id);
create index if not exists families_owner_user_idx on families(owner_user_id);
create index if not exists children_family_idx on children(family_id);
create index if not exists family_calendar_events_family_starts_idx on family_calendar_events(family_id, starts_at);
create index if not exists family_calendar_events_created_by_idx on family_calendar_events(created_by_user_id);
create index if not exists family_event_assignments_child_idx on family_event_assignments(child_id);
create index if not exists family_recurrence_exceptions_event_idx on family_recurrence_exceptions(event_id);
create index if not exists family_event_occurrence_states_completed_by_idx on family_event_occurrence_states(completed_by_user_id);
create index if not exists family_notification_preferences_family_idx on family_notification_preferences(family_id);
create index if not exists family_notification_preferences_child_idx on family_notification_preferences(child_id);
create index if not exists family_notification_preferences_recipient_idx on family_notification_preferences(recipient_user_id);
create index if not exists family_notification_jobs_family_idx on family_notification_jobs(family_id);
create index if not exists family_notification_jobs_event_idx on family_notification_jobs(event_id);
create index if not exists family_notification_jobs_due_idx on family_notification_jobs(status, deliver_at);
create index if not exists institution_guides_kind_city_idx on institution_guides(kind, city, region_code);
create index if not exists institution_guides_tags_gin_idx on institution_guides using gin(tags);
create index if not exists institution_guides_search_idx on institution_guides using gin(
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(city, '') || ' ' || coalesce(district, '') || ' ' || coalesce(address, ''))
);
create index if not exists institution_guide_documents_kind_stage_idx on institution_guide_documents(institution_kind, stage, sort_order);
create index if not exists institution_guide_documents_institution_idx on institution_guide_documents(institution_id, sort_order);
create index if not exists institution_checklist_progress_user_child_idx on institution_checklist_progress(user_id, local_child_id, institution_id);

alter table if exists public.children enable row level security;
alter table if exists public.families enable row level security;
alter table if exists public.family_members enable row level security;
alter table if exists public.family_calendar_events enable row level security;
alter table if exists public.family_event_assignments enable row level security;
alter table if exists public.family_recurrence_rules enable row level security;
alter table if exists public.family_recurrence_exceptions enable row level security;
alter table if exists public.family_event_occurrence_states enable row level security;
alter table if exists public.family_notification_preferences enable row level security;
alter table if exists public.family_notification_jobs enable row level security;
alter table if exists public.institution_guides enable row level security;
alter table if exists public.institution_guide_documents enable row level security;
alter table if exists public.institution_checklist_progress enable row level security;
