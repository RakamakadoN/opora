# Backend Family Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a backend-first "Многодетная семья" family calendar with recurring events, child grouping, notification job readiness, and a family view inside the care tracker.

**Architecture:** Keep recurrence and notification scheduling in pure TypeScript helpers first, then add Postgres schema and authenticated Express API routes. The React app consumes the API through a focused calendar client and renders a new `Семья` mode inside `CareTrackerTab`, while existing tracker data remains available during migration.

**Tech Stack:** React 19, TypeScript, Express, Postgres via `pg`, Vite, lucide-react, Node built-in test runner with `tsx`, existing cookie auth and `ProfileContext`.

---

## File Structure

- Create `src/lib/familyCalendar.ts`: pure domain types, recurrence expansion, occurrence state merge, notification job planning, and child color helpers.
- Create `tests/familyCalendar.test.ts`: recurrence, occurrence state, notification job, and aggregation tests.
- Modify `db/postgres-schema.ts`: add backend-first family/calendar tables and indexes to `POSTGRES_SCHEMA_SQL`.
- Modify `db/railway-postgres.sql`: mirror the same schema for explicit Railway migrations.
- Modify `docs/postgres-schema.sql`: document the public Postgres shape for future Supabase/Railway setup.
- Modify `server.ts`: add family bootstrap helpers, family calendar row mappers, authenticated CRUD endpoints, recurrence expansion, notification preference endpoints, and local JSON fallback only where needed for development.
- Create `src/lib/familyCalendarApi.ts`: small frontend fetch client for calendar endpoints.
- Modify `src/context/ProfileContext.tsx`: expose active family calendar state and actions, then hydrate from the API while keeping existing local tracker state untouched.
- Modify `src/components/CareTrackerTab.tsx`: add `Семья` mode, child filter, month grid, selected-day agenda, create/edit form, and notification status display.

## Task 1: Pure Family Calendar Logic

**Files:**
- Create: `src/lib/familyCalendar.ts`
- Test: `tests/familyCalendar.test.ts`

- [ ] **Step 1: Write failing recurrence tests**

Create `tests/familyCalendar.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  expandFamilyEventOccurrences,
  generateNotificationJobs,
  getChildColorToken,
  mergeOccurrenceStates,
  type FamilyCalendarEvent,
  type FamilyNotificationPreference,
  type FamilyRecurrenceRule
} from "../src/lib/familyCalendar";

const baseEvent: FamilyCalendarEvent = {
  id: "event-1",
  familyId: "family-1",
  title: "Логопед",
  description: "Занятие",
  eventType: "therapy",
  source: "manual",
  sourceId: undefined,
  startsAt: "2026-06-04T09:00:00.000Z",
  endsAt: "2026-06-04T10:00:00.000Z",
  allDay: false,
  status: "scheduled",
  childIds: ["child-1"],
  createdByUserId: "user-1",
  createdAt: "2026-06-01T10:00:00.000Z",
  updatedAt: "2026-06-01T10:00:00.000Z"
};

test("expands daily recurrence inside requested range", () => {
  const rule: FamilyRecurrenceRule = {
    eventId: "event-1",
    frequency: "daily",
    intervalCount: 1,
    weekdays: [],
    startsOn: "2026-06-04",
    endsOn: "2026-06-06"
  };

  const occurrences = expandFamilyEventOccurrences({
    events: [baseEvent],
    recurrenceRules: [rule],
    exceptions: [],
    occurrenceStates: [],
    rangeStart: "2026-06-04T00:00:00.000Z",
    rangeEnd: "2026-06-08T00:00:00.000Z"
  });

  assert.deepEqual(occurrences.map(item => item.occurrenceDate), ["2026-06-04", "2026-06-05", "2026-06-06"]);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node --import tsx --test tests/familyCalendar.test.ts`

Expected: FAIL with module-not-found for `src/lib/familyCalendar.ts`.

- [ ] **Step 3: Implement types and daily recurrence**

Create `src/lib/familyCalendar.ts` with these exported types and minimal implementation:

```ts
export type FamilyEventType = "medicine" | "appointment" | "queue" | "therapy" | "school" | "documents" | "home" | "family" | "other";
export type FamilyEventSource = "manual" | "medication_plan" | "medical_booking" | "government_queue" | "parent_task";
export type FamilyEventStatus = "scheduled" | "completed" | "cancelled";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly";
export type RecurrenceExceptionAction = "skip" | "move";
export type NotificationChannel = "web_push" | "email" | "sms" | "in_app";
export type NotificationJobStatus = "scheduled" | "sent" | "failed" | "cancelled";

export type FamilyCalendarEvent = {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  eventType: FamilyEventType;
  source: FamilyEventSource;
  sourceId?: string;
  startsAt: string;
  endsAt?: string;
  allDay: boolean;
  status: FamilyEventStatus;
  childIds: string[];
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type FamilyRecurrenceRule = {
  eventId: string;
  frequency: RecurrenceFrequency;
  intervalCount: number;
  weekdays?: number[];
  monthDay?: number;
  startsOn: string;
  endsOn?: string;
};

export type FamilyRecurrenceException = {
  id: string;
  eventId: string;
  occurrenceDate: string;
  action: RecurrenceExceptionAction;
  movedStartsAt?: string;
  movedEndsAt?: string;
};

export type FamilyEventOccurrenceState = {
  id: string;
  eventId: string;
  occurrenceDate: string;
  status: "completed" | "cancelled";
  completedByUserId?: string;
  completedAt?: string;
};

export type FamilyCalendarOccurrence = FamilyCalendarEvent & {
  occurrenceId: string;
  occurrenceDate: string;
  occurrenceStartsAt: string;
  occurrenceEndsAt?: string;
  occurrenceStatus: FamilyEventStatus;
  recurrenceLabel?: string;
};
```

Implement `expandFamilyEventOccurrences` by iterating calendar dates from `rangeStart` to `rangeEnd`, matching daily rules by interval and `endsOn`, applying skip/move exceptions, and applying occurrence states.

- [ ] **Step 4: Add weekly, monthly, exception, state, color, and notification tests**

Append to `tests/familyCalendar.test.ts`:

```ts
test("expands weekly recurrence on selected weekdays", () => {
  const rule: FamilyRecurrenceRule = {
    eventId: "event-1",
    frequency: "weekly",
    intervalCount: 1,
    weekdays: [1, 3],
    startsOn: "2026-06-01",
    endsOn: "2026-06-08"
  };

  const occurrences = expandFamilyEventOccurrences({
    events: [baseEvent],
    recurrenceRules: [rule],
    exceptions: [],
    occurrenceStates: [],
    rangeStart: "2026-06-01T00:00:00.000Z",
    rangeEnd: "2026-06-10T00:00:00.000Z"
  });

  assert.deepEqual(occurrences.map(item => item.occurrenceDate), ["2026-06-02", "2026-06-04"]);
});

test("skips and moves individual occurrences", () => {
  const rule: FamilyRecurrenceRule = {
    eventId: "event-1",
    frequency: "daily",
    intervalCount: 1,
    weekdays: [],
    startsOn: "2026-06-04",
    endsOn: "2026-06-06"
  };

  const occurrences = expandFamilyEventOccurrences({
    events: [baseEvent],
    recurrenceRules: [rule],
    exceptions: [
      { id: "ex-1", eventId: "event-1", occurrenceDate: "2026-06-05", action: "skip" },
      {
        id: "ex-2",
        eventId: "event-1",
        occurrenceDate: "2026-06-06",
        action: "move",
        movedStartsAt: "2026-06-06T12:00:00.000Z",
        movedEndsAt: "2026-06-06T13:00:00.000Z"
      }
    ],
    occurrenceStates: [],
    rangeStart: "2026-06-04T00:00:00.000Z",
    rangeEnd: "2026-06-08T00:00:00.000Z"
  });

  assert.deepEqual(occurrences.map(item => item.occurrenceDate), ["2026-06-04", "2026-06-06"]);
  assert.equal(occurrences[1].occurrenceStartsAt, "2026-06-06T12:00:00.000Z");
});

test("marks one occurrence completed without completing the whole series", () => {
  const occurrences = mergeOccurrenceStates(
    [
      { ...baseEvent, occurrenceId: "event-1:2026-06-04", occurrenceDate: "2026-06-04", occurrenceStartsAt: baseEvent.startsAt, occurrenceStatus: "scheduled" },
      { ...baseEvent, occurrenceId: "event-1:2026-06-05", occurrenceDate: "2026-06-05", occurrenceStartsAt: "2026-06-05T09:00:00.000Z", occurrenceStatus: "scheduled" }
    ],
    [{ id: "state-1", eventId: "event-1", occurrenceDate: "2026-06-05", status: "completed", completedAt: "2026-06-05T09:30:00.000Z" }]
  );

  assert.equal(occurrences[0].occurrenceStatus, "scheduled");
  assert.equal(occurrences[1].occurrenceStatus, "completed");
});

test("creates scheduled notification jobs inside the horizon", () => {
  const preference: FamilyNotificationPreference = {
    id: "pref-1",
    familyId: "family-1",
    childId: "child-1",
    channel: "in_app",
    enabled: true,
    minutesBefore: 30,
    recipientUserId: "user-1"
  };

  const jobs = generateNotificationJobs({
    familyId: "family-1",
    occurrences: [
      { ...baseEvent, occurrenceId: "event-1:2026-06-04", occurrenceDate: "2026-06-04", occurrenceStartsAt: "2026-06-04T09:00:00.000Z", occurrenceStatus: "scheduled" }
    ],
    preferences: [preference],
    now: "2026-06-04T06:00:00.000Z",
    horizonDays: 60
  });

  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].deliverAt, "2026-06-04T08:30:00.000Z");
  assert.equal(jobs[0].status, "scheduled");
});

test("child color tokens are stable", () => {
  assert.equal(getChildColorToken("child-1"), getChildColorToken("child-1"));
  assert.notEqual(getChildColorToken("child-1"), "");
});
```

- [ ] **Step 5: Complete pure implementation**

Add exported `FamilyNotificationPreference`, `FamilyNotificationJobDraft`, `mergeOccurrenceStates`, `generateNotificationJobs`, and `getChildColorToken`. Use stable IDs for job drafts shaped as `${eventId}:${occurrenceDate}:${channel}:${recipientUserId}`.

- [ ] **Step 6: Run pure tests**

Run: `node --import tsx --test tests/familyCalendar.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit pure logic**

```bash
git add src/lib/familyCalendar.ts tests/familyCalendar.test.ts
git commit -m "feat: add family calendar domain logic"
```

## Task 2: Postgres Schema

**Files:**
- Modify: `db/postgres-schema.ts`
- Modify: `db/railway-postgres.sql`
- Modify: `docs/postgres-schema.sql`

- [ ] **Step 1: Add failing schema expectations**

Append a schema assertion test to `tests/familyCalendar.test.ts`:

```ts
import { POSTGRES_SCHEMA_SQL } from "../db/postgres-schema";

test("postgres schema includes family calendar tables", () => {
  for (const table of [
    "families",
    "family_members",
    "family_calendar_events",
    "family_event_assignments",
    "family_recurrence_rules",
    "family_recurrence_exceptions",
    "family_event_occurrence_states",
    "family_notification_preferences",
    "family_notification_jobs"
  ]) {
    assert.match(POSTGRES_SCHEMA_SQL, new RegExp(`create table if not exists ${table}`));
  }
});
```

- [ ] **Step 2: Run schema test to verify failure**

Run: `node --import tsx --test tests/familyCalendar.test.ts`

Expected: FAIL because the family calendar tables are missing.

- [ ] **Step 3: Add tables to `POSTGRES_SCHEMA_SQL`**

In `db/postgres-schema.ts`, add `create table if not exists` statements for the tables from the design. Use `uuid primary key default gen_random_uuid()`, references to `app_users(id)`, `families(id)`, and `children(id)`, and text checks for enum-like fields instead of new Postgres enum types to keep schema bootstrap idempotent.

Required constraints:

```sql
check (role in ('owner', 'parent', 'caregiver', 'doctor_viewer'))
check (event_type in ('medicine', 'appointment', 'queue', 'therapy', 'school', 'documents', 'home', 'family', 'other'))
check (source in ('manual', 'medication_plan', 'medical_booking', 'government_queue', 'parent_task'))
check (status in ('scheduled', 'completed', 'cancelled'))
check (frequency in ('daily', 'weekly', 'monthly'))
check (action in ('skip', 'move'))
check (channel in ('web_push', 'email', 'sms', 'in_app'))
check (status in ('scheduled', 'sent', 'failed', 'cancelled'))
```

Required indexes:

```sql
create index if not exists family_members_user_idx on family_members(user_id);
create index if not exists children_family_idx on children(family_id);
create index if not exists family_calendar_events_family_starts_idx on family_calendar_events(family_id, starts_at);
create index if not exists family_event_assignments_child_idx on family_event_assignments(child_id);
create index if not exists family_notification_jobs_due_idx on family_notification_jobs(status, deliver_at);
```

- [ ] **Step 4: Mirror schema in SQL docs**

Copy the same table and index definitions into `db/railway-postgres.sql` and add a concise documented version to `docs/postgres-schema.sql`.

- [ ] **Step 5: Run schema tests**

Run: `node --import tsx --test tests/familyCalendar.test.ts`

Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 7: Commit schema**

```bash
git add db/postgres-schema.ts db/railway-postgres.sql docs/postgres-schema.sql tests/familyCalendar.test.ts
git commit -m "feat: add family calendar postgres schema"
```

## Task 3: Express API

**Files:**
- Modify: `server.ts`
- Test: `tests/familyCalendar.test.ts`

- [ ] **Step 1: Add API mapper tests**

Append mapper tests to `tests/familyCalendar.test.ts` by exporting pure server-independent mapping helpers from `src/lib/familyCalendar.ts` if needed:

```ts
test("calendar occurrence keeps camelCase response fields", () => {
  const occurrence = expandFamilyEventOccurrences({
    events: [baseEvent],
    recurrenceRules: [],
    exceptions: [],
    occurrenceStates: [],
    rangeStart: "2026-06-04T00:00:00.000Z",
    rangeEnd: "2026-06-05T00:00:00.000Z"
  })[0];

  assert.equal(occurrence.startsAt, "2026-06-04T09:00:00.000Z");
  assert.equal(occurrence.occurrenceStartsAt, "2026-06-04T09:00:00.000Z");
  assert.deepEqual(occurrence.childIds, ["child-1"]);
});
```

- [ ] **Step 2: Run focused tests**

Run: `node --import tsx --test tests/familyCalendar.test.ts`

Expected: PASS before server changes; this guards response shape.

- [ ] **Step 3: Add server types**

In `server.ts`, add TypeScript types near existing API types:

```ts
type FamilyCalendarEventApi = {
  id?: string;
  familyId?: string;
  title: string;
  description?: string;
  eventType: "medicine" | "appointment" | "queue" | "therapy" | "school" | "documents" | "home" | "family" | "other";
  source?: "manual" | "medication_plan" | "medical_booking" | "government_queue" | "parent_task";
  sourceId?: string;
  startsAt: string;
  endsAt?: string;
  allDay?: boolean;
  status?: "scheduled" | "completed" | "cancelled";
  childIds?: string[];
  recurrenceRule?: {
    frequency: "daily" | "weekly" | "monthly";
    intervalCount: number;
    weekdays?: number[];
    monthDay?: number;
    startsOn: string;
    endsOn?: string;
  };
  notifyMinutesBefore?: number;
};
```

- [ ] **Step 4: Add family bootstrap helper**

Add `ensureUserFamily(user)` that:

1. Looks for an existing `family_members` row for `user.id`.
2. Creates `families(display_name, owner_user_id)` when missing.
3. Creates an owner `family_members` row.
4. Returns `{ familyId, role }`.

Use `pgQuery` and the existing `requireAuth` flow.

- [ ] **Step 5: Add child bootstrap helper**

Add `ensureFamilyChildFromLocalId(familyId, profile)` that upserts into `children` by `(family_id, local_child_id)` when the API receives a child assignment with only an existing local profile ID. The helper must set `color_token` with `getChildColorToken(localChildId)`.

- [ ] **Step 6: Add row mappers**

Add functions:

```ts
const familyEventFromDb = (row: any, childIds: string[] = []): FamilyCalendarEventApi => ({
  id: row.id,
  familyId: row.family_id,
  title: row.title,
  description: row.description || "",
  eventType: row.event_type,
  source: row.source,
  sourceId: row.source_id || undefined,
  startsAt: row.starts_at,
  endsAt: row.ends_at || undefined,
  allDay: Boolean(row.all_day),
  status: row.status,
  childIds,
  createdByUserId: row.created_by_user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const recurrenceRuleFromDb = (row: any) => ({
  eventId: row.event_id,
  frequency: row.frequency,
  intervalCount: Number(row.interval_count || 1),
  weekdays: Array.isArray(row.weekdays) ? row.weekdays : [],
  monthDay: row.month_day || undefined,
  startsOn: row.starts_on,
  endsOn: row.ends_on || undefined
});

const notificationPreferenceFromDb = (row: any) => ({
  id: row.id,
  familyId: row.family_id,
  childId: row.child_id || undefined,
  channel: row.channel,
  enabled: Boolean(row.enabled),
  minutesBefore: Number(row.minutes_before || 30),
  quietHoursStart: row.quiet_hours_start || undefined,
  quietHoursEnd: row.quiet_hours_end || undefined,
  recipientUserId: row.recipient_user_id
});

const notificationJobFromDb = (row: any) => ({
  id: row.id,
  familyId: row.family_id,
  eventId: row.event_id,
  occurrenceStartsAt: row.occurrence_starts_at,
  deliverAt: row.deliver_at,
  channel: row.channel,
  status: row.status,
  attemptCount: Number(row.attempt_count || 0),
  lastError: row.last_error || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});
```

Map snake_case DB fields to camelCase API fields.

- [ ] **Step 7: Add `GET /api/family-calendar`**

Route behavior:

1. Require auth.
2. Ensure user family.
3. Parse `from` and `to`; default to current month if missing.
4. Cap range to 90 days.
5. Load events, assignments, recurrence rules, exceptions, occurrence states for the family.
6. Expand occurrences with `expandFamilyEventOccurrences`.
7. Return `{ familyId, items, source: "postgres" }`.

- [ ] **Step 8: Add `POST /api/family-calendar/events`**

Route behavior:

1. Require auth and family.
2. Validate `title.trim()` and valid `startsAt`.
3. Insert `family_calendar_events` with source default `manual`.
4. Insert child assignments for provided child IDs.
5. Insert recurrence rule when present.
6. Generate notification jobs for enabled preferences and insert them.
7. Return saved event with recurrence and notification summary.

- [ ] **Step 9: Add update, delete, complete, exceptions routes**

Add:

```ts
app.patch("/api/family-calendar/events/:id", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const family = await ensureUserFamily(user);
  const id = req.params.id;
  const patch = req.body || {};
  const result = await pgQuery(
    `update family_calendar_events
       set title = coalesce($3, title),
           description = coalesce($4, description),
           starts_at = coalesce($5::timestamptz, starts_at),
           ends_at = $6::timestamptz,
           updated_at = now()
     where id = $1 and family_id = $2
     returning *`,
    [id, family.familyId, patch.title || null, patch.description || null, patch.startsAt || null, patch.endsAt || null]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "event_not_found" });
  res.json({ event: familyEventFromDb(result.rows[0]) });
});

app.delete("/api/family-calendar/events/:id", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const family = await ensureUserFamily(user);
  await pgQuery(
    "update family_calendar_events set status = 'cancelled', updated_at = now() where id = $1 and family_id = $2",
    [req.params.id, family.familyId]
  );
  await pgQuery(
    "update family_notification_jobs set status = 'cancelled', updated_at = now() where event_id = $1 and family_id = $2 and status = 'scheduled'",
    [req.params.id, family.familyId]
  );
  res.json({ ok: true });
});

app.post("/api/family-calendar/events/:id/complete", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const family = await ensureUserFamily(user);
  const occurrenceDate = String(req.body?.occurrenceDate || "").slice(0, 10);
  if (!occurrenceDate) return res.status(400).json({ error: "occurrence_date_required" });
  const event = await pgQuery("select id from family_calendar_events where id = $1 and family_id = $2", [req.params.id, family.familyId]);
  if (!event.rows[0]) return res.status(404).json({ error: "event_not_found" });
  await pgQuery(
    `insert into family_event_occurrence_states (event_id, occurrence_date, status, completed_by_user_id, completed_at)
     values ($1, $2, 'completed', $3, now())
     on conflict (event_id, occurrence_date)
     do update set status = 'completed', completed_by_user_id = excluded.completed_by_user_id, completed_at = now()`,
    [req.params.id, occurrenceDate, user.id]
  );
  res.json({ ok: true });
});

app.post("/api/family-calendar/events/:id/exceptions", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const family = await ensureUserFamily(user);
  const event = await pgQuery("select id from family_calendar_events where id = $1 and family_id = $2", [req.params.id, family.familyId]);
  if (!event.rows[0]) return res.status(404).json({ error: "event_not_found" });
  const action = req.body?.action === "move" ? "move" : "skip";
  const occurrenceDate = String(req.body?.occurrenceDate || "").slice(0, 10);
  if (!occurrenceDate) return res.status(400).json({ error: "occurrence_date_required" });
  await pgQuery(
    `insert into family_recurrence_exceptions (event_id, occurrence_date, action, moved_starts_at, moved_ends_at)
     values ($1, $2, $3, $4, $5)`,
    [req.params.id, occurrenceDate, action, req.body?.movedStartsAt || null, req.body?.movedEndsAt || null]
  );
  res.status(201).json({ ok: true });
});
```

Each route must verify the event belongs to the user's family before writing. Delete must set `status = 'cancelled'` and cancel future notification jobs.

- [ ] **Step 10: Add notification preference routes**

Add:

```ts
app.get("/api/family-calendar/notification-preferences", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const family = await ensureUserFamily(user);
  const result = await pgQuery(
    "select * from family_notification_preferences where family_id = $1 order by created_at desc",
    [family.familyId]
  );
  res.json({ items: result.rows.map(notificationPreferenceFromDb) });
});

app.patch("/api/family-calendar/notification-preferences", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const family = await ensureUserFamily(user);
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  await pgQuery("delete from family_notification_preferences where family_id = $1", [family.familyId]);
  for (const item of items) {
    await pgQuery(
      `insert into family_notification_preferences
       (family_id, child_id, channel, enabled, minutes_before, quiet_hours_start, quiet_hours_end, recipient_user_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        family.familyId,
        item.childId || null,
        item.channel,
        Boolean(item.enabled),
        Number(item.minutesBefore || 30),
        item.quietHoursStart || null,
        item.quietHoursEnd || null,
        item.recipientUserId || user.id
      ]
    );
  }
  res.json({ ok: true });
});
```

`PATCH` replaces the user's family preferences with validated rows, then recalculates future jobs for upcoming scheduled occurrences.

- [ ] **Step 11: Run server typecheck**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 12: Commit API**

```bash
git add server.ts src/lib/familyCalendar.ts tests/familyCalendar.test.ts
git commit -m "feat: add family calendar api"
```

## Task 4: Frontend Calendar API And Context

**Files:**
- Create: `src/lib/familyCalendarApi.ts`
- Modify: `src/context/ProfileContext.tsx`

- [ ] **Step 1: Create API client**

Create `src/lib/familyCalendarApi.ts`:

```ts
import type { FamilyCalendarEvent, FamilyCalendarOccurrence, FamilyNotificationPreference } from "./familyCalendar";

const readApiJson = async (response: Response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data?.error || "family_calendar_api_failed");
  return data;
};

export async function fetchFamilyCalendar(from: string, to: string): Promise<{ familyId: string; items: FamilyCalendarOccurrence[] }> {
  const response = await fetch(`/api/family-calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  return readApiJson(response);
}

export async function createFamilyCalendarEvent(event: Partial<FamilyCalendarEvent> & { title: string; startsAt: string }) {
  const response = await fetch("/api/family-calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
  return readApiJson(response);
}

export async function fetchFamilyNotificationPreferences(): Promise<{ items: FamilyNotificationPreference[] }> {
  const response = await fetch("/api/family-calendar/notification-preferences");
  return readApiJson(response);
}
```

Also add `updateFamilyCalendarEvent`, `deleteFamilyCalendarEvent`, `completeFamilyCalendarEvent`, and `saveFamilyNotificationPreferences` with the same fetch pattern.

- [ ] **Step 2: Extend `ProfileContextType`**

Add to `src/context/ProfileContext.tsx`:

```ts
familyCalendarItems: FamilyCalendarOccurrence[];
familyCalendarError: string;
isFamilyCalendarLoading: boolean;
loadFamilyCalendar: (from: string, to: string) => Promise<void>;
createCalendarEvent: (event: { title: string; startsAt: string; endsAt?: string; childIds: string[]; eventType: FamilyEventType; description?: string; notifyMinutesBefore?: number }) => Promise<void>;
completeCalendarOccurrence: (eventId: string, occurrenceDate: string) => Promise<void>;
```

- [ ] **Step 3: Implement context state and actions**

Inside `ProfileProvider`, add React state for items/loading/error. Implement `loadFamilyCalendar` by calling `fetchFamilyCalendar`. Implement `createCalendarEvent` and `completeCalendarOccurrence` by calling the API and reloading the current month range.

- [ ] **Step 4: Add graceful fallback**

If the API returns `auth_required` or backend failure, set `familyCalendarError` and keep existing local tracker sections usable. Do not clear child profiles or medication state.

- [ ] **Step 5: Run typecheck**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit frontend API/context**

```bash
git add src/lib/familyCalendarApi.ts src/context/ProfileContext.tsx
git commit -m "feat: connect family calendar context"
```

## Task 5: Care Tracker Family UI

**Files:**
- Modify: `src/components/CareTrackerTab.tsx`

- [ ] **Step 1: Add family view type and tab**

Change:

```ts
type TrackerView = "family" | "day" | "meds" | "food" | "queues" | "report";
```

Add segmented control item:

```ts
{ id: "family", label: "Семья", icon: CalendarCheck }
```

Use a six-column grid or horizontally scrollable segmented row to prevent cramped text.

- [ ] **Step 2: Add selected month/day state**

Add state:

```ts
const [familyFilterChildId, setFamilyFilterChildId] = React.useState<string>("all");
const [familyMonthDate, setFamilyMonthDate] = React.useState(() => new Date());
const [selectedFamilyDate, setSelectedFamilyDate] = React.useState(todayDate());
```

Use `loadFamilyCalendar(monthStartIso, monthEndIso)` in an effect whenever the month changes.

- [ ] **Step 3: Add child switcher**

Render buttons:

```tsx
<button type="button" onClick={() => setFamilyFilterChildId("all")}>Вся семья</button>
{profiles.map(child => (
  <button key={child.id} type="button" onClick={() => setFamilyFilterChildId(child.id)}>
    <span style={{ backgroundColor: getChildColorToken(child.id) }} />
    {child.childName}
  </button>
))}
```

Use existing app styling classes instead of inline cards nested inside cards.

- [ ] **Step 4: Render compact month**

Create local helper functions in `CareTrackerTab.tsx`:

```ts
function getMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const leadingEmptyDays = firstDay === 0 ? 6 : firstDay - 1;
  return [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1))
  ];
}

function sameIsoDate(a: string, b: string) { return a.slice(0, 10) === b.slice(0, 10); }

function filterOccurrencesByChild(items: FamilyCalendarOccurrence[], childId: string) {
  if (childId === "all") return items;
  return items.filter(item => item.childIds.includes(childId));
}
```

Each day button shows day number and up to three child color dots based on `occurrence.childIds`; show `+N` for overflow.

- [ ] **Step 5: Render selected-day agenda**

For `selectedFamilyDate`, render sorted event cards with:

- time or `Весь день`;
- title;
- child badges;
- event type label;
- source label: `manual` = editable, system sources = source section label;
- notification label from available jobs/preference summary: `Запланировано на сервере` or `Нужна настройка канала`.

- [ ] **Step 6: Add create form**

Add inline panel with state:

```ts
const [newFamilyEventTitle, setNewFamilyEventTitle] = React.useState("");
const [newFamilyEventType, setNewFamilyEventType] = React.useState<FamilyEventType>("family");
const [newFamilyEventChildIds, setNewFamilyEventChildIds] = React.useState<string[]>([]);
const [newFamilyEventDateTime, setNewFamilyEventDateTime] = React.useState(nowLocalInput());
const [newFamilyEventNotifyMinutes, setNewFamilyEventNotifyMinutes] = React.useState("30");
const [newFamilyEventDescription, setNewFamilyEventDescription] = React.useState("");
```

On submit, call `createCalendarEvent`. Disable submit when title is blank or datetime is invalid.

- [ ] **Step 7: Add completion action**

For scheduled occurrences, add a small `Готово` button that calls:

```ts
completeCalendarOccurrence(item.id, item.occurrenceDate)
```

Keep system events read-only except completion state if the API allows it.

- [ ] **Step 8: Run typecheck**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 9: Commit UI**

```bash
git add src/components/CareTrackerTab.tsx
git commit -m "feat: add family calendar tracker view"
```

## Task 6: Verification And Manual QA

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run focused family tests**

Run: `node --import tsx --test tests/familyCalendar.test.ts`

Expected: PASS.

- [ ] **Step 2: Run existing tracker tests**

Run:

```bash
node --import tsx --test tests/careTracker.test.ts
node --import tsx --test tests/governmentQueueMonitor.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Start local app**

Run: `env PORT=5555 npm run dev`

Expected: server starts on `http://localhost:5555`.

- [ ] **Step 6: Browser QA**

Open `http://localhost:5555` in the in-app browser and verify:

- parent can log in or register;
- tracker has `Семья` mode;
- `Вся семья` and child filters switch without auth changes;
- month view shows colored dots for multiple child assignments;
- creating an event adds it to the selected day;
- recurring event occurrences appear across days;
- completing one occurrence does not complete the whole series;
- notification status is visible and does not claim real push delivery;
- existing `Лек.`, `Еда`, `Очереди`, and `Отчет` views still work.

- [ ] **Step 7: Inspect diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only intended family calendar files are modified. Existing unrelated user changes remain untouched.

- [ ] **Step 8: Final commit**

If verification passes and all previous task commits were made:

```bash
git add src/lib/familyCalendar.ts tests/familyCalendar.test.ts db/postgres-schema.ts db/railway-postgres.sql docs/postgres-schema.sql server.ts src/lib/familyCalendarApi.ts src/context/ProfileContext.tsx src/components/CareTrackerTab.tsx
git commit -m "feat: add backend family calendar"
```

Skip this final commit if the task-level commits already contain all changes.

## Self-Review Notes

- Spec coverage: recurrence, backend schema, authenticated API, notification job readiness, `Семья` UI mode, child grouping, and medical-session switching are covered.
- Out of scope preserved: no actual Web Push/SMS/email delivery, no full migration of every local tracker table, no external family sharing.
- Risk area: `server.ts` is already large. Keep helper functions grouped near existing Postgres/auth helpers and avoid unrelated refactors during this implementation.
