import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDoctorTrackerReport,
  getMedicationEventStatus,
  sortMedicationEventsForDay,
  type DietRuleSummary,
  type FoodLogSummary,
  type MedicationEventSummary,
  type MedicationPlanSummary,
  type ReactionLogSummary
} from "../src/lib/careTracker";

test("medication event status respects exact window, late confirmation, and skipped events", () => {
  assert.equal(
    getMedicationEventStatus({
      plannedAt: "2026-06-04T08:00:00.000Z",
      takenAt: "2026-06-04T08:12:00.000Z",
      status: "taken",
      reminderWindowMinutes: 15
    }),
    "on_time"
  );

  assert.equal(
    getMedicationEventStatus({
      plannedAt: "2026-06-04T08:00:00.000Z",
      takenAt: "2026-06-04T08:35:00.000Z",
      status: "taken",
      reminderWindowMinutes: 15
    }),
    "late"
  );

  assert.equal(
    getMedicationEventStatus({
      plannedAt: "2026-06-04T08:00:00.000Z",
      status: "skipped",
      reminderWindowMinutes: 15
    }),
    "skipped"
  );
});

test("sortMedicationEventsForDay puts events in planned time order", () => {
  const events: MedicationEventSummary[] = [
    {
      id: "evening",
      childId: "child-1",
      childName: "Алия",
      planName: "Витамин D",
      doseText: "1 капля",
      plannedAt: "2026-06-04T18:00:00.000Z",
      status: "planned",
      reminderWindowMinutes: 30
    },
    {
      id: "morning",
      childId: "child-1",
      childName: "Алия",
      planName: "Витамин D",
      doseText: "1 капля",
      plannedAt: "2026-06-04T08:00:00.000Z",
      status: "planned",
      reminderWindowMinutes: 30
    }
  ];

  assert.deepEqual(sortMedicationEventsForDay(events).map(event => event.id), ["morning", "evening"]);
});

test("buildDoctorTrackerReport keeps medication, diet, food, reaction, and safety context together", () => {
  const medications: MedicationPlanSummary[] = [
    {
      childId: "child-1",
      childName: "Алия",
      name: "Препарат X",
      doseText: "1/2 таблетки утром",
      scheduleText: "08:00 каждый день",
      foodRelation: "после завтрака",
      active: true
    }
  ];
  const medicationEvents: MedicationEventSummary[] = [
    {
      id: "event-1",
      childId: "child-1",
      childName: "Алия",
      planName: "Препарат X",
      doseText: "1/2 таблетки утром",
      plannedAt: "2026-06-04T08:00:00.000Z",
      takenAt: "2026-06-04T08:10:00.000Z",
      status: "taken",
      reminderWindowMinutes: 15
    },
    {
      id: "event-2",
      childId: "child-1",
      childName: "Алия",
      planName: "Препарат X",
      doseText: "1/2 таблетки утром",
      plannedAt: "2026-06-05T08:00:00.000Z",
      status: "skipped",
      skipReason: "отказ",
      reminderWindowMinutes: 15
    }
  ];
  const dietRules: DietRuleSummary[] = [
    {
      childId: "child-1",
      childName: "Алия",
      type: "allergen",
      title: "Молочный белок",
      details: "исключить по назначению врача",
      active: true
    }
  ];
  const foodLogs: FoodLogSummary[] = [
    {
      childId: "child-1",
      childName: "Алия",
      eatenAt: "2026-06-04T12:20:00.000Z",
      foodText: "гречка и индейка",
      reaction: "спокойно"
    }
  ];
  const reactions: ReactionLogSummary[] = [
    {
      childId: "child-1",
      childName: "Алия",
      happenedAt: "2026-06-04T21:00:00.000Z",
      title: "трудно уснула",
      intensity: 3,
      possibleTrigger: "новый продукт"
    }
  ];

  const report = buildDoctorTrackerReport({
    childName: "Алия",
    periodLabel: "4-5 июня 2026",
    medications,
    medicationEvents,
    dietRules,
    foodLogs,
    reactions
  });

  assert.match(report, /Алия/);
  assert.match(report, /4-5 июня 2026/);
  assert.match(report, /Препарат X/);
  assert.match(report, /1\/2 таблетки утром/);
  assert.match(report, /пропущено: 1/);
  assert.match(report, /Молочный белок/);
  assert.match(report, /гречка и индейка/);
  assert.match(report, /трудно уснула/);
  assert.match(report, /не заменяет назначение врача/);
});
