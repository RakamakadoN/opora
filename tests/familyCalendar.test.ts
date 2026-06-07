import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFamilyCalendarEventsFromSources,
  expandFamilyEventOccurrences,
  generateNotificationJobs,
  getChildColorToken,
  mergeOccurrenceStates,
  type FamilyCalendarEvent,
  type FamilyNotificationPreference,
  type FamilyRecurrenceRule
} from "../src/lib/familyCalendar";
import { POSTGRES_SCHEMA_SQL } from "../db/postgres-schema";

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

test("expands monthly recurrence on selected month day", () => {
  const rule: FamilyRecurrenceRule = {
    eventId: "event-1",
    frequency: "monthly",
    intervalCount: 1,
    monthDay: 4,
    startsOn: "2026-06-04",
    endsOn: "2026-08-04"
  };

  const occurrences = expandFamilyEventOccurrences({
    events: [baseEvent],
    recurrenceRules: [rule],
    exceptions: [],
    occurrenceStates: [],
    rangeStart: "2026-06-01T00:00:00.000Z",
    rangeEnd: "2026-09-01T00:00:00.000Z"
  });

  assert.deepEqual(occurrences.map(item => item.occurrenceDate), ["2026-06-04", "2026-07-04", "2026-08-04"]);
});

test("includes non-recurring events that start inside the range", () => {
  const occurrences = expandFamilyEventOccurrences({
    events: [baseEvent],
    recurrenceRules: [],
    exceptions: [],
    occurrenceStates: [],
    rangeStart: "2026-06-04T00:00:00.000Z",
    rangeEnd: "2026-06-05T00:00:00.000Z"
  });

  assert.deepEqual(occurrences.map(item => item.occurrenceDate), ["2026-06-04"]);
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

test("builds shared family schedule events from care sources", () => {
  const { events, recurrenceRules } = buildFamilyCalendarEventsFromSources({
    familyId: "family-1",
    createdByUserId: "parent-1",
    now: "2026-06-01T08:00:00.000Z",
    medicationPlans: [
      {
        id: "plan-1",
        childId: "child-1",
        childName: "Алишер",
        name: "Витамин D",
        doseText: "1 капля",
        scheduleText: "Каждый день утром",
        foodRelation: "после завтрака",
        reminderTimes: ["09:00"],
        reminderWindowMinutes: 30,
        repeatEveryMinutes: 15,
        startDate: "2026-06-01",
        active: true
      }
    ],
    medicalBookings: [
      {
        id: "booking-1",
        childId: "child-2",
        childName: "Мира",
        doctorName: "Д-р Ким",
        doctorTitle: "Невролог",
        doctorCity: "Алматы",
        date: "2026-06-02",
        time: "11:30",
        status: "confirmed"
      }
    ],
    governmentQueueRecords: [
      {
        id: "queue-1",
        childId: "child-1",
        childName: "Алишер",
        serviceTitle: "ПМПК",
        institutionName: "КППК",
        institutionAddress: "Алматы",
        appointmentAt: "2026-06-03T05:00:00.000Z",
        status: "waiting",
        createdAt: "2026-06-01T08:00:00.000Z",
        updatedAt: "2026-06-01T08:00:00.000Z"
      }
    ],
    parentTasks: [
      {
        id: "task-1",
        childId: "child-2",
        title: "Собрать заключения",
        description: "Проверить папку перед приемом",
        category: "documents",
        status: "todo",
        dueDate: "2026-06-04",
        source: "manual"
      }
    ]
  });

  assert.deepEqual(events.map(event => event.source), [
    "medication_plan",
    "medical_booking",
    "government_queue",
    "parent_task"
  ]);
  assert.deepEqual(events.map(event => event.childIds), [["child-1"], ["child-2"], ["child-1"], ["child-2"]]);
  assert.equal(recurrenceRules[0].eventId, "medication-plan-1-09-00");

  const occurrences = expandFamilyEventOccurrences({
    events,
    recurrenceRules,
    exceptions: [],
    occurrenceStates: [],
    rangeStart: "2026-06-01T00:00:00.000Z",
    rangeEnd: "2026-06-05T00:00:00.000Z"
  });

  assert.deepEqual(
    occurrences.map(occurrence => `${occurrence.occurrenceDate}:${occurrence.source}:${occurrence.title}`),
    [
      "2026-06-01:medication_plan:Витамин D",
      "2026-06-02:medication_plan:Витамин D",
      "2026-06-02:medical_booking:Невролог: Д-р Ким",
      "2026-06-03:medication_plan:Витамин D",
      "2026-06-03:government_queue:ПМПК",
      "2026-06-04:parent_task:Собрать заключения",
      "2026-06-04:medication_plan:Витамин D"
    ]
  );
});

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
