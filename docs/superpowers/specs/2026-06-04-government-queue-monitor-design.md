# Government Queue Monitor Design

## Context

Opora is a React/Vite mobile-style web app for parents. The existing `CareTrackerTab` already groups family reminders, medication schedules, food logs, and doctor-facing reports. The queue monitor will be added as a new section inside this tracker instead of becoming a new bottom navigation tab.

## Goal

Add a parent-facing "Очереди" section where users can track government service appointments or queue numbers, attach an institution address, open a route in maps, and receive local reminder/status prompts.

## Scope

The first implementation is a local MVP. It does not call real government APIs. It keeps the data model API-ready by separating deterministic reminder logic from UI and storage, so a future API adapter can update queue status without changing the screen.

## User Experience

The tracker gets a fifth segmented view: "Очереди". In this view a parent can:

- choose a child profile;
- add a service record with service title, institution name, address, appointment date/time, queue number, and optional note;
- see active records ordered by urgency;
- mark a record as completed or delete it;
- open a route to the institution address through a maps web URL;
- see inline reminder/status labels such as "Визит завтра", "Визит сегодня", and "Очередь подошла".

## Data Model

Add `GovernmentQueueRecord` to `ProfileContext`:

- `id`
- `childId`
- `childName`
- `serviceTitle`
- `institutionName`
- `institutionAddress`
- `appointmentAt`
- `queueNumber`
- `currentQueueNumber`
- `status`: `waiting | soon | ready | completed | cancelled`
- `note`
- `lastNotifiedAt`
- `createdAt`
- `updatedAt`

Records are persisted in `localStorage` under `opora_government_queue_records`.

## Business Logic

Create `src/lib/governmentQueueMonitor.ts` with pure functions:

- `getGovernmentQueueStatus(record, now)` returns the current derived status.
- `getGovernmentQueueReminder(record, now)` returns one reminder message or `null`.
- `sortGovernmentQueueRecords(records, now)` orders ready/soon/upcoming records first.
- `buildMapsRouteUrl(address)` returns a URL for opening a route/search in maps.

Reminder rules:

- If the record is completed or cancelled, return no reminder.
- If `currentQueueNumber` is greater than or equal to `queueNumber`, status is `ready` and reminder is "Очередь подошла".
- If appointment is tomorrow, reminder is "Визит завтра".
- If appointment is today, reminder is "Визит сегодня".
- Otherwise the record remains `waiting`.

## Background Updates

Because the project is a browser React app, the background task is implemented as an in-app timer while the session is open. `CareTrackerTab` runs a periodic check for queue records and updates derived statuses. The pure monitor function is intentionally API-ready: a future `checkGovernmentQueueStatus(record)` adapter can fetch from a real endpoint and then reuse the same status/reminder logic.

Notifications are shown inline in the tracker for this MVP. Browser push notifications are out of scope because they require user permission, service worker setup, and production HTTPS behavior.

## Error Handling

Invalid or incomplete form fields prevent record creation. Missing address disables the route action. Invalid dates are treated as waiting records and do not produce reminders.

## Testing

Add Node tests for the pure monitor logic:

- queue is ready when current queue number reaches the user's number;
- tomorrow and today appointment reminders are produced correctly;
- completed/cancelled records do not produce reminders;
- records are sorted by urgency and appointment time;
- map URLs include the encoded institution address.

## Future API Integration

Future work can add an optional external provider field and a server endpoint that updates `currentQueueNumber` or official status. The UI should not depend on the provider shape; it should only consume normalized `GovernmentQueueRecord` data.
