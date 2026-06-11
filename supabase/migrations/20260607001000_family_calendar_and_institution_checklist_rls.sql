drop policy if exists families_select_member on families;
drop policy if exists families_insert_owner on families;
drop policy if exists families_update_owner on families;
drop policy if exists families_delete_owner on families;

drop policy if exists family_members_select_owner_or_self on family_members;
drop policy if exists family_members_insert_owner on family_members;
drop policy if exists family_members_update_owner on family_members;
drop policy if exists family_members_delete_owner on family_members;

drop policy if exists children_select_family_member on children;
drop policy if exists children_insert_family_staff on children;
drop policy if exists children_update_family_staff on children;
drop policy if exists children_delete_family_staff on children;

drop policy if exists family_calendar_events_select_family_member on family_calendar_events;
drop policy if exists family_calendar_events_insert_family_staff on family_calendar_events;
drop policy if exists family_calendar_events_update_family_staff on family_calendar_events;
drop policy if exists family_calendar_events_delete_family_staff on family_calendar_events;

drop policy if exists family_event_assignments_select_family_member on family_event_assignments;
drop policy if exists family_event_assignments_insert_family_staff on family_event_assignments;
drop policy if exists family_event_assignments_update_family_staff on family_event_assignments;
drop policy if exists family_event_assignments_delete_family_staff on family_event_assignments;

drop policy if exists family_recurrence_rules_select_family_member on family_recurrence_rules;
drop policy if exists family_recurrence_rules_insert_family_staff on family_recurrence_rules;
drop policy if exists family_recurrence_rules_update_family_staff on family_recurrence_rules;
drop policy if exists family_recurrence_rules_delete_family_staff on family_recurrence_rules;

drop policy if exists family_recurrence_exceptions_select_family_member on family_recurrence_exceptions;
drop policy if exists family_recurrence_exceptions_insert_family_staff on family_recurrence_exceptions;
drop policy if exists family_recurrence_exceptions_update_family_staff on family_recurrence_exceptions;
drop policy if exists family_recurrence_exceptions_delete_family_staff on family_recurrence_exceptions;

drop policy if exists family_event_occurrence_states_select_family_member on family_event_occurrence_states;
drop policy if exists family_event_occurrence_states_insert_family_staff on family_event_occurrence_states;
drop policy if exists family_event_occurrence_states_update_family_staff on family_event_occurrence_states;
drop policy if exists family_event_occurrence_states_delete_family_staff on family_event_occurrence_states;

drop policy if exists family_notification_preferences_select_owner_or_self on family_notification_preferences;
drop policy if exists family_notification_preferences_insert_owner_or_self on family_notification_preferences;
drop policy if exists family_notification_preferences_update_owner_or_self on family_notification_preferences;
drop policy if exists family_notification_preferences_delete_owner_or_self on family_notification_preferences;

drop policy if exists family_notification_jobs_select_family_member on family_notification_jobs;
drop policy if exists family_notification_jobs_insert_family_staff on family_notification_jobs;
drop policy if exists family_notification_jobs_update_family_staff on family_notification_jobs;
drop policy if exists family_notification_jobs_delete_family_staff on family_notification_jobs;

drop policy if exists institution_guides_public_read on institution_guides;
drop policy if exists institution_guide_documents_public_read on institution_guide_documents;

drop policy if exists institution_checklist_progress_select_own on institution_checklist_progress;
drop policy if exists institution_checklist_progress_insert_own on institution_checklist_progress;
drop policy if exists institution_checklist_progress_update_own on institution_checklist_progress;
drop policy if exists institution_checklist_progress_delete_own on institution_checklist_progress;

create policy families_select_member
on families
for select
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = families.id
      and fm.user_id = (select auth.uid())
  )
);

create policy families_insert_owner
on families
for insert
to authenticated
with check ((select auth.uid()) = owner_user_id);

create policy families_update_owner
on families
for update
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = families.id
      and fm.user_id = (select auth.uid())
      and fm.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from family_members fm
    where fm.family_id = families.id
      and fm.user_id = (select auth.uid())
      and fm.role = 'owner'
  )
);

create policy families_delete_owner
on families
for delete
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = families.id
      and fm.user_id = (select auth.uid())
      and fm.role = 'owner'
  )
);

create policy family_members_select_owner_or_self
on family_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from families f
    where f.id = family_members.family_id
      and f.owner_user_id = (select auth.uid())
  )
);

create policy family_members_insert_owner
on family_members
for insert
to authenticated
with check (
  exists (
    select 1
    from families f
    where f.id = family_members.family_id
      and f.owner_user_id = (select auth.uid())
  )
);

create policy family_members_update_owner
on family_members
for update
to authenticated
using (
  exists (
    select 1
    from families f
    where f.id = family_members.family_id
      and f.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from families f
    where f.id = family_members.family_id
      and f.owner_user_id = (select auth.uid())
  )
);

create policy family_members_delete_owner
on family_members
for delete
to authenticated
using (
  exists (
    select 1
    from families f
    where f.id = family_members.family_id
      and f.owner_user_id = (select auth.uid())
  )
);

create policy children_select_family_member
on children
for select
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = children.family_id
      and fm.user_id = (select auth.uid())
  )
);

create policy children_insert_family_staff
on children
for insert
to authenticated
with check (
  exists (
    select 1
    from family_members fm
    where fm.family_id = children.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy children_update_family_staff
on children
for update
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = children.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
)
with check (
  exists (
    select 1
    from family_members fm
    where fm.family_id = children.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy children_delete_family_staff
on children
for delete
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = children.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_calendar_events_select_family_member
on family_calendar_events
for select
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = family_calendar_events.family_id
      and fm.user_id = (select auth.uid())
  )
);

create policy family_calendar_events_insert_family_staff
on family_calendar_events
for insert
to authenticated
with check (
  created_by_user_id = (select auth.uid())
  and exists (
    select 1
    from family_members fm
    where fm.family_id = family_calendar_events.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_calendar_events_update_family_staff
on family_calendar_events
for update
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = family_calendar_events.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
)
with check (
  exists (
    select 1
    from family_members fm
    where fm.family_id = family_calendar_events.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_calendar_events_delete_family_staff
on family_calendar_events
for delete
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = family_calendar_events.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_event_assignments_select_family_member
on family_event_assignments
for select
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_event_assignments.event_id
      and fm.user_id = (select auth.uid())
  )
);

create policy family_event_assignments_insert_family_staff
on family_event_assignments
for insert
to authenticated
with check (
  exists (
    select 1
    from family_calendar_events e
    join children c on c.id = family_event_assignments.child_id
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_event_assignments.event_id
      and c.family_id = e.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_event_assignments_update_family_staff
on family_event_assignments
for update
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_event_assignments.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
)
with check (
  exists (
    select 1
    from family_calendar_events e
    join children c on c.id = family_event_assignments.child_id
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_event_assignments.event_id
      and c.family_id = e.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_event_assignments_delete_family_staff
on family_event_assignments
for delete
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_event_assignments.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_recurrence_rules_select_family_member
on family_recurrence_rules
for select
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_recurrence_rules.event_id
      and fm.user_id = (select auth.uid())
  )
);

create policy family_recurrence_rules_insert_family_staff
on family_recurrence_rules
for insert
to authenticated
with check (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_recurrence_rules.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_recurrence_rules_update_family_staff
on family_recurrence_rules
for update
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_recurrence_rules.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
)
with check (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_recurrence_rules.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_recurrence_rules_delete_family_staff
on family_recurrence_rules
for delete
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_recurrence_rules.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_recurrence_exceptions_select_family_member
on family_recurrence_exceptions
for select
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_recurrence_exceptions.event_id
      and fm.user_id = (select auth.uid())
  )
);

create policy family_recurrence_exceptions_insert_family_staff
on family_recurrence_exceptions
for insert
to authenticated
with check (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_recurrence_exceptions.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_recurrence_exceptions_update_family_staff
on family_recurrence_exceptions
for update
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_recurrence_exceptions.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
)
with check (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_recurrence_exceptions.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_recurrence_exceptions_delete_family_staff
on family_recurrence_exceptions
for delete
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_recurrence_exceptions.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_event_occurrence_states_select_family_member
on family_event_occurrence_states
for select
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_event_occurrence_states.event_id
      and fm.user_id = (select auth.uid())
  )
);

create policy family_event_occurrence_states_insert_family_staff
on family_event_occurrence_states
for insert
to authenticated
with check (
  completed_by_user_id = (select auth.uid())
  and exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_event_occurrence_states.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_event_occurrence_states_update_family_staff
on family_event_occurrence_states
for update
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_event_occurrence_states.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
)
with check (
  completed_by_user_id = (select auth.uid())
  and exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_event_occurrence_states.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_event_occurrence_states_delete_family_staff
on family_event_occurrence_states
for delete
to authenticated
using (
  exists (
    select 1
    from family_calendar_events e
    join family_members fm on fm.family_id = e.family_id
    where e.id = family_event_occurrence_states.event_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_notification_preferences_select_owner_or_self
on family_notification_preferences
for select
to authenticated
using (
  recipient_user_id = (select auth.uid())
  or exists (
    select 1
    from families f
    where f.id = family_notification_preferences.family_id
      and f.owner_user_id = (select auth.uid())
  )
);

create policy family_notification_preferences_insert_owner_or_self
on family_notification_preferences
for insert
to authenticated
with check (
  recipient_user_id = (select auth.uid())
  or exists (
    select 1
    from families f
    where f.id = family_notification_preferences.family_id
      and f.owner_user_id = (select auth.uid())
  )
);

create policy family_notification_preferences_update_owner_or_self
on family_notification_preferences
for update
to authenticated
using (
  recipient_user_id = (select auth.uid())
  or exists (
    select 1
    from families f
    where f.id = family_notification_preferences.family_id
      and f.owner_user_id = (select auth.uid())
  )
)
with check (
  recipient_user_id = (select auth.uid())
  or exists (
    select 1
    from families f
    where f.id = family_notification_preferences.family_id
      and f.owner_user_id = (select auth.uid())
  )
);

create policy family_notification_preferences_delete_owner_or_self
on family_notification_preferences
for delete
to authenticated
using (
  recipient_user_id = (select auth.uid())
  or exists (
    select 1
    from families f
    where f.id = family_notification_preferences.family_id
      and f.owner_user_id = (select auth.uid())
  )
);

create policy family_notification_jobs_select_family_member
on family_notification_jobs
for select
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = family_notification_jobs.family_id
      and fm.user_id = (select auth.uid())
  )
);

create policy family_notification_jobs_insert_family_staff
on family_notification_jobs
for insert
to authenticated
with check (
  exists (
    select 1
    from family_members fm
    where fm.family_id = family_notification_jobs.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_notification_jobs_update_family_staff
on family_notification_jobs
for update
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = family_notification_jobs.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
)
with check (
  exists (
    select 1
    from family_members fm
    where fm.family_id = family_notification_jobs.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy family_notification_jobs_delete_family_staff
on family_notification_jobs
for delete
to authenticated
using (
  exists (
    select 1
    from family_members fm
    where fm.family_id = family_notification_jobs.family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('owner', 'parent', 'caregiver')
  )
);

create policy institution_guides_public_read
on institution_guides
for select
to anon, authenticated
using (true);

create policy institution_guide_documents_public_read
on institution_guide_documents
for select
to anon, authenticated
using (true);

create policy institution_checklist_progress_select_own
on institution_checklist_progress
for select
to authenticated
using (user_id = (select auth.uid()));

create policy institution_checklist_progress_insert_own
on institution_checklist_progress
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy institution_checklist_progress_update_own
on institution_checklist_progress
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy institution_checklist_progress_delete_own
on institution_checklist_progress
for delete
to authenticated
using (user_id = (select auth.uid()));
