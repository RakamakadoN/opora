import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCalendarReminderIcs,
  calculateBureaucracyProgress,
  getBureaucracyChecklist,
  getNearestDeadline,
  validateAttachment,
  validateBureaucracyDocumentRecord,
  type BureaucracyDeadline,
  type BureaucracyDocumentRecord
} from "../src/lib/disabilityBureaucracy";

test("checklist includes medical, MSE, decision, benefits, and renewal groups", () => {
  const checklist = getBureaucracyChecklist("Диагноз подтвержден");
  const stages = new Set(checklist.map(item => item.stage));

  assert.equal(stages.has("medical_preparation"), true);
  assert.equal(stages.has("vkk_referral"), true);
  assert.equal(stages.has("mse_review"), true);
  assert.equal(stages.has("decision_received"), true);
  assert.equal(stages.has("benefits_services"), true);
  assert.equal(stages.has("renewal"), true);
  assert.equal(checklist.some(item => /МСЭ/.test(item.title)), true);
  assert.equal(checklist.some(item => item.warning?.includes("электронно")), true);
});

test("progress counts required documents separately from total documents", () => {
  const checklist = getBureaucracyChecklist("Диагноз подтвержден");
  const checkedIds = checklist.slice(0, 3).map(item => item.id);
  const requiredCheckedIds = checklist.filter(item => item.required).slice(0, 2).map(item => item.id);
  const progress = calculateBureaucracyProgress(checklist, [...checkedIds, ...requiredCheckedIds]);

  assert.equal(progress.checkedCount >= 3, true);
  assert.equal(progress.totalCount, checklist.length);
  assert.equal(progress.requiredTotal > 0, true);
  assert.equal(progress.requiredChecked >= 2, true);
  assert.equal(progress.percent > 0, true);
  assert.equal(progress.percent <= 100, true);
});

test("document validation rejects missing required data and impossible expiry dates", () => {
  const checklist = getBureaucracyChecklist("Диагноз подтвержден");
  const expiringDoc = checklist.find(item => item.needsExpiryDate);
  assert.ok(expiringDoc);

  const invalidRecord: BureaucracyDocumentRecord = {
    documentId: expiringDoc.id,
    collected: true,
    title: expiringDoc.title,
    source: "",
    issueDate: "2026-06-10",
    expiryDate: "2026-06-01",
    note: "",
    attachments: []
  };

  const errors = validateBureaucracyDocumentRecord(expiringDoc, invalidRecord);
  assert.match(errors.source || "", /укажите/i);
  assert.match(errors.expiryDate || "", /раньше/i);
  assert.match(errors.attachment || "", /скан|оригинал/i);
});

test("nearest deadline prefers overdue first, then upcoming by date", () => {
  const deadlines: BureaucracyDeadline[] = [
    {
      id: "future",
      childId: "child-1",
      title: "МСЭ",
      type: "mse_appointment",
      date: "2026-06-20",
      createdAt: "2026-06-04T00:00:00.000Z"
    },
    {
      id: "overdue",
      childId: "child-1",
      title: "Донести справку",
      type: "missing_documents",
      date: "2026-06-01",
      createdAt: "2026-06-04T00:00:00.000Z"
    }
  ];

  const nearest = getNearestDeadline(deadlines, "2026-06-04");
  assert.equal(nearest?.id, "overdue");
  assert.equal(nearest?.status, "overdue");
});

test("calendar reminder generation produces escaped ICS text", () => {
  const deadline: BureaucracyDeadline = {
    id: "deadline-1",
    childId: "child-1",
    title: "МСЭ: комиссия, документы",
    type: "mse_appointment",
    date: "2026-06-20",
    time: "10:30",
    note: "Взять справку\nи копии",
    createdAt: "2026-06-04T00:00:00.000Z"
  };

  const ics = buildCalendarReminderIcs({
    deadline,
    childName: "Алия",
    checklistSummary: "Готово 3 из 8"
  });

  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /SUMMARY:МСЭ: комиссия\\, документы/);
  assert.match(ics, /DTSTART:20260620T103000/);
  assert.match(ics, /Алия/);
  assert.match(ics, /Взять справку\\nи копии/);
  assert.match(ics, /END:VCALENDAR/);
});

test("attachment validation accepts small images and rejects unsupported or large files", () => {
  assert.equal(validateAttachment({ type: "image/png", size: 500_000 }), "");
  assert.match(validateAttachment({ type: "text/plain", size: 10 }), /JPG|PNG|PDF/);
  assert.match(validateAttachment({ type: "application/pdf", size: 2_000_000 }), /меньше/);
});
