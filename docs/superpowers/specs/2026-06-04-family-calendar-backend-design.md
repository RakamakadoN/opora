# Backend-First Family Calendar Design

## Context

Opora already supports multiple child profiles in `ProfileContext`, child switching in the tracker, medication plans, food logs, reactions, medical bookings, parent tasks, and government queue records. The current data is mostly stored through local React state and `localStorage`, with an authenticated Express server and Postgres bootstrap schema available for production persistence.

The new "Многодетная семья" feature should become a real family scheduling subsystem, not just a local UI filter. It must support several children, shared family events, recurring tasks, server-side notification readiness, and fast movement between child medical cards within one authenticated session.

## Goal

Create a backend-first architecture for a unified family profile and "Семейный календарь" where tasks, appointments, medicine reminders, queues, and notifications are grouped by child and can also apply to the whole family.

## Scope

This design covers the production-oriented data model, API surface, recurrence behavior, notification job model, and first UI placement. It intentionally keeps actual push delivery as a separate integration step, because real Web Push, SMS, or mobile push requires channel credentials, permission flows, service worker/mobile setup, delivery retries, and monitoring.

The first implementation should still be useful without external delivery providers: it stores notification preferences and scheduled jobs, shows server-ready statuses in the UI, and supports manual/recurring calendar events.

## Architecture

Add the family calendar as a server-backed subsystem behind the existing cookie session. The frontend reads and writes calendar data through API routes, while existing local tracker data can continue working during migration.

Core entities:

- `families`: one family workspace owned by a parent user.
- `family_members`: users connected to a family with roles such as owner, parent, caregiver, or doctor-viewer.
- `children`: children belonging to a family. Existing local profile IDs can be preserved as `local_child_id` during migration.
- `family_calendar_events`: canonical event records for manual and system-sourced calendar items.
- `family_event_assignments`: links an event to one child, many children, or no child for whole-family events.
- `family_recurrence_rules`: repeat rules for daily, weekly, monthly, and interval-based occurrences.
- `family_recurrence_exceptions`: skipped or moved occurrences.
- `family_event_occurrence_states`: per-occurrence completion or cancellation state for recurring events.
- `family_notification_preferences`: family-level and per-child notification settings.
- `family_notification_jobs`: backend queue rows for planned notification attempts.

## Data Model

`families`:

- `id`
- `owner_user_id`
- `display_name`
- `created_at`
- `updated_at`

`family_members`:

- `id`
- `family_id`
- `user_id`
- `role`: `owner | parent | caregiver | doctor_viewer`
- `created_at`

`children` additions:

- `family_id`
- `color_token`
- keep `local_child_id`, `name`, `age_years`, `diagnostic_status`, `city`

`family_calendar_events`:

- `id`
- `family_id`
- `title`
- `description`
- `event_type`: `medicine | appointment | queue | therapy | school | documents | home | family | other`
- `source`: `manual | medication_plan | medical_booking | government_queue | parent_task`
- `source_id`
- `starts_at`
- `ends_at`
- `all_day`
- `status`: `scheduled | completed | cancelled`
- `created_by_user_id`
- `created_at`
- `updated_at`

`family_event_assignments`:

- `event_id`
- `child_id`

`family_recurrence_rules`:

- `event_id`
- `frequency`: `daily | weekly | monthly`
- `interval_count`
- `weekdays`
- `month_day`
- `starts_on`
- `ends_on`

`family_recurrence_exceptions`:

- `id`
- `event_id`
- `occurrence_date`
- `action`: `skip | move`
- `moved_starts_at`
- `moved_ends_at`

`family_event_occurrence_states`:

- `id`
- `event_id`
- `occurrence_date`
- `status`: `completed | cancelled`
- `completed_by_user_id`
- `completed_at`

`family_notification_preferences`:

- `id`
- `family_id`
- `child_id`
- `channel`: `web_push | email | sms | in_app`
- `enabled`
- `minutes_before`
- `quiet_hours_start`
- `quiet_hours_end`
- `recipient_user_id`

`family_notification_jobs`:

- `id`
- `family_id`
- `event_id`
- `occurrence_starts_at`
- `deliver_at`
- `channel`
- `status`: `scheduled | sent | failed | cancelled`
- `attempt_count`
- `last_error`
- `created_at`
- `updated_at`

## API

All family calendar endpoints require the current authenticated user.

- `GET /api/family-calendar?from=&to=` returns expanded occurrences for the user's active family.
- `POST /api/family-calendar/events` creates a manual event, optional child assignments, recurrence rule, notification jobs.
- `PATCH /api/family-calendar/events/:id` updates event data and rebuilds future notification jobs.
- `DELETE /api/family-calendar/events/:id` soft-cancels the event and cancels future notification jobs.
- `POST /api/family-calendar/events/:id/complete` marks a single event or occurrence complete through `family_event_occurrence_states`.
- `POST /api/family-calendar/events/:id/exceptions` skips or moves one occurrence.
- `GET /api/family-calendar/notification-preferences` returns family notification settings.
- `PATCH /api/family-calendar/notification-preferences` updates settings and recalculates affected future jobs.

API responses use frontend-friendly camelCase. Database rows remain snake_case.

## Calendar Event Sources

There are two classes of calendar items.

Manual events are created and edited directly in the family calendar. Examples: kindergarten, therapy, documents, home routines, school calls, family reminders.

System events are calendar views of existing app records. Examples: medication plans, medical bookings, government queue records, parent tasks. They can appear in the family calendar, but their source details are edited in the original section. Tapping a system event should deep-link to the relevant tracker view or medical card.

## Recurrence

Recurrence expansion happens on the server for API responses. The database stores the base event plus recurrence rule; `GET /api/family-calendar` expands only the requested date range.

Supported first-version patterns:

- daily with interval;
- weekly with selected weekdays;
- monthly by day of month;
- optional end date;
- skipped occurrence;
- moved occurrence.

The recurrence engine should live in a pure library module so it can be unit-tested without Express or React.

## Notifications

The system stores notification preferences and creates backend jobs, but actual channel delivery is outside this feature's first implementation.

When an event is created or updated, the server creates `family_notification_jobs` for future occurrences in a bounded horizon, such as the next 60 days. Jobs are marked `scheduled` until a delivery worker exists. If a channel is enabled but not configured, the UI shows "Нужна настройка канала"; otherwise it shows "Запланировано на сервере".

This avoids pretending that push is already active while still giving the database and API a real production path.

## User Experience

Add a `Семья` mode inside `CareTrackerTab`, near the existing `День`, `Лек.`, `Еда`, `Очереди`, and `Отчет` modes.

The family view contains:

- segmented child switcher: `Вся семья`, then each child with a stable color dot;
- compact month calendar with colored event markers per child;
- selected-day agenda grouped by time and child;
- event cards with title, time, child badges, source, recurrence label, and notification status;
- create/edit panel with title, type, child assignment, date/time, repeat rule, notification lead time, and note.

Medical child switching should reuse the same active child concept. Moving between child medical cards must not require logging out, changing role, or leaving the current session.

## Error Handling

The API rejects events without a title or valid start date. Child assignments must belong to the user's family. Recurrence rules are validated before saving. Date range queries are capped to prevent large expansions. Notification jobs are rebuilt only for future occurrences; past jobs remain audit history.

If the backend is unavailable in local development, the UI can show a non-destructive error state and continue to display existing local tracker sections.

## Security

Every query is scoped by the authenticated user's family membership. A doctor can only see child calendar details if the existing doctor access flow grants full access or a future family member role explicitly allows it. Notification preferences must not expose other users' contact details to unauthorized members.

## Migration

The first implementation can create a default family for each authenticated parent on demand. Existing `ProfileContext` child profiles should be mapped by `local_child_id` so calendar events can reference the current child IDs without losing local data.

Longer-term migration can move medication plans, medical bookings, queues, and parent tasks into server tables or normalized system-event adapters.

## Testing

Add unit tests for:

- recurrence expansion for daily, weekly, monthly, end date, skipped occurrence, and moved occurrence;
- calendar aggregation of manual and system events;
- notification job generation within the bounded horizon;
- family access checks for child assignments;
- API CRUD for event creation, update, cancellation, and notification preferences.

Run `npm run lint` and manually verify the UI with multiple children, colored calendar markers, recurring event creation, notification status display, and fast medical card switching.

## Out Of Scope

- Actual Web Push, SMS, email, or mobile push delivery.
- Full migration of all local tracker data into normalized server tables.
- Calendar sharing outside authenticated family membership.
- Complex recurrence rules such as yearly dates, nth weekday of month, or timezone-specific daylight-saving edge cases beyond standard ISO timestamp handling.
