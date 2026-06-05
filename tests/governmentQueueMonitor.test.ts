import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapsRouteUrl,
  getGovernmentQueueReminder,
  getGovernmentQueueStatus,
  sortGovernmentQueueRecords,
  type GovernmentQueueRecordSummary
} from "../src/lib/governmentQueueMonitor";

const baseRecord: GovernmentQueueRecordSummary = {
  id: "record-1",
  childId: "child-1",
  childName: "Алишер",
  serviceTitle: "ПМПК",
  institutionName: "Городская ПМПК",
  institutionAddress: "Алматы, Абая 10",
  appointmentAt: "2026-06-05T09:00:00.000Z",
  queueNumber: 42,
  currentQueueNumber: 10,
  status: "waiting",
  createdAt: "2026-06-04T06:00:00.000Z",
  updatedAt: "2026-06-04T06:00:00.000Z"
};

test("queue is ready when current queue number reaches the user's number", () => {
  const now = new Date("2026-06-04T08:00:00.000Z");

  assert.equal(getGovernmentQueueStatus({ ...baseRecord, currentQueueNumber: 42 }, now), "ready");
  assert.equal(
    getGovernmentQueueReminder({ ...baseRecord, currentQueueNumber: 42 }, now)?.message,
    "Очередь подошла"
  );
});

test("appointment reminders distinguish tomorrow and today", () => {
  const today = new Date("2026-06-04T08:00:00.000Z");

  assert.equal(
    getGovernmentQueueReminder({ ...baseRecord, appointmentAt: "2026-06-05T09:00:00.000Z" }, today)?.message,
    "Визит завтра"
  );
  assert.equal(
    getGovernmentQueueReminder({ ...baseRecord, appointmentAt: "2026-06-04T15:00:00.000Z" }, today)?.message,
    "Визит сегодня"
  );
});

test("completed and cancelled records do not produce reminders", () => {
  const now = new Date("2026-06-04T08:00:00.000Z");

  assert.equal(getGovernmentQueueReminder({ ...baseRecord, status: "completed", currentQueueNumber: 42 }, now), null);
  assert.equal(getGovernmentQueueReminder({ ...baseRecord, status: "cancelled", currentQueueNumber: 42 }, now), null);
});

test("records are sorted by urgency and appointment time", () => {
  const now = new Date("2026-06-04T08:00:00.000Z");
  const sorted = sortGovernmentQueueRecords(
    [
      { ...baseRecord, id: "later", appointmentAt: "2026-06-10T09:00:00.000Z", currentQueueNumber: 1 },
      { ...baseRecord, id: "ready", appointmentAt: "2026-06-06T09:00:00.000Z", currentQueueNumber: 42 },
      { ...baseRecord, id: "today", appointmentAt: "2026-06-04T12:00:00.000Z", currentQueueNumber: 1 }
    ],
    now
  );

  assert.deepEqual(sorted.map(record => record.id), ["ready", "today", "later"]);
});

test("map route URL includes the encoded address", () => {
  const url = buildMapsRouteUrl("Алматы, Абая 10");

  assert.match(url, /^https:\/\/www\.google\.com\/maps\/search\/\?/);
  assert.match(url, /%D0%90%D0%BB%D0%BC%D0%B0%D1%82%D1%8B/);
});
